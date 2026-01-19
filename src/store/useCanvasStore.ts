import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { TextNodeType, TextNodeData } from '@/components/nodes/TextNode';
import type { SkeletonNodeType, SkeletonNodeData } from '@/components/nodes/SkeletonNode';

export interface ExpandedConcept {
  type: 'scenario' | 'tech' | 'visual' | 'counter';
  title: string;
  content: string;
}

type AppNode = TextNodeType | SkeletonNodeType;

interface CanvasState {
  nodes: AppNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (position: { x: number; y: number }) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  addSkeletonNodes: (parentId: string) => string[];
  removeSkeletonNodes: (skeletonIds: string[]) => void;
  expandNode: (parentId: string, concepts: ExpandedConcept[], skeletonIds: string[]) => void;
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
      nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
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
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId && node.type === 'text') {
          return {
            ...node,
            data: { ...node.data, text },
          } as TextNodeType;
        }
        return node;
      }),
    });
  },

  addSkeletonNodes: (parentId) => {
    const { nodes, edges } = get();
    const parentNode = nodes.find((n) => n.id === parentId);

    if (!parentNode) return [];

    const timestamp = Date.now();
    const skeletonIds: string[] = [];
    const newNodes: SkeletonNodeType[] = [];
    const newEdges: Edge[] = [];

    CHILD_POSITIONS.forEach((position, index) => {
      const skeletonId = `skeleton-${timestamp}-${index}`;
      skeletonIds.push(skeletonId);

      const skeletonNode: SkeletonNodeType = {
        id: skeletonId,
        type: 'skeleton',
        position: {
          x: parentNode.position.x + position.x,
          y: parentNode.position.y + position.y,
        },
        data: { parentId } as SkeletonNodeData,
      };
      newNodes.push(skeletonNode);

      const newEdge: Edge = {
        id: `edge-${parentId}-${skeletonId}`,
        source: parentId,
        target: skeletonId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#d4d4d4', strokeDasharray: '5,5' },
      };
      newEdges.push(newEdge);
    });

    set({
      nodes: [...nodes, ...newNodes] as AppNode[],
      edges: [...edges, ...newEdges],
    });

    return skeletonIds;
  },

  removeSkeletonNodes: (skeletonIds) => {
    const { nodes, edges } = get();
    set({
      nodes: nodes.filter((n) => !skeletonIds.includes(n.id)),
      edges: edges.filter((e) => !skeletonIds.includes(e.target)),
    });
  },

  expandNode: (parentId, concepts, skeletonIds) => {
    const { nodes, edges } = get();
    const parentNode = nodes.find((n) => n.id === parentId);

    if (!parentNode) return;

    // Remove skeleton nodes and their edges
    const filteredNodes = nodes.filter((n) => !skeletonIds.includes(n.id));
    const filteredEdges = edges.filter((e) => !skeletonIds.includes(e.target));

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
      nodes: [...filteredNodes, ...newNodes] as AppNode[],
      edges: [...filteredEdges, ...newEdges],
    });
  },
}));
