// src/services/backupService.ts
// LocalStorage バックアップ機能

import type { WebUIData, BackupData } from '../types/aiTypes';

const BACKUP_KEY_PREFIX = 'design_backup_';
const MAX_BACKUPS = 10; // 最大保存数

export class BackupService {
  /**
   * 現在の設計書データを自動バックアップ
   */
  static createAutoBackup(data: WebUIData, reason: string, modificationId?: string): string {
    const timestamp = Date.now();
    const backupId = `auto_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    const backup: BackupData = {
      id: backupId,
      timestamp,
      label: `自動バックアップ (${new Date(timestamp).toLocaleString('ja-JP')})`,
      data: JSON.parse(JSON.stringify(data)), // ディープコピー
      metadata: {
        modificationId,
        reason
      }
    };

    // LocalStorageに保存
    const storageKey = BACKUP_KEY_PREFIX + backupId;
    try {
      localStorage.setItem(storageKey, JSON.stringify(backup));
      console.log(`✅ バックアップ作成: ${backupId} (${reason})`);
      
      // 古いバックアップを削除
      this.cleanupOldBackups();
      
      return backupId;
    } catch (error) {
      console.error('❌ バックアップ作成エラー:', error);
      throw new Error(`バックアップの作成に失敗しました: ${error}`);
    }
  }

  /**
   * 手動バックアップ作成
   */
  static createManualBackup(data: WebUIData, label: string): string {
    const timestamp = Date.now();
    const backupId = `manual_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    const backup: BackupData = {
      id: backupId,
      timestamp,
      label: label || `手動バックアップ (${new Date(timestamp).toLocaleString('ja-JP')})`,
      data: JSON.parse(JSON.stringify(data)),
      metadata: {
        reason: '手動バックアップ'
      }
    };

    const storageKey = BACKUP_KEY_PREFIX + backupId;
    try {
      localStorage.setItem(storageKey, JSON.stringify(backup));
      console.log(`✅ 手動バックアップ作成: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('❌ 手動バックアップ作成エラー:', error);
      throw new Error(`手動バックアップの作成に失敗しました: ${error}`);
    }
  }

  /**
   * 全バックアップの一覧取得
   */
  static getAllBackups(): BackupData[] {
    const backups: BackupData[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup: BackupData = JSON.parse(backupData);
            backups.push(backup);
          }
        }
      }
      
      // タイムスタンプの降順でソート（新しい順）
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ バックアップ一覧取得エラー:', error);
      return [];
    }
  }

  /**
   * 特定のバックアップを取得
   */
  static getBackup(backupId: string): BackupData | null {
    try {
      const storageKey = BACKUP_KEY_PREFIX + backupId;
      const backupData = localStorage.getItem(storageKey);
      
      if (!backupData) {
        console.warn(`⚠️ バックアップが見つかりません: ${backupId}`);
        return null;
      }
      
      return JSON.parse(backupData);
    } catch (error) {
      console.error('❌ バックアップ取得エラー:', error);
      return null;
    }
  }

  /**
   * バックアップからデータを復元
   */
  static restoreFromBackup(backupId: string): WebUIData | null {
    const backup = this.getBackup(backupId);
    if (!backup) {
      return null;
    }
    
    console.log(`🔄 バックアップから復元: ${backup.label}`);
    return JSON.parse(JSON.stringify(backup.data)); // ディープコピー
  }

  /**
   * 特定のバックアップを削除
   */
  static deleteBackup(backupId: string): boolean {
    try {
      const storageKey = BACKUP_KEY_PREFIX + backupId;
      localStorage.removeItem(storageKey);
      console.log(`🗑️ バックアップ削除: ${backupId}`);
      return true;
    } catch (error) {
      console.error('❌ バックアップ削除エラー:', error);
      return false;
    }
  }

  /**
   * 古いバックアップを削除（最大数を超えた場合）
   */
  private static cleanupOldBackups(): void {
    try {
      const backups = this.getAllBackups();
      
      if (backups.length > MAX_BACKUPS) {
        // 古いバックアップを削除
        const toDelete = backups.slice(MAX_BACKUPS);
        toDelete.forEach(backup => {
          this.deleteBackup(backup.id);
        });
        
        console.log(`🧹 古いバックアップを削除: ${toDelete.length}件`);
      }
    } catch (error) {
      console.error('❌ バックアップクリーンアップエラー:', error);
    }
  }

  /**
   * 全バックアップを削除（デバッグ用）
   */
  static clearAllBackups(): void {
    try {
      const backups = this.getAllBackups();
      backups.forEach(backup => {
        this.deleteBackup(backup.id);
      });
      console.log(`🧹 全バックアップを削除: ${backups.length}件`);
    } catch (error) {
      console.error('❌ 全バックアップ削除エラー:', error);
    }
  }

  /**
   * ストレージ使用量を取得
   */
  static getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      const backups = this.getAllBackups();
      
      backups.forEach(backup => {
        const storageKey = BACKUP_KEY_PREFIX + backup.id;
        const data = localStorage.getItem(storageKey);
        if (data) {
          used += new Blob([data]).size;
        }
      });

      // LocalStorageの一般的な制限は5MB
      const total = 5 * 1024 * 1024; // 5MB
      const percentage = (used / total) * 100;

      return {
        used,
        total,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error('❌ ストレージ使用量取得エラー:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}