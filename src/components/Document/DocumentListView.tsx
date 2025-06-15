// 設計書一覧画面
// 特定プロジェクト内の設計書の表示・作成・管理機能

import React, { useState } from 'react';
import { Plus, FileText, Calendar, ArrowLeft, MoreVertical, Edit2, Trash2, FolderOpen } from 'lucide-react';
import type { Document, Project } from '../../types';

interface DocumentListViewProps {
  project: Project;
  documents: Document[];
  onCreateDocument: (name: string, projectId: string) => void;
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

  // 新規作成フォーム送信
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateDocument(formData.name.trim(), project.id);
      setFormData({ name: '' });
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
          style={{ backgroundColor: '#4b5563', color: '#ffffff' }}
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
        >
          <Plus className="w-5 h-5 mr-2" />
          新規設計書
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">新規設計書作成</h3>
          <form onSubmit={handleCreateSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                設計書名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="例: ユーザー管理画面設計書"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white border border-green-600 rounded-md hover:bg-green-600 font-bold shadow-md"
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
                style={{ backgroundColor: '#4b5563', color: '#ffffff' }}
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
          >
            <Plus className="w-5 h-5 mr-2" />
            新規設計書作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
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
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-600 text-white border border-gray-700 text-sm rounded hover:bg-gray-700 font-bold"
                      style={{ backgroundColor: '#4b5563', color: '#ffffff' }}
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
                        <FileText className="w-8 h-8 text-green-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {document.name}
                        </h3>
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