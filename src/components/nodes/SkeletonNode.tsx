'use client';

import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Skeleton } from '@/components/ui/skeleton';

export interface SkeletonNodeData extends Record<string, unknown> {
  parentId: string;
}

export type SkeletonNodeType = Node<SkeletonNodeData, 'skeleton'>;

export function SkeletonNode({ }: NodeProps<SkeletonNodeType>) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-zinc-300 !w-3 !h-3" />

      {/* Figma/Miro style skeleton - AI node style (blue) - matches TextNode dimensions */}
      <div
        className="
          w-64
          min-h-[140px]
          p-6
          rounded-md
          border-t-8
          border-t-blue-300
          bg-blue-50/50
          shadow-lg
          overflow-hidden
          box-border
          animate-pulse
        "
      >
        <Skeleton className="h-4 w-3/4 mb-3 bg-blue-200/50" />
        <Skeleton className="h-3 w-full mb-2 bg-blue-200/50" />
        <Skeleton className="h-3 w-5/6 mb-2 bg-blue-200/50" />
        <Skeleton className="h-3 w-2/3 mb-2 bg-blue-200/50" />
        <Skeleton className="h-3 w-1/2 bg-blue-200/50" />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 !w-3 !h-3" />
    </>
  );
}
