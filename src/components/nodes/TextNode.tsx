'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCanvasStore, ExpandedConcept } from '@/store/useCanvasStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PERSONA_LIST, PersonaType } from '@/lib/personas';

export interface TextNodeData extends Record<string, unknown> {
  text: string;
  isAI?: boolean;
}

export type TextNodeType = Node<TextNodeData, 'text'>;

export function TextNode({ id, data, selected }: NodeProps<TextNodeType>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeText = useCanvasStore((state) => state.updateNodeText);
  const expandNode = useCanvasStore((state) => state.expandNode);
  const addSkeletonNodes = useCanvasStore((state) => state.addSkeletonNodes);
  const addSingleSkeletonNode = useCanvasStore((state) => state.addSingleSkeletonNode);
  const removeSkeletonNodes = useCanvasStore((state) => state.removeSkeletonNodes);
  const addPersonaNode = useCanvasStore((state) => state.addPersonaNode);
  const layoutDirection = useCanvasStore((state) => state.layoutDirection);
  const anthropicKey = useSettingsStore((state) => state.anthropicKey);
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);

  const isVertical = layoutDirection === 'VERTICAL';

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [activePersona, setActivePersona] = useState<PersonaType | null>(null);

  const isAI = data.isAI ?? false;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeText(id, e.target.value);
    },
    [id, updateNodeText]
  );

  const handleExpand = useCallback(async () => {
    if (!data.text.trim()) {
      toast.warning('Please enter some text first');
      return;
    }

    if (!anthropicKey) {
      toast.error('API key required. Opening settings...');
      setIsSettingsOpen(true);
      return;
    }

    setIsExpanding(true);

    // Show optimistic skeleton nodes
    const skeletonIds = addSkeletonNodes(id);

    // Show loading toast
    const toastId = toast.loading('Expanding idea...');

    try {
      const response = await fetch('/api/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: data.text,
          apiKey: anthropicKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to expand');
      }

      const result: { concepts: ExpandedConcept[] } = await response.json();

      // Replace skeleton nodes with real nodes
      expandNode(id, result.concepts, skeletonIds);

      toast.success('Idea expanded successfully!', { id: toastId });
    } catch (error) {
      console.error('Expansion error:', error);

      // Remove skeleton nodes on error
      removeSkeletonNodes(skeletonIds);

      const errorMessage = error instanceof Error ? error.message : 'Failed to expand idea';

      // Check for common API key errors
      if (errorMessage.includes('401') || errorMessage.includes('invalid') || errorMessage.includes('key')) {
        toast.error('Failed to expand. Check your API Key.', { id: toastId });
      } else {
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      setIsExpanding(false);
    }
  }, [id, data.text, anthropicKey, expandNode, addSkeletonNodes, removeSkeletonNodes, setIsSettingsOpen]);

  const handlePersonaClick = useCallback(async (persona: PersonaType, index: number) => {
    if (!data.text.trim()) {
      toast.warning('Please enter some text first');
      return;
    }

    if (!anthropicKey) {
      toast.error('API key required. Opening settings...');
      setIsSettingsOpen(true);
      return;
    }

    setActivePersona(persona);

    // Show optimistic skeleton node
    const skeletonId = addSingleSkeletonNode(id, index);
    if (!skeletonId) return;

    const personaConfig = PERSONA_LIST.find(p => p.type === persona);
    const toastId = toast.loading(`${personaConfig?.emoji} ${personaConfig?.name} is thinking...`);

    try {
      const response = await fetch('/api/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: data.text,
          apiKey: anthropicKey,
          persona,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate');
      }

      const result: { title: string; content: string } = await response.json();

      // Replace skeleton node with real node
      addPersonaNode(id, result.title, result.content, skeletonId);

      toast.success(`${personaConfig?.emoji} ${personaConfig?.name} responded!`, { id: toastId });
    } catch (error) {
      console.error('Persona error:', error);

      // Remove skeleton node on error
      removeSkeletonNodes([skeletonId]);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate';

      if (errorMessage.includes('401') || errorMessage.includes('invalid') || errorMessage.includes('key')) {
        toast.error('Failed. Check your API Key.', { id: toastId });
      } else {
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      setActivePersona(null);
    }
  }, [id, data.text, anthropicKey, addSingleSkeletonNode, addPersonaNode, removeSkeletonNodes, setIsSettingsOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [data.text]);

  // Focus textarea when node is newly created (empty text)
  useEffect(() => {
    if (selected && data.text === '' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selected, data.text]);

  const showToolbar = isHovered || selected;
  const isDisabled = isExpanding || activePersona !== null;

  // Figma/Miro style sticky note colors
  const containerStyles = isAI
    ? 'bg-blue-50 border-t-blue-500'
    : 'bg-yellow-50 border-t-yellow-500';

  const selectedStyles = isAI
    ? 'ring-2 ring-blue-400 shadow-xl'
    : 'ring-2 ring-yellow-400 shadow-xl';

  // Persona button colors
  const personaColors: Record<string, string> = {
    purple: 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700',
    orange: 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700',
    green: 'bg-green-100 hover:bg-green-200 border-green-300 text-green-700',
    pink: 'bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700',
  };

  // Toolbar position based on layout direction
  // Vertical: toolbar on right (expand downward, buttons visible on side)
  // Horizontal: toolbar on bottom (expand rightward, buttons visible below)
  const toolbarPosition = isVertical ? Position.Right : Position.Bottom;

  // Handle positions based on layout direction
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  return (
    <>
      {/* Persona Toolbar - Position adapts to layout direction */}
      <NodeToolbar isVisible={showToolbar} position={toolbarPosition}>
        <div className={`flex gap-1.5 ${isVertical ? 'flex-col' : 'flex-row'}`}>
          {/* Expand All button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shadow-md border disabled:opacity-50 ${
              isAI
                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
            }`}
            onClick={handleExpand}
            disabled={isDisabled}
            title="Expand into 4 directions"
          >
            {isExpanding ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
          </Button>

          {/* Persona buttons */}
          {PERSONA_LIST.map((persona, index) => (
            <Button
              key={persona.type}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 shadow-md border disabled:opacity-50 ${personaColors[persona.color]}`}
              onClick={() => handlePersonaClick(persona.type, index)}
              disabled={isDisabled}
              title={`${persona.name}: ${persona.role}`}
            >
              {activePersona === persona.type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-sm">{persona.emoji}</span>
              )}
            </Button>
          ))}
        </div>
      </NodeToolbar>

      {/* Connection handles - Position adapts to layout direction */}
      <Handle type="target" position={targetPosition} className="!bg-zinc-400 !w-3 !h-3" />

      {/* Figma/Miro style sticky note - Fixed width, auto-height */}
      <div
        className={`
          w-64
          min-h-[160px]
          p-8
          rounded-md
          border-t-8
          shadow-lg
          overflow-hidden
          box-border
          transition-all duration-300 ease-in-out
          ${containerStyles}
          ${selected ? selectedStyles : 'hover:shadow-xl'}
          ${isDisabled ? 'opacity-70' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <textarea
          ref={textareaRef}
          value={data.text}
          onChange={handleChange}
          placeholder="Type your idea..."
          className={`
            w-full
            min-h-[100px]
            bg-transparent
            border-none
            outline-none
            resize-none
            overflow-hidden
            text-sm
            leading-relaxed
            whitespace-pre-wrap
            transition-[height] duration-200 ease-in-out
            ${isAI ? 'text-blue-900 placeholder:text-blue-300' : 'text-yellow-900 placeholder:text-yellow-400'}
          `}
          rows={4}
          disabled={isDisabled}
        />
      </div>

      <Handle type="source" position={sourcePosition} className="!bg-zinc-400 !w-3 !h-3" />
    </>
  );
}
