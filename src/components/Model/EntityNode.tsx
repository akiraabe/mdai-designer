// src/components/Model/EntityNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Database, Key, FileText } from 'lucide-react';
import type { DomainModel } from '../../types/domainModel';

interface EntityNodeData {
  model: DomainModel;
  onEdit: (model: DomainModel) => void;
  onDelete: (modelId: string) => void;
}

export const EntityNode: React.FC<NodeProps<EntityNodeData>> = ({ data, selected }) => {
  const { model, onEdit, onDelete } = data;

  return (
    <div 
      className={`entity-node ${selected ? 'selected' : ''}`}
      style={{
        background: '#ffffff',
        border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        boxShadow: selected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      {/* Entity Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          paddingBottom: '6px',
          borderBottom: '1px solid #e5e7eb',
          color: '#1f2937',
          fontWeight: 'bold'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={14} />
          <span>{model.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onEdit(model)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: '#6b7280'
            }}
          >
            <FileText size={12} />
          </button>
          <button
            onClick={() => onDelete(model.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: '#ef4444'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Entity Description */}
      {model.description && (
        <div 
          style={{
            fontSize: '10px',
            color: '#6b7280',
            marginBottom: '8px',
            fontStyle: 'italic'
          }}
        >
          {model.description}
        </div>
      )}

      {/* Entity Fields */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {model.fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 0',
              color: '#374151',
              borderBottom: index < model.fields.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}
          >
            {field.primaryKey && <Key size={10} color="#f59e0b" />}
            <span 
              style={{ 
                fontWeight: field.primaryKey ? 'bold' : 'normal',
                color: field.primaryKey ? '#f59e0b' : field.required ? '#374151' : '#6b7280'
              }}
            >
              {field.name}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '10px' }}>
              {field.type}
            </span>
            {field.required && !field.primaryKey && (
              <span style={{ color: '#ef4444', fontSize: '10px' }}>*</span>
            )}
          </div>
        ))}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#3b82f6',
          width: '8px',
          height: '8px',
          border: '2px solid #ffffff'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#3b82f6',
          width: '8px',
          height: '8px',
          border: '2px solid #ffffff'
        }}
      />
    </div>
  );
};