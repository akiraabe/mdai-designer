// プロジェクト一覧画面
// プロジェクトの表示・作成・管理機能

import React, { useState } from 'react';
import { Plus, FolderOpen, Calendar, FileText, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectListViewProps {
  projects: Project[];
  onCreateProject: (name: string, description?: string) => void;
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: { name?: string; description?: string }) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  onCreateProject,
  onSelectProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // 新規作成フォーム送信
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateProject(formData.name.trim(), formData.description.trim() || undefined);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
    }
  };

  // 編集フォーム送信
  const handleEditSubmit = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onUpdateProject(projectId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    }
  };

  // 編集開始
  const startEdit = (project: Project) => {
    setEditingProject(project.id);
    setFormData({
      name: project.name,
      description: project.description || ''
    });
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '' });
  };

  // 削除確認
  const handleDelete = (project: Project) => {
    if (window.confirm(`プロジェクト「${project.name}」を削除しますか？\n関連する設計書も全て削除されます。`)) {
      onDeleteProject(project.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">プロジェクト一覧</h1>
          <p className="text-gray-600 mt-2">設計書を管理するプロジェクトを選択または作成してください</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white border-2 border-blue-800 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg"
          style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          新規プロジェクト
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">新規プロジェクト作成</h2>
          <form onSubmit={handleCreateSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: ECサイト構築プロジェクト"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明 (任意)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="プロジェクトの概要や目的を記載..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white border border-blue-600 rounded-md hover:bg-blue-600 font-bold shadow-md"
              >
                作成
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '' });
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

      {/* プロジェクト一覧 */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">プロジェクトがありません</h3>
          <p className="text-gray-500 mb-4">最初のプロジェクトを作成して設計書の管理を始めましょう</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white border border-blue-600 rounded-lg hover:bg-blue-600 font-bold shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            新規プロジェクト作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {editingProject === project.id ? (
                // 編集フォーム
                <form onSubmit={(e) => handleEditSubmit(e, project.id)} className="p-6">
                  <div className="mb-4">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-500 text-white border border-blue-600 text-sm rounded hover:bg-blue-600 font-bold"
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
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <FolderOpen className="w-8 h-8 text-blue-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.name}
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
                    
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {project.documentIds.length} 件の設計書
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="border-t border-gray-100 px-6 py-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(project);
                      }}
                      className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 border border-blue-600 hover:bg-blue-600 rounded font-bold"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      編集
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project);
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