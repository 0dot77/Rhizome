'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store/useCanvasStore';
import { TextNode } from '@/components/nodes/TextNode';
import { SkeletonNode } from '@/components/nodes/SkeletonNode';

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useCanvasStore();
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      text: TextNode,
      skeleton: SkeletonNode,
    }),
    []
  );

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      console.log('Double-click detected at:', position);
      addNode(position);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDoubleClick={handlePaneDoubleClick}
      nodeTypes={nodeTypes}
      fitView={false}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      selectNodesOnDrag={false}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e4e4e7" />
      <Controls className="!bg-white !border-zinc-200 !shadow-md" />
      <MiniMap
        className="!bg-white !border-zinc-200 !shadow-md"
        nodeColor={(node) => node.type === 'skeleton' ? '#e4e4e7' : '#fef3c7'}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
    </ReactFlow>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
