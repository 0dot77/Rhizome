'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Sprout } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCanvasStore } from '@/store/useCanvasStore';

export interface TextNodeData extends Record<string, unknown> {
  text: string;
}

export type TextNodeType = Node<TextNodeData, 'text'>;

export function TextNode({ id, data, selected }: NodeProps<TextNodeType>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeText = useCanvasStore((state) => state.updateNodeText);
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeText(id, e.target.value);
    },
    [id, updateNodeText]
  );

  const handleExpand = useCallback(() => {
    alert('Expanding...');
  }, []);

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
          className="h-8 w-8 bg-white shadow-md border border-zinc-200 hover:bg-amber-50"
          onClick={handleExpand}
        >
          <Sprout className="h-4 w-4 text-green-600" />
        </Button>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} className="!bg-zinc-400" />
      <Card
        className={`min-w-[200px] max-w-[300px] p-3 bg-amber-50 border-amber-200 shadow-md transition-shadow ${
          selected ? 'shadow-lg ring-2 ring-amber-400' : ''
        }`}
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
        />
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400" />
    </>
  );
}
