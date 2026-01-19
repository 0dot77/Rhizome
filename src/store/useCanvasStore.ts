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

export interface ExpandedConcept {
  type: 'scenario' | 'tech' | 'visual' | 'counter';
  title: string;
  content: string;
}

interface CanvasState {
  nodes: TextNodeType[];
  edges: Edge[];
  onNodesChange: OnNodesChange<TextNodeType>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (position: { x: number; y: number }) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  expandNode: (parentId: string, concepts: ExpandedConcept[]) => void;
}

// Position offsets for child nodes (arranged in a semi-circle below parent)
const CHILD_POSITIONS = [
  { x: -300, y: 150 },  // Left
  { x: -100, y: 200 },  // Center-left
  { x: 100, y: 200 },   // Center-right
  { x: 300, y: 150 },   // Right
];

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

  expandNode: (parentId, concepts) => {
    const { nodes, edges } = get();
    const parentNode = nodes.find((n) => n.id === parentId);

    if (!parentNode) return;

    const timestamp = Date.now();
    const newNodes: TextNodeType[] = [];
    const newEdges: Edge[] = [];

    concepts.forEach((concept, index) => {
      const childId = `node-${timestamp}-${index}`;
      const position = CHILD_POSITIONS[index] || { x: 0, y: 200 };

      const newNode: TextNodeType = {
        id: childId,
        type: 'text',
        position: {
          x: parentNode.position.x + position.x,
          y: parentNode.position.y + position.y,
        },
        data: {
          text: `${concept.title}\n\n${concept.content}`,
        } as TextNodeData,
      };
      newNodes.push(newNode);

      const newEdge: Edge = {
        id: `edge-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#a3a3a3' },
      };
      newEdges.push(newEdge);
    });

    set({
      nodes: [...nodes, ...newNodes],
      edges: [...edges, ...newEdges],
    });
  },
}));
