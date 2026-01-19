'use client';

import { useCallback, useMemo, useRef } from 'react';
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
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      text: TextNode,
      skeleton: SkeletonNode,
    }),
    []
  );

  // Handle pane click with double-click detection
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      clickCountRef.current += 1;

      if (clickCountRef.current === 1) {
        // First click - wait for potential second click
        clickTimeoutRef.current = setTimeout(() => {
          clickCountRef.current = 0;
        }, 300);
      } else if (clickCountRef.current === 2) {
        // Double click detected
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }
        clickCountRef.current = 0;

        // Convert screen coordinates to flow coordinates
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        console.log('Double-click detected at:', position);
        addNode(position);
      }
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
      onPaneClick={handlePaneClick}
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
        nodeColor={(node) => {
          if (node.type === 'skeleton') return '#bfdbfe'; // blue-200
          if (node.type === 'text' && node.data?.isAI) return '#93c5fd'; // blue-300
          return '#fde047'; // yellow-300 for user nodes
        }}
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
