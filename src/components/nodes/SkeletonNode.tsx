'use client';

import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface SkeletonNodeData extends Record<string, unknown> {
  parentId: string;
}

export type SkeletonNodeType = Node<SkeletonNodeData, 'skeleton'>;

export function SkeletonNode({ }: NodeProps<SkeletonNodeType>) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-zinc-300" />
      <Card className="min-w-[200px] max-w-[300px] p-3 bg-zinc-50 border-zinc-200 shadow-md animate-pulse">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-5/6" />
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300" />
    </>
  );
}
