// src/components/Common/BackupManager.tsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, Clock, HardDrive, AlertTriangle } from 'lucide-react';
import { BackupService } from '../../services/backupService';
import type { BackupData, WebUIData } from '../../types/aiTypes';

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (data: WebUIData) => void;
  currentData: WebUIData;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  isOpen,
  onClose,
  onRestore,
  currentData
}) => {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // バックアップ一覧を読み込み
  const loadBackups = () => {
    try {
      const allBackups = BackupService.getAllBackups();
      setBackups(allBackups);
      
      const usage = BackupService.getStorageUsage();
      setStorageInfo(usage);
      
      console.log(`📊 バックアップ数: ${allBackups.length}, ストレージ使用量: ${usage.percentage}%`);
    } catch (error) {
      console.error('❌ バックアップ読み込みエラー:', error);
    }
  };

  // コンポーネントマウント時とオープン時に読み込み
  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen]);

  // 手動バックアップ作成
  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const label = `手動バックアップ (${new Date().toLocaleString('ja-JP')})`;
      const backupId = BackupService.createManualBackup(currentData, label);
      console.log(`✅ 手動バックアップ作成: ${backupId}`);
      loadBackups(); // 一覧を更新
    } catch (error) {
      console.error('❌ 手動バックアップ作成エラー:', error);
      alert(`バックアップの作成に失敗しました: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // バックアップから復元
  const handleRestore = (backup: BackupData) => {
    if (window.confirm(`「${backup.label}」から復元しますか？\n現在のデータは失われます。`)) {
      try {
        const restoredData = BackupService.restoreFromBackup(backup.id);
        if (restoredData) {
          onRestore(restoredData);
          console.log(`✅ 復元完了: ${backup.label}`);
          alert('復元が完了しました！');
          onClose();
        } else {
          alert('復元に失敗しました。バックアップデータが見つかりません。');
        }
      } catch (error) {
        console.error('❌ 復元エラー:', error);
        alert(`復元に失敗しました: ${error}`);
      }
    }
  };

  // バックアップ削除
  const handleDelete = (backup: BackupData) => {
    if (window.confirm(`「${backup.label}」を削除しますか？\nこの操作は取り消せません。`)) {
      try {
        BackupService.deleteBackup(backup.id);
        console.log(`🗑️ バックアップ削除: ${backup.label}`);
        loadBackups(); // 一覧を更新
        if (selectedBackup?.id === backup.id) {
          setSelectedBackup(null);
        }
      } catch (error) {
        console.error('❌ バックアップ削除エラー:', error);
        alert(`削除に失敗しました: ${error}`);
      }
    }
  };

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024) * 100) / 100}MB`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw className="h-5 w-5 text-blue-600" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              バックアップ管理
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* ストレージ情報 */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <HardDrive className="h-4 w-4 text-gray-600" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              ストレージ使用量: {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.total)} 
              ({storageInfo.percentage}%)
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              marginTop: '4px'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: storageInfo.percentage > 80 ? '#ef4444' : '#3b82f6',
                borderRadius: '2px',
                width: `${Math.min(storageInfo.percentage, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          {storageInfo.percentage > 80 && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </div>

        {/* アクションボタン */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <button
            onClick={handleCreateBackup}
            disabled={isLoading}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw className="h-4 w-4" />
            {isLoading ? '作成中...' : '手動バックアップ作成'}
          </button>
        </div>

        {/* バックアップ一覧 */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: '16px' }}>
          {/* 一覧 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
              バックアップ一覧 ({backups.length}件)
            </h3>
            {backups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                バックアップがありません
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      backgroundColor: selectedBackup?.id === backup.id ? '#eff6ff' : 'white',
                      borderColor: selectedBackup?.id === backup.id ? '#3b82f6' : '#e5e7eb'
                    }}
                    onClick={() => setSelectedBackup(backup)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {backup.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock className="h-3 w-3" />
                          {new Date(backup.timestamp).toLocaleString('ja-JP')}
                        </div>
                        {backup.metadata?.reason && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                            {backup.metadata.reason}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(backup);
                          }}
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          復元
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(backup);
                          }}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 詳細表示 */}
          {selectedBackup && (
            <div style={{
              width: '300px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                バックアップ詳細
              </h3>
              <div style={{ fontSize: '12px', color: '#4b5563' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>ID:</strong> {selectedBackup.id}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>作成日時:</strong><br />
                  {new Date(selectedBackup.timestamp).toLocaleString('ja-JP')}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>データ内容:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    <li>表示条件: {selectedBackup.data.conditionsMarkdown?.length || 0}文字</li>
                    <li>補足説明: {selectedBackup.data.supplementMarkdown?.length || 0}文字</li>
                    <li>スプレッドシート: {selectedBackup.data.spreadsheetData?.[0]?.celldata?.length || 0}セル</li>
                    <li>画像: {selectedBackup.data.mockupImage ? 'あり' : 'なし'}</li>
                  </ul>
                </div>
                {selectedBackup.metadata?.modificationId && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>関連修正ID:</strong><br />
                    {selectedBackup.metadata.modificationId}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};