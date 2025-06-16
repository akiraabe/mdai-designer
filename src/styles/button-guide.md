# ボタンスタイルガイド（視認性重視版）

## 基本原則
すべてのボタンは以下の統一された要素を含む：
- **高コントラスト**: 背景色と文字色の十分なコントラスト確保
- **font-bold**: フォント太さ強調で視認性向上
- **shadow-md**: 適度な影効果で立体感
- **明るい色調**: 500番台の色で視認性を確保
- **transition-colors**: ホバーアニメーション

## サイズパターン

### 標準サイズ
```tsx
className="px-4 py-2 text-sm"  // 16px, 8px padding
```

### 小サイズ
```tsx
className="px-3 py-1 text-sm"  // 12px, 4px padding
```

### 特大サイズ（フローティング）
```tsx
className="w-14 h-14"  // 56px x 56px
```

## 色系統別クラス

### Primary（青系） - メイン操作
```tsx
className="bg-blue-500 text-white border border-blue-600 hover:bg-blue-600 font-bold"
```
**用途**: エクスポート、プロジェクト作成、送信

### Success（緑系） - 作成・追加
```tsx
className="bg-green-500 text-white border border-green-600 hover:bg-green-600 font-bold"
```
**用途**: 設計書作成、保存

### Warning（オレンジ系） - 重要操作
```tsx
className="bg-orange-500 text-white border-2 border-orange-600 hover:bg-orange-600 font-bold"
```
**用途**: インポート（重要なデータ操作）

### Info（紫系） - 特殊操作
```tsx
className="bg-purple-500 text-white border border-purple-600 hover:bg-purple-600 font-bold"
```
**用途**: テストデータ読み込み

### Secondary（グレー系） - 補助操作
```tsx
className="bg-gray-500 text-white border border-gray-600 hover:bg-gray-600 font-bold"
```
**用途**: キャンセル、戻る

### Danger（赤系） - 削除・エラー
```tsx
className="bg-red-500 text-white border border-red-600 hover:bg-red-600 font-bold"
```
**用途**: 削除、エラー処理

## 特殊パターン

### アクションボタン（ライトグレーベース）
```tsx
className="text-gray-700 border border-gray-300 bg-gray-50 hover:text-[color]-600 hover:bg-[color]-50 hover:border-[color]-300"
```
**用途**: 編集、削除などの小さなアクション

### モード切り替えトグル
```tsx
// スイッチ本体
style={{ backgroundColor: isActive ? '#10b981' : '#d1d5db' }}
// 内部ボタン
style={{ backgroundColor: 'white', left: isActive ? '22px' : '2px' }}
```

## 完全なボタンテンプレート

### 標準ボタン
```tsx
<button
  className="flex items-center px-4 py-2 bg-blue-600 text-white border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
>
  <Icon className="w-4 h-4 mr-2" />
  ボタンテキスト
</button>
```

### 小ボタン
```tsx
<button
  className="flex items-center px-3 py-1 bg-green-600 text-white border border-green-700 text-sm rounded hover:bg-green-700 font-medium"
>
  <Icon className="w-4 h-4 mr-1" />
  ボタンテキスト
</button>
```

## 使用禁止パターン
- ❌ ボーダーなしのボタン（テストデータボタンの例外を除く）
- ❌ インラインスタイル（ActionButtonsは移行済み）
- ❌ font-mediumなしのボタン
- ❌ transition-colorsなしのボタン
- ❌ 影なしの重要ボタン

## 実装チェックリスト
- [ ] border設定済み
- [ ] font-medium設定済み
- [ ] hover効果設定済み
- [ ] transition-colors設定済み
- [ ] 適切な色系統選択
- [ ] アイコンとテキストの間隔統一（mr-1またはmr-2）