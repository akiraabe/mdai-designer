# モデル駆動AI生成の具体例

## 例1: プロジェクト管理システム

### 定義済みモデル
```
# Organization
fields:
  id: string primary
  name: string required
  department: string required
  contactPerson: string required

# ProjectType  
fields:
  id: string primary
  name: string required
  standardDuration: number required
  requiredSkills: string[] required

# Customer
fields:
  id: string primary
  name: string required
  industry: string required
  contactEmail: email required

# Project
fields:
  id: string primary
  name: string required
  organizationId: string required
  typeId: string required  
  customerId: string required
  startDate: date required
  budget: number required
  status: string required

relationships:
  Project many-to-one -> Organization
  Project many-to-one -> ProjectType
  Project many-to-one -> Customer
```

### ユーザー指示
```
"プロジェクト登録画面を作って"
```

### モデル駆動AI生成結果

#### 📊 項目定義（自動生成）
```
項目名 | 型 | 必須 | UI種別 | 説明
-----|----|----|------|----
name | 文字列 | ○ | テキスト入力 | プロジェクト名
organizationId | 参照 | ○ | 組織選択ドロップダウン | Organization.name表示、Organization.id格納
typeId | 参照 | ○ | 種別選択ドロップダウン | ProjectType.name表示、standardDuration自動表示
customerId | 参照 | ○ | 顧客検索オートコンプリート | Customer.name検索、industry表示
startDate | 日付 | ○ | 日付ピッカー | 開始日、未来日付のみ許可
budget | 数値 | ○ | 数値入力 | 予算、正数のみ、3桁区切り表示
status | 文字列 | ○ | 選択ボックス | 計画中/進行中/完了/中止
```

#### 📝 表示条件（業務ロジック反映）
```markdown
# プロジェクト登録画面 表示条件

## アクセス権限
- ユーザーロール: 'admin' OR 'project_manager' のみ登録可能
- 組織制限: ユーザーの所属組織のプロジェクトのみ作成可能

## 入力制御
### organizationId（組織選択）
- 表示: Organization.name + " (" + Organization.department + ")"
- ソート: Organization.name昇順
- フィルター: アクティブな組織のみ

### typeId（プロジェクト種別）
- 表示: ProjectType.name
- 連動表示: 選択時にstandardDuration（標準期間）を自動表示
- ヘルプ: requiredSkills（必要スキル）をツールチップ表示

### customerId（顧客選択）
- 検索: Customer.name、Customer.industry で部分一致検索
- 表示形式: "顧客名 (業界名)"
- 新規顧客: "新規顧客登録" リンクで別画面へ

### startDate（開始日）
- 制限: 当日以降の日付のみ選択可能
- デフォルト: 翌営業日を自動設定
- 連動: typeId選択時、standardDurationを加算した終了予定日を自動計算表示

### budget（予算）
- 形式: 3桁区切りカンマ表示
- 通貨: 円表示（¥）
- 最小値: 1円以上
- 最大値: 999,999,999円

### status（ステータス）
- 初期値: "計画中"
- 選択肢: 計画中/進行中/完了/中止
- 制限: 登録時は "計画中" のみ選択可能

## バリデーション
- organizationId: Organization.id の存在チェック
- typeId: ProjectType.id の存在チェック  
- customerId: Customer.id の存在チェック
- startDate: 過去日付禁止、営業日チェック
- budget: 正数チェック、上限チェック
- 重複チェック: 同一組織+同一名のプロジェクト禁止

## 画面遷移
- 登録成功: プロジェクト詳細画面へ
- キャンセル: プロジェクト一覧画面へ
- 新規顧客: 顧客登録画面へ（別タブ）
```

#### 📋 補足説明（技術仕様）
```markdown
# プロジェクト登録画面 技術仕様

## データ整合性
### 外部キー制約
- Project.organizationId → Organization.id (CASCADE UPDATE, RESTRICT DELETE)
- Project.typeId → ProjectType.id (CASCADE UPDATE, RESTRICT DELETE)  
- Project.customerId → Customer.id (CASCADE UPDATE, RESTRICT DELETE)

### 業務制約
- プロジェクト名の重複チェック（同一組織内）
- 予算上限チェック（組織の年間予算との整合性）
- 開始日の妥当性チェック（組織の営業カレンダーとの整合性）

## セキュリティ考慮事項
### 認証・認可
- JWT認証必須
- 組織横断アクセス禁止
- ロールベースアクセス制御（RBAC）実装

### データ保護
- 予算情報の暗号化保存
- 顧客情報アクセスログ記録
- 個人情報マスキング表示

## パフォーマンス最適化
### データベース
- Organization, ProjectType, Customer テーブルのインデックス最適化
- プロジェクト検索用複合インデックス（organizationId, status, startDate）
- 組織別データ分割（パーティショニング）

### フロントエンド
- 顧客検索のデバウンス実装（300ms）
- Organization, ProjectType のキャッシュ戦略
- 大量データ対応のバーチャルスクロール

## 保守性
### エラーハンドリング
- 外部キー制約エラーの分かりやすいメッセージ変換
- ネットワークエラー時の自動リトライ（最大3回）
- フォーム入力の自動保存（5分間隔）

### 監査ログ
- プロジェクト作成・更新・削除の全操作をログ記録
- 変更前後の値を JSON 形式で保存
- 操作者、操作日時、IP アドレスの記録

### テスト戦略
- 単体テスト: バリデーション、計算ロジック
- 結合テスト: データベース制約、外部API連携
- E2Eテスト: 主要業務フローの自動テスト
```

## 比較: 通常生成 vs モデル駆動生成

### 通常のAI生成
```
項目: プロジェクト名、説明、開始日、終了日、担当者
→ 汎用的で実際の業務では使えない
```

### モデル駆動AI生成  
```
項目: Project.name、Project.organizationId（Organization参照UI）、
      Project.typeId（ProjectType参照、standardDuration連動表示）、
      Project.customerId（Customer検索UI）...
→ 実際の業務システムで即利用可能な高精度設計書
```