// src/services/documentReferenceService.ts
// プロジェクト内設計書相互参照システム
// Model Driven Architecture の基盤機能

import type { Document, DocumentType, AppState } from '../types';

export interface DocumentReference {
  id: string;
  name: string;
  type: DocumentType;
  projectId: string;
  content: DocumentContent;
}

export interface DocumentContent {
  // 画面設計書コンテンツ
  conditions?: string;
  supplement?: string;
  spreadsheetData?: unknown[];
  mockupImage?: string | null;
  
  // データモデル設計書コンテンツ
  mermaidCode?: string;
  
  // 共通メタデータ
  createdAt: string;
  updatedAt: string;
}

export interface EntityInfo {
  name: string;
  fields: FieldInfo[];
  relationships: RelationshipInfo[];
}

export interface FieldInfo {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  foreignKey?: boolean;
}

export interface RelationshipInfo {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetEntity: string;
  description?: string;
}

export class DocumentReferenceService {
  /**
   * 指定されたプロジェクト内の全設計書を取得
   */
  static getProjectDocuments(appState: AppState, projectId: string): DocumentReference[] {
    return appState.documents
      .filter(doc => doc.projectId === projectId)
      .map(doc => this.mapToDocumentReference(doc));
  }

  /**
   * 指定されたプロジェクト内の特定タイプの設計書を取得
   */
  static getDocumentsByType(
    appState: AppState, 
    projectId: string, 
    type: DocumentType
  ): DocumentReference[] {
    return this.getProjectDocuments(appState, projectId)
      .filter(doc => doc.type === type);
  }

  /**
   * プロジェクト内のデータモデル設計書を取得
   */
  static getDataModelDocuments(appState: AppState, projectId: string): DocumentReference[] {
    return this.getDocumentsByType(appState, projectId, 'model');
  }

  /**
   * プロジェクト内の画面設計書を取得
   */
  static getScreenDocuments(appState: AppState, projectId: string): DocumentReference[] {
    return this.getDocumentsByType(appState, projectId, 'screen');
  }

  /**
   * 設計書の詳細内容を構造化して取得
   */
  static getDocumentContent(appState: AppState, documentId: string): DocumentContent | null {
    const document = appState.documents.find(doc => doc.id === documentId);
    if (!document) return null;

    return {
      conditions: document.conditions,
      supplement: document.supplement,
      spreadsheetData: document.spreadsheet?.length ? document.spreadsheet : [],
      mockupImage: document.mockup,
      mermaidCode: document.mermaidCode,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  /**
   * Mermaidコードからエンティティ情報を抽出
   */
  static parseEntitiesFromMermaid(mermaidCode: string): EntityInfo[] {
    if (!mermaidCode || !mermaidCode.includes('erDiagram')) {
      return [];
    }

    const entities: EntityInfo[] = [];
    const lines = mermaidCode.split('\n').map(line => line.trim());
    
    // エンティティ定義を抽出（例: User { ... }）
    const entityPattern = /^(\w+)\s*\{/;
    const fieldPattern = /^\s*(\w+)\s+(\w+)(?:\s+(PK|FK|UK|NULL|NOT_NULL))*\s*$/;
    
    let currentEntity: EntityInfo | null = null;
    
    for (const line of lines) {
      const entityMatch = line.match(entityPattern);
      if (entityMatch) {
        // 新しいエンティティの開始
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = {
          name: entityMatch[1],
          fields: [],
          relationships: []
        };
        continue;
      }
      
      if (currentEntity && line === '}') {
        // エンティティ定義の終了
        entities.push(currentEntity);
        currentEntity = null;
        continue;
      }
      
      if (currentEntity) {
        const fieldMatch = line.match(fieldPattern);
        if (fieldMatch) {
          const [, fieldName, fieldType, ...constraints] = fieldMatch;
          currentEntity.fields.push({
            name: fieldName,
            type: fieldType,
            primaryKey: constraints.includes('PK'),
            foreignKey: constraints.includes('FK'),
            nullable: !constraints.includes('NOT_NULL')
          });
        }
      }
      
      // リレーション解析（例: User ||--o{ Order : "has"）
      const relationPattern = /(\w+)\s*\|\|--o\{\s*(\w+)\s*:\s*"([^"]+)"/;
      const relationMatch = line.match(relationPattern);
      if (relationMatch) {
        const [, sourceEntity, targetEntity, description] = relationMatch;
        const entity = entities.find(e => e.name === sourceEntity);
        if (entity) {
          entity.relationships.push({
            type: 'one-to-many',
            targetEntity,
            description
          });
        }
      }
    }
    
    return entities;
  }

  /**
   * エンティティ情報からスプレッドシート用の項目定義を生成
   */
  static generateSpreadsheetFromEntities(entities: EntityInfo[]): unknown[] {
    if (entities.length === 0) return [];

    const celldata = [];
    let rowIndex = 0;

    // ヘッダー行
    celldata.push(
      { r: rowIndex, c: 0, v: { v: '項目名', f: null, ct: { fa: 'General', t: 'g' } } },
      { r: rowIndex, c: 1, v: { v: 'データ型', f: null, ct: { fa: 'General', t: 'g' } } },
      { r: rowIndex, c: 2, v: { v: '必須', f: null, ct: { fa: 'General', t: 'g' } } },
      { r: rowIndex, c: 3, v: { v: '説明', f: null, ct: { fa: 'General', t: 'g' } } }
    );
    rowIndex++;

    // 各エンティティのフィールドを追加
    for (const entity of entities) {
      // エンティティ名の区切り行
      celldata.push(
        { r: rowIndex, c: 0, v: { v: `[${entity.name}]`, f: null, ct: { fa: 'General', t: 'g' } } }
      );
      rowIndex++;

      // フィールド行
      for (const field of entity.fields) {
        celldata.push(
          { r: rowIndex, c: 0, v: { v: field.name, f: null, ct: { fa: 'General', t: 'g' } } },
          { r: rowIndex, c: 1, v: { v: field.type, f: null, ct: { fa: 'General', t: 'g' } } },
          { r: rowIndex, c: 2, v: { v: field.nullable ? '任意' : '必須', f: null, ct: { fa: 'General', t: 'g' } } },
          { r: rowIndex, c: 3, v: { v: field.primaryKey ? 'Primary Key' : '', f: null, ct: { fa: 'General', t: 'g' } } }
        );
        rowIndex++;
      }
      
      rowIndex++; // エンティティ間の空行
    }

    return [{
      name: 'データモデル連携',
      index: 0,
      celldata,
      config: {},
      status: 1,
      order: 0,
      hide: 0,
      row: Math.max(20, rowIndex + 5),
      column: 10,
      defaultRowHeight: 19,
      defaultColWidth: 73
    }];
  }

  /**
   * プロジェクト内の参照可能な設計書リストを取得（@メンション用）
   */
  static getReferenceableDocuments(
    appState: AppState, 
    currentProjectId: string, 
    currentDocumentId?: string
  ): DocumentReference[] {
    return this.getProjectDocuments(appState, currentProjectId)
      .filter(doc => doc.id !== currentDocumentId) // 自分自身を除外
      .sort((a, b) => {
        // データモデル設計書を優先表示
        if (a.type === 'model' && b.type !== 'model') return -1;
        if (a.type !== 'model' && b.type === 'model') return 1;
        return a.name.localeCompare(b.name, 'ja');
      });
  }

  /**
   * @メンション文字列の解析
   */
  static parseMentions(message: string): string[] {
    const mentionPattern = /@([^\s]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionPattern.exec(message)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  /**
   * メンション名から設計書を検索
   */
  static findDocumentByMention(
    appState: AppState, 
    projectId: string, 
    mentionText: string
  ): DocumentReference | null {
    const documents = this.getProjectDocuments(appState, projectId);
    
    // 完全一致検索
    let found = documents.find(doc => doc.name === mentionText);
    if (found) return found;
    
    // タイプ名での検索
    const typeNames = {
      'データモデル設計書': 'model',
      'モデル設計書': 'model',
      'データモデル': 'model',
      '画面設計書': 'screen',
      '画面設計': 'screen',
      'API設計書': 'api',
      'API設計': 'api'
    };
    
    const targetType = typeNames[mentionText as keyof typeof typeNames];
    if (targetType) {
      found = documents.find(doc => doc.type === targetType);
      if (found) return found;
    }
    
    // 部分一致検索
    found = documents.find(doc => 
      doc.name.includes(mentionText) || 
      mentionText.includes(doc.name)
    );
    
    return found || null;
  }

  /**
   * DocumentをDocumentReferenceに変換（内部用）
   */
  private static mapToDocumentReference(document: Document): DocumentReference {
    return {
      id: document.id,
      name: document.name,
      type: document.type,
      projectId: document.projectId,
      content: {
        conditions: document.conditions,
        supplement: document.supplement,
        spreadsheetData: document.spreadsheet || [],
        mockupImage: document.mockup,
        mermaidCode: document.mermaidCode,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    };
  }
}