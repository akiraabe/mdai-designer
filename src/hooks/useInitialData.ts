// 初期データ管理フック

// 初期Markdownデータ
export const initialConditionsMarkdown = `## 表示条件

### アクセス権限
- ログイン済みユーザーのみアクセス可能
- 管理者権限保持者は全ユーザー閲覧可能
- 一般ユーザーは自分の情報のみ閲覧可能

### 表示ルール
- データが存在しない場合は「データなし」を表示
- 権限不足の場合は403エラーページにリダイレクト`;

export const initialSupplementMarkdown = `## 補足説明

### データフロー
1. 認証情報の確認
2. 権限レベルの判定
3. 適切なユーザーデータの取得
4. 画面への反映

### エラーハンドリング
- 権限不足: 403エラーページにリダイレクト
- データ取得失敗: エラーメッセージを表示
- ネットワークエラー: 再試行ボタンを表示

### パフォーマンス考慮
- 大量データの場合はページネーション実装
- キャッシュ機能により応答速度向上`;

// 初期スプレッドシートデータ
export const initialSpreadsheetData = [
  {
    name: "項目定義",
    celldata: [
      { r: 0, c: 0, v: { v: 'A1', ct: { fa: 'General', t: 'g' } } },
      { r: 0, c: 1, v: { v: 'B1', ct: { fa: 'General', t: 'g' } } },
      { r: 1, c: 0, v: { v: 'A2', ct: { fa: 'General', t: 'g' } } },
      { r: 1, c: 1, v: { v: 'B2', ct: { fa: 'General', t: 'g' } } }
    ]
  }
];

// カスタムフック（必要に応じて将来拡張）
export const useInitialData = () => {
  return {
    initialConditionsMarkdown,
    initialSupplementMarkdown,
    initialSpreadsheetData,
  };
};