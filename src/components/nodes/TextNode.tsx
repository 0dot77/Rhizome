'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCanvasStore, ExpandedConcept } from '@/store/useCanvasStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export interface TextNodeData extends Record<string, unknown> {
  text: string;
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

  return (
    <>
      <NodeToolbar isVisible={showToolbar} position={Position.Right}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-white shadow-md border border-zinc-200 hover:bg-amber-50 disabled:opacity-50"
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

      <Handle type="target" position={Position.Top} className="!bg-zinc-400" />
      <Card
        className={`min-w-[200px] max-w-[300px] p-3 bg-amber-50 border-amber-200 shadow-md transition-shadow ${
          selected ? 'shadow-lg ring-2 ring-amber-400' : ''
        } ${isExpanding ? 'opacity-70' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <textarea
          ref={textareaRef}
          value={data.text}
          onChange={handleChange}
          placeholder="Type your idea..."
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-800 placeholder:text-zinc-400"
          rows={1}
          disabled={isExpanding}
        />
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400" />
    </>
  );
}
