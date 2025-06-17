// src/components/Model/ERDiagramEditor.tsx
import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType
} from 'reactflow';
import type {
  Node,
  Edge,
  Connection,
  NodeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

import { EntityNode } from './EntityNode';
import type { DomainModel, ModelRelationship } from '../../types/domainModel';

interface ERDiagramEditorProps {
  models: DomainModel[];
  relationships: ModelRelationship[];
  onModelsUpdate: (models: DomainModel[]) => void;
  onRelationshipsUpdate: (relationships: ModelRelationship[]) => void;
}

export const ERDiagramEditor: React.FC<ERDiagramEditorProps> = ({
  models,
  relationships,
  onModelsUpdate,
  onRelationshipsUpdate
}) => {

  // モデル編集
  const handleEditModel = useCallback((model: DomainModel) => {
    // TODO: モデル編集モーダルを開く
    console.log('Edit model:', model);
  }, []);

  // モデル削除
  const handleDeleteModel = useCallback((modelId: string) => {
    const updatedModels = models.filter(m => m.id !== modelId);
    onModelsUpdate(updatedModels);
    
    // 関連するエッジも削除
    const updatedRelationships = relationships.filter(
      r => r.sourceModel !== modelId && r.targetModel !== modelId
    );
    onRelationshipsUpdate(updatedRelationships);
  }, [models, relationships, onModelsUpdate, onRelationshipsUpdate]);

  // React Flow用のノードタイプを定義
  const nodeTypes: NodeTypes = useMemo(() => ({
    entity: EntityNode
  }), []);

  // モデルをReact FlowのNode形式に変換
  const initialNodes: Node[] = useMemo(() => models.map(model => ({
    id: model.id,
    type: 'entity',
    position: model.position || { x: Math.random() * 400, y: Math.random() * 300 },
    data: {
      model,
      onEdit: handleEditModel,
      onDelete: handleDeleteModel
    }
  })), [models, handleEditModel, handleDeleteModel]);

  // 関係をReact FlowのEdge形式に変換
  const initialEdges: Edge[] = useMemo(() => relationships.map(rel => ({
    id: rel.id,
    source: rel.sourceModel,
    target: rel.targetModel,
    type: 'smoothstep',
    label: rel.type,
    labelStyle: { fontSize: '10px', fontWeight: 'bold' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#374151'
    },
    style: { stroke: '#374151' }
  })), [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // propsが変更されたときにノードとエッジを更新
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // 新しいモデル追加
  const handleAddModel = useCallback(() => {
    const newModel: DomainModel = {
      id: `model_${Date.now()}`,
      name: `Entity${models.length + 1}`,
      description: '新しいエンティティ',
      fields: [
        {
          id: `field_${Date.now()}`,
          name: 'id',
          type: 'string',
          required: true,
          primaryKey: true,
          description: 'Primary Key'
        }
      ],
      relationships: [],
      businessRules: [],
      position: { x: 100, y: 100 }
    };

    onModelsUpdate([...models, newModel]);
  }, [models, onModelsUpdate]);

  // エッジ（関係）の追加
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      const newRelationship: ModelRelationship = {
        id: `rel_${Date.now()}`,
        type: 'one-to-many', // デフォルト
        sourceModel: connection.source,
        targetModel: connection.target,
        sourceField: 'id',
        targetField: `${connection.source}_id`,
        description: 'Auto-generated relationship'
      };

      onRelationshipsUpdate([...relationships, newRelationship]);
      
      const newEdge = {
        id: newRelationship.id,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        label: newRelationship.type,
        labelStyle: { fontSize: '10px', fontWeight: 'bold' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#374151'
        },
        style: { stroke: '#374151' }
      };

      setEdges(eds => addEdge(newEdge, eds));
    }
  }, [relationships, onRelationshipsUpdate, setEdges]);

  return (
    <div style={{ height: '600px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      {/* ツールバー */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <button
          onClick={handleAddModel}
          style={{
            padding: '6px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          + エンティティ追加
        </button>
        <div style={{ fontSize: '12px', color: '#6b7280', alignSelf: 'center' }}>
          {models.length}個のエンティティ, {relationships.length}個の関係
        </div>
      </div>

      {/* React Flow */}
      <div style={{ height: 'calc(100% - 50px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#f3f4f6" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};