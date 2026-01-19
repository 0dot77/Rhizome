'use client';

import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCanvasStore } from '@/store/useCanvasStore';

export interface SkeletonNodeData extends Record<string, unknown> {
  parentId: string;
}

export type SkeletonNodeType = Node<SkeletonNodeData, 'skeleton'>;

export function SkeletonNode({ }: NodeProps<SkeletonNodeType>) {
  const layoutDirection = useCanvasStore((state) => state.layoutDirection);
  const isVertical = layoutDirection === 'VERTICAL';

  // Handle positions based on layout direction
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  return (
    <>
      <Handle type="target" position={targetPosition} className="!bg-zinc-300 !w-3 !h-3" />

      {/* Figma/Miro style skeleton - AI node style (blue) - matches TextNode dimensions */}
      <div
        className="
          w-64
          min-h-[160px]
          p-8
          rounded-md
          border-t-8
          border-t-blue-300
          bg-blue-50/50
          shadow-lg
          overflow-hidden
          box-border
          animate-pulse
          transition-all duration-300 ease-in-out
        "
      >
        <Skeleton className="h-4 w-3/4 mb-3 bg-blue-200/50" />
        <Skeleton className="h-3 w-full mb-2 bg-blue-200/50" />
        <Skeleton className="h-3 w-5/6 mb-2 bg-blue-200/50" />
        <Skeleton className="h-3 w-2/3 mb-2 bg-blue-200/50" />
        <Skeleton className="h-3 w-1/2 bg-blue-200/50" />
      </div>

      <Handle type="source" position={sourcePosition} className="!bg-zinc-300 !w-3 !h-3" />
    </>
  );
}
