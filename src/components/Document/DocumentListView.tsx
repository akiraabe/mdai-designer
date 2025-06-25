// 設計書一覧画面
// 特定プロジェクト内の設計書の表示・作成・管理機能

import React, { useState } from 'react';
import { Plus, FileText, Calendar, ArrowLeft, MoreVertical, Edit2, Trash2, FolderOpen, Tag } from 'lucide-react';
import type { Document, Project, DocumentType } from '../../types';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { getDocumentTypeInfo } from '../../utils/documentTypes';

interface DocumentListViewProps {
  project: Project;
  documents: Document[];
  onCreateDocument: (name: string, projectId: string, type?: DocumentType) => void;
  onSelectDocument: (documentId: string) => void;
  onUpdateDocument: (documentId: string, updates: { name?: string }) => void;
  onDeleteDocument: (documentId: string) => void;
  onGoBack: () => void;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  project,
  documents,
  onCreateDocument,
  onSelectDocument,
  onUpdateDocument,
  onDeleteDocument,
  onGoBack
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [selectedType, setSelectedType] = useState<DocumentType>('screen');
  
  // フィルタリング状態
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  // プロジェクト内の全タグを取得
  const allTags = Array.from(new Set(
    documents.flatMap(doc => doc.tags || [])
  )).sort();

  // フィルタリング済み設計書一覧
  const filteredDocuments = documents.filter(document => {
    // 名前による検索
    const matchesSearch = searchText === '' || 
      document.name.toLowerCase().includes(searchText.toLowerCase());
    
    // タグによるフィルタリング（選択された全てのタグを含む）
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => document.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  // タグ選択/解除処理
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // フィルターをクリア
  const clearFilters = () => {
    setSelectedTags([]);
    setSearchText('');
  };

  // 新規作成フォーム送信
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateDocument(formData.name.trim(), project.id, selectedType);
      setFormData({ name: '' });
      setSelectedType('screen');
      setShowCreateForm(false);
    }
  };

  // 編集フォーム送信
  const handleEditSubmit = (e: React.FormEvent, documentId: string) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onUpdateDocument(documentId, { name: formData.name.trim() });
      setEditingDocument(null);
      setFormData({ name: '' });
    }
  };

  // 編集開始
  const startEdit = (document: Document) => {
    setEditingDocument(document.id);
    setFormData({ name: document.name });
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingDocument(null);
    setFormData({ name: '' });
  };

  // 削除確認
  const handleDelete = (document: Document) => {
    if (window.confirm(`設計書「${document.name}」を削除しますか？`)) {
      onDeleteDocument(document.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center mb-6">
        <button
          onClick={onGoBack}
          className="flex items-center px-3 py-2 bg-gray-600 text-white border border-gray-700 hover:bg-gray-700 rounded-lg mr-4 font-bold shadow-md"
          style={{ backgroundColor: '#4b5563', color: '#ffffff', fontWeight: 'bold' }}
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          戻る
        </button>
        <div className="flex items-center">
          <FolderOpen className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">設計書一覧</h2>
          <p className="text-gray-600 mt-1">編集する設計書を選択または新規作成してください</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-green-500 text-white border border-green-600 rounded-lg hover:bg-green-600 transition-colors font-bold shadow-md"
          style={{ backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          新規設計書
        </button>
      </div>

      {/* 検索・フィルターエリア */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col space-y-4">
          {/* 検索バー */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="設計書名で検索..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {(selectedTags.length > 0 || searchText) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                フィルタークリア
              </button>
            )}
          </div>

          {/* タグフィルター */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">タグで絞り込み:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* フィルター結果表示 */}
          <div className="text-sm text-gray-600">
            {documents.length > 0 && (
              <span>
                {filteredDocuments.length} / {documents.length} 件の設計書を表示
                {selectedTags.length > 0 && (
                  <span> (タグ: {selectedTags.join(', ')})</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">新規設計書作成</h3>
          <form onSubmit={handleCreateSubmit}>
            {/* 設計書タイプ選択 */}
            <DocumentTypeSelector
              selectedType={selectedType}
              onChange={setSelectedType}
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                設計書名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={`例: ${getDocumentTypeInfo(selectedType).label}`}
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white border border-green-600 rounded-md hover:bg-green-600 font-bold shadow-md"
                style={{ backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
              >
                作成
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white border border-gray-700 rounded-md hover:bg-gray-700 font-bold shadow-md"
                style={{ backgroundColor: '#4b5563', color: '#ffffff', fontWeight: 'bold' }}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 設計書一覧 */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">設計書がありません</h3>
          <p className="text-gray-500 mb-4">最初の設計書を作成して編集を始めましょう</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white border border-green-600 rounded-lg hover:bg-green-600 font-bold shadow-md"
            style={{ backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            新規設計書作成
          </button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">条件に一致する設計書がありません</h3>
          <p className="text-gray-500 mb-4">検索条件やタグフィルターを変更してみてください</p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white border border-blue-600 rounded-lg hover:bg-blue-600 font-bold shadow-md"
          >
            フィルターをクリア
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {editingDocument === document.id ? (
                // 編集フォーム
                <form onSubmit={(e) => handleEditSubmit(e, document.id)} className="p-6">
                  <div className="mb-4">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-500 text-white border border-green-600 text-sm rounded hover:bg-green-600 font-bold"
                      style={{ backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-600 text-white border border-gray-700 text-sm rounded hover:bg-gray-700 font-bold"
                      style={{ backgroundColor: '#4b5563', color: '#ffffff', fontWeight: 'bold' }}
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                // 通常表示
                <>
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => onSelectDocument(document.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span style={{ fontSize: '24px', marginRight: '12px' }}>
                          {getDocumentTypeInfo(document.type || 'screen').icon}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {document.name}
                          </h3>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            marginTop: '2px'
                          }}>
                            {getDocumentTypeInfo(document.type || 'screen').label}
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // メニュー展開は後で実装
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 設計書の内容プレビュー */}
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-4">
                        <span>
                          表示条件: {document.conditions ? '設定済み' : '未設定'}
                        </span>
                        <span>
                          項目定義: {document.spreadsheet && Array.isArray(document.spreadsheet) && document.spreadsheet[0]?.celldata?.length > 0 ? '設定済み' : '未設定'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span>
                          画面イメージ: {document.mockup ? '設定済み' : '未設定'}
                        </span>
                        <span>
                          補足説明: {document.supplement ? '設定済み' : '未設定'}
                        </span>
                      </div>
                    </div>
                    
                    {/* タグ表示 */}
                    {document.tags && document.tags.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">タグ:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        作成: {new Date(document.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        更新: {new Date(document.updatedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="border-t border-gray-100 px-6 py-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(document);
                      }}
                      className="flex items-center px-3 py-1 text-sm text-white bg-green-500 border border-green-600 hover:bg-green-600 rounded font-bold"
                      style={{ backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      名前変更
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(document);
                      }}
                      className="flex items-center px-3 py-1 text-sm text-white bg-red-500 border border-red-600 hover:bg-red-600 rounded font-bold"
                      style={{ backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 'bold' }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};