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

export type LayoutDirection = 'VERTICAL' | 'HORIZONTAL';

type AppNode = TextNodeType | SkeletonNodeType;

interface CanvasState {
  nodes: AppNode[];
  edges: Edge[];
  layoutDirection: LayoutDirection;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (position: { x: number; y: number }) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  addSkeletonNodes: (parentId: string) => string[];
  addSingleSkeletonNode: (parentId: string, index: number) => string | null;
  removeSkeletonNodes: (skeletonIds: string[]) => void;
  expandNode: (parentId: string, concepts: ExpandedConcept[], skeletonIds: string[]) => void;
  addPersonaNode: (parentId: string, title: string, content: string, skeletonId: string) => void;
  toggleLayoutDirection: () => void;
  recalculateLayout: () => void;
}

// Node dimensions for layout calculations
const NODE_WIDTH = 256; // w-64 = 16rem = 256px
const NODE_HEIGHT = 160; // min-h-[160px]
const GAP_VERTICAL = 100;
const GAP_HORIZONTAL = 120;

// Position offsets for child nodes based on direction
const VERTICAL_POSITIONS = [
  { x: -350, y: 250 },  // Left
  { x: -120, y: 280 },  // Center-left
  { x: 120, y: 280 },   // Center-right
  { x: 350, y: 250 },   // Right
];

const HORIZONTAL_POSITIONS = [
  { x: 350, y: -180 },  // Top
  { x: 380, y: -60 },   // Upper-middle
  { x: 380, y: 60 },    // Lower-middle
  { x: 350, y: 180 },   // Bottom
];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  layoutDirection: 'VERTICAL' as LayoutDirection,

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
      data: { text: '', isAI: false } as TextNodeData,
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
    const { nodes, edges, layoutDirection } = get();
    const parentNode = nodes.find((n) => n.id === parentId);

    if (!parentNode) return [];

    const timestamp = Date.now();
    const skeletonIds: string[] = [];
    const newNodes: SkeletonNodeType[] = [];
    const newEdges: Edge[] = [];
    const positions = layoutDirection === 'VERTICAL' ? VERTICAL_POSITIONS : HORIZONTAL_POSITIONS;

    positions.forEach((position, index) => {
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
        style: { stroke: '#93c5fd', strokeDasharray: '5,5' },
      };
      newEdges.push(newEdge);
    });

    set({
      nodes: [...nodes, ...newNodes] as AppNode[],
      edges: [...edges, ...newEdges],
    });

    return skeletonIds;
  },

  addSingleSkeletonNode: (parentId, index) => {
    const { nodes, edges, layoutDirection } = get();
    const parentNode = nodes.find((n) => n.id === parentId);

    if (!parentNode) return null;

    const positions = layoutDirection === 'VERTICAL' ? VERTICAL_POSITIONS : HORIZONTAL_POSITIONS;
    const position = positions[index] || positions[0];
    const skeletonId = `skeleton-${Date.now()}-${index}`;

    const skeletonNode: SkeletonNodeType = {
      id: skeletonId,
      type: 'skeleton',
      position: {
        x: parentNode.position.x + position.x,
        y: parentNode.position.y + position.y,
      },
      data: { parentId } as SkeletonNodeData,
    };

    const newEdge: Edge = {
      id: `edge-${parentId}-${skeletonId}`,
      source: parentId,
      target: skeletonId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#93c5fd', strokeDasharray: '5,5' },
    };

    set({
      nodes: [...nodes, skeletonNode] as AppNode[],
      edges: [...edges, newEdge],
    });

    return skeletonId;
  },

  removeSkeletonNodes: (skeletonIds) => {
    const { nodes, edges } = get();
    set({
      nodes: nodes.filter((n) => !skeletonIds.includes(n.id)),
      edges: edges.filter((e) => !skeletonIds.includes(e.target)),
    });
  },

  expandNode: (parentId, concepts, skeletonIds) => {
    const { nodes, edges, layoutDirection } = get();
    const parentNode = nodes.find((n) => n.id === parentId);

    if (!parentNode) return;

    // Remove skeleton nodes and their edges
    const filteredNodes = nodes.filter((n) => !skeletonIds.includes(n.id));
    const filteredEdges = edges.filter((e) => !skeletonIds.includes(e.target));

    const timestamp = Date.now();
    const newNodes: TextNodeType[] = [];
    const newEdges: Edge[] = [];
    const positions = layoutDirection === 'VERTICAL' ? VERTICAL_POSITIONS : HORIZONTAL_POSITIONS;

    concepts.forEach((concept, index) => {
      const childId = `node-${timestamp}-${index}`;
      const position = positions[index] || (layoutDirection === 'VERTICAL' ? { x: 0, y: 280 } : { x: 380, y: 0 });

      const newNode: TextNodeType = {
        id: childId,
        type: 'text',
        position: {
          x: parentNode.position.x + position.x,
          y: parentNode.position.y + position.y,
        },
        data: {
          text: `${concept.title}\n\n${concept.content}`,
          isAI: true,
        } as TextNodeData,
      };
      newNodes.push(newNode);

      const newEdge: Edge = {
        id: `edge-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      };
      newEdges.push(newEdge);
    });

    set({
      nodes: [...filteredNodes, ...newNodes] as AppNode[],
      edges: [...filteredEdges, ...newEdges],
    });
  },

  addPersonaNode: (parentId, title, content, skeletonId) => {
    const { nodes, edges, layoutDirection } = get();
    const parentNode = nodes.find((n) => n.id === parentId);
    const skeletonNode = nodes.find((n) => n.id === skeletonId);

    if (!parentNode || !skeletonNode) return;

    // Remove skeleton node and its edge
    const filteredNodes = nodes.filter((n) => n.id !== skeletonId);
    const filteredEdges = edges.filter((e) => e.target !== skeletonId);

    const childId = `node-${Date.now()}`;

    const newNode: TextNodeType = {
      id: childId,
      type: 'text',
      position: skeletonNode.position,
      data: {
        text: `${title}\n\n${content}`,
        isAI: true,
      } as TextNodeData,
    };

    const newEdge: Edge = {
      id: `edge-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    };

    set({
      nodes: [...filteredNodes, newNode] as AppNode[],
      edges: [...filteredEdges, newEdge],
    });
  },

  toggleLayoutDirection: () => {
    const newDirection = get().layoutDirection === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL';
    set({ layoutDirection: newDirection });
    // Trigger layout recalculation after direction change
    get().recalculateLayout();
  },

  recalculateLayout: () => {
    const { nodes, edges, layoutDirection } = get();

    if (nodes.length === 0) return;

    // Build parent-child relationships from edges
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();

    edges.forEach((edge) => {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
      parentMap.set(edge.target, edge.source);
    });

    // Find root nodes (nodes without parents)
    const rootNodes = nodes.filter((n) => !parentMap.has(n.id));

    if (rootNodes.length === 0) return;

    // Calculate new positions for all nodes
    const newPositions = new Map<string, { x: number; y: number }>();

    // Position root nodes
    rootNodes.forEach((rootNode, rootIndex) => {
      const baseX = layoutDirection === 'VERTICAL'
        ? rootIndex * (NODE_WIDTH + GAP_HORIZONTAL * 3)
        : 0;
      const baseY = layoutDirection === 'VERTICAL'
        ? 0
        : rootIndex * (NODE_HEIGHT + GAP_VERTICAL * 2);

      newPositions.set(rootNode.id, { x: baseX, y: baseY });

      // Recursively position children
      const positionChildren = (parentId: string, parentX: number, parentY: number, depth: number) => {
        const children = childrenMap.get(parentId) || [];

        children.forEach((childId, childIndex) => {
          let childX: number;
          let childY: number;

          if (layoutDirection === 'VERTICAL') {
            // Vertical: children spread horizontally below parent
            const totalWidth = (children.length - 1) * (NODE_WIDTH + GAP_HORIZONTAL);
            const startX = parentX - totalWidth / 2;
            childX = startX + childIndex * (NODE_WIDTH + GAP_HORIZONTAL);
            childY = parentY + NODE_HEIGHT + GAP_VERTICAL;
          } else {
            // Horizontal: children spread vertically to the right of parent
            const totalHeight = (children.length - 1) * (NODE_HEIGHT + GAP_VERTICAL);
            const startY = parentY - totalHeight / 2;
            childX = parentX + NODE_WIDTH + GAP_HORIZONTAL;
            childY = startY + childIndex * (NODE_HEIGHT + GAP_VERTICAL);
          }

          newPositions.set(childId, { x: childX, y: childY });

          // Recursively position this node's children
          positionChildren(childId, childX, childY, depth + 1);
        });
      };

      positionChildren(rootNode.id, baseX, baseY, 0);
    });

    // Update all nodes with new positions
    const updatedNodes = nodes.map((node) => {
      const newPos = newPositions.get(node.id);
      if (newPos) {
        return {
          ...node,
          position: newPos,
        };
      }
      return node;
    }) as AppNode[];

    set({ nodes: updatedNodes });
  },
}));
