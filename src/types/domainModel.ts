// src/types/domainModel.ts

export interface DomainModel {
  id: string;
  name: string;
  description: string;
  fields: ModelField[];
  relationships: ModelRelationship[];
  businessRules: BusinessRule[];
  position?: { x: number; y: number }; // ER図での位置
}

export interface ModelField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  description?: string;
  constraints?: FieldConstraint[];
}

export type FieldType = 
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'text'
  | 'email'
  | 'url'
  | 'reference';

export interface ModelRelationship {
  id: string;
  type: RelationshipType;
  sourceModel: string;
  targetModel: string;
  sourceField: string;
  targetField: string;
  cascade?: boolean;
  description?: string;
}

export type RelationshipType = 
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FieldConstraint {
  type: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value: string | number;
  message?: string;
}

export interface ModelContext {
  models: DomainModel[];
  relationships: ModelRelationship[];
  targetModel: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'list';
}