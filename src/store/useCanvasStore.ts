import { create } from 'zustand';
import {
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { TextNodeType, TextNodeData } from '@/components/nodes/TextNode';

interface CanvasState {
  nodes: TextNodeType[];
  edges: Edge[];
  onNodesChange: OnNodesChange<TextNodeType>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (position: { x: number; y: number }) => void;
  updateNodeText: (nodeId: string, text: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as TextNodeType[],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (position) => {
    const newNode: TextNodeType = {
      id: `node-${Date.now()}`,
      type: 'text',
      position,
      data: { text: '' } as TextNodeData,
    };
    set({
      nodes: [...get().nodes, newNode],
    });
  },

  updateNodeText: (nodeId, text) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, text } }
          : node
      ),
    });
  },
}));
