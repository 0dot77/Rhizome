'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCanvasStore, ExpandedConcept } from '@/store/useCanvasStore';
import { useSettingsStore } from '@/store/useSettingsStore';

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
  const removeSkeletonNodes = useCanvasStore((state) => state.removeSkeletonNodes);
  const anthropicKey = useSettingsStore((state) => state.anthropicKey);
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

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

  // Figma/Miro style sticky note colors
  const containerStyles = isAI
    ? 'bg-blue-50 border-t-blue-500'
    : 'bg-yellow-50 border-t-yellow-500';

  const selectedStyles = isAI
    ? 'ring-2 ring-blue-400 shadow-xl'
    : 'ring-2 ring-yellow-400 shadow-xl';

  return (
    <>
      <NodeToolbar isVisible={showToolbar} position={Position.Right}>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 shadow-md border disabled:opacity-50 ${
            isAI
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
          }`}
          onClick={handleExpand}
          disabled={isExpanding}
        >
          {isExpanding ? (
            <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
          ) : (
            <Sprout className="h-4 w-4 text-green-600" />
          )}
        </Button>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3" />

      {/* Figma/Miro style sticky note */}
      <div
        className={`
          min-w-[220px] max-w-[320px]
          min-h-[120px]
          p-6
          rounded-md
          border-t-8
          shadow-lg
          transition-all duration-200
          ${containerStyles}
          ${selected ? selectedStyles : 'hover:shadow-xl'}
          ${isExpanding ? 'opacity-70' : ''}
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
            min-h-[80px]
            bg-transparent
            border-none
            outline-none
            resize-none
            text-sm
            leading-relaxed
            whitespace-pre-wrap
            ${isAI ? 'text-blue-900 placeholder:text-blue-300' : 'text-yellow-900 placeholder:text-yellow-400'}
          `}
          rows={3}
          disabled={isExpanding}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-3 !h-3" />
    </>
  );
}
