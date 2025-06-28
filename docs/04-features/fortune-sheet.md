# Fortune-Sheet関連機能

## 重要：Fortune-Sheetコンポーネントのデータ更新問題対策

### 問題概要
Fortune-Sheetコンポーネント（SpreadsheetEditor）でデータを更新する際、以下の問題が発生する：
1. **チカチカ問題**: keyプロパティが変更されるとコンポーネントが再マウントされ、画面がチカチカする
2. **シート名問題**: シート名が同じ場合、データ内容が変わってもスプレッドシートの表示が更新されない

### 対策（必須）

#### 1. チカチカ問題の対策
**keyプロパティは絶対に固定化**
```typescript
// ❌ 絶対にやってはいけない
const componentKey = useMemo(() => {
  return `workbook-${Date.now()}`;
}, [data]);

// ✅ 正しい方法
const componentKey = 'workbook-fixed-key';
```

**データ更新はWorkbook APIを使用**
```typescript
// useEffectでWorkbook APIを使って直接データ更新
useEffect(() => {
  if (workbookRef.current && validData && validData.length > 0) {
    workbookRef.current.setData(validData);
  }
}, [validData]);
```

#### 2. シート名問題の対策（重要！）
**データ内容も含めたキー生成で確実な更新を保証**
```typescript
// ❌ シート名のみ（データ変更時に更新されない）
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  return `workbook-${sheetName}`;
}, [validData?.[0]?.name]);

// ✅ データ内容も含める（推奨解決策）
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  const cellCount = validData?.[0]?.celldata?.length || 0;
  const dataHash = JSON.stringify(validData?.[0]?.celldata?.slice(0, 5)) || '';
  return `workbook-${sheetName}-${cellCount}-${dataHash.length}`;
}, [validData?.[0]?.name, validData?.[0]?.celldata]);
```

### 問題の根本原因
**Reactのキー機能による制約**: Reactは同じキーのコンポーネントを再レンダリングしない。そのため：
- シート名が同じ → 同じキー → コンポーネント更新されない → データ変更が反映されない
- シート名が異なる → 異なるキー → コンポーネント再マウント → データ変更が反映される

### 実証済み解決策（最新版・推奨）
```typescript
// データ内容も含めたキー生成でデータ変更時の確実な更新を保証
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  const cellCount = validData?.[0]?.celldata?.length || 0;
  const dataHash = JSON.stringify(validData?.[0]?.celldata?.slice(0, 5)) || '';
  return `workbook-${sheetName}-${cellCount}-${dataHash.length}`;
}, [validData?.[0]?.name, validData?.[0]?.celldata]);
```

**利点:**
- シート名が同じでもデータ内容が変われば確実に更新される
- チカチカは最小限（データ変更時のみ再マウント）
- セル数やデータ内容の変化を検知して適切に更新

### 再発防止策
- **必ず**この対策を適用すること
- 新しい開発者がこの問題に遭遇した場合、このドキュメントを参照させること
- コードレビュー時にkeyプロパティの実装を確認すること
- シート名問題の存在を開発チーム全体で共有すること

## Fortune-Sheetの機能改善と制約

### 実装済み機能改善

#### 1. セル結合情報の保存・復元対応 ✅
**実装内容:**
- セル結合情報（config.merge）の詳細ログ追加
- 保存時・読み込み時・変更時の結合情報の流れを追跡可能
- handleChange関数とuseFileOperations関数で結合情報を確実に保存

**使用方法:**
- Excelからセル結合をコピペ → 保存 → 読み込み
- コンソールで「🔗 セル結合情報あり」「💾 セル結合情報を保存」ログを確認

#### 2. 日本語IME入力時のセル移動問題対策 ✅
**問題:** 日本語入力でIME確定時のEnterキーが次セル移動として認識される

**実装内容:**
- compositionstart/compositionendイベントでIME状態を追跡
- IME入力中のEnterキーをstopPropagation()で無効化
- containerRef経由でSpreadsheetEditor全体にイベントリスナー設定

**動作確認:**
- 日本語入力時にコンソールで「🈶 IME入力開始/終了」ログが表示
- IME確定のEnterキーではセル移動しない

### ライブラリ制約により実装困難な機能

#### 3. 書式情報（セル高さ・折り返し）のコピペ対応 ❌
**制約理由:**
- Fortune-Sheetライブラリの書式互換性が限定的
- Excelの複雑な書式設定（行高さ自動調整、テキスト折り返し詳細設定等）との互換性なし
- セルレベルの詳細書式情報（フォント、パディング等）の完全保持が困難

**代替案:**
- より高機能なスプレッドシートライブラリの検討（Luckysheet、OnlyOffice、AG-Grid等）
- 基本的な書式情報（太字、色等）のみの対応に留める

**判断:**
- プロジェクトの複雑性とライブラリ制約を考慮し、この機能は諦める
- Fortune-Sheetの標準機能範囲内での運用を推奨

## SpreadsheetEditor編集モード切り替え機能（2025年1月実装） 🎯

### 実装概要
SpreadsheetEditorに**編集モード・表示モード切り替え機能**を実装。手作業編集時のフォーカス維持問題と読み込み時のデータ更新問題を根本的に解決し、ユーザビリティを大幅向上。

### 実装済み機能

#### 1. モード切り替えシステム
- **UIコンポーネント**: iOS風トグルスイッチによる直感的なモード切り替え
- **表示モード（デフォルト）**: 読み込み対応・編集無効化
- **編集モード**: 手作業編集可能・フォーカス維持・読み込み無効化
- **視覚的フィードバック**: 現在のモードと機能を色付きで明確表示

#### 2. 技術的解決策

**問題1: 手作業編集時のフォーカス問題**
```typescript
// 解決策: モード別キー生成
const componentKey = useMemo(() => {
  if (isEditMode) {
    return 'workbook-edit-mode';  // 固定キーでフォーカス維持
  } else {
    // 表示モード：動的キーで読み込み対応
    const key = `workbook-view-${sheetName}-${cellCount}-${dataHash.length}`;
    return key;
  }
}, [isEditMode, validData?.[0]?.name, validData?.[0]?.celldata]);
```

**問題2: 表示モードでの誤編集防止**
```typescript
// 解決策: 透明オーバーレイによる編集無効化
{!isEditMode && (
  <div style={{ 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent',
    cursor: 'not-allowed',
    zIndex: 1000
  }} />
)}
```

**問題3: 両モードでのデータ表示**
```typescript
// 解決策: データ読み込み処理を両モードで実行
useEffect(() => {
  if (workbookRef.current && validData && validData.length > 0) {
    workbookRef.current.setData(validData);
  }
}, [data, validData]);
```

## SpreadsheetEditor機能チェックリスト

**機能修正時は必ず以下を確認すること：**

### 基本機能
- [ ] **データ表示**: サンプルデータが正常に表示される
- [ ] **読み込み機能**: JSONファイル読み込みでデータが正常に更新される
- [ ] **保存機能**: データが正常にJSONファイルに保存される
- [ ] **テストデータ読み込み**: 紫ボタンでテストデータが読み込める

### モード切り替え機能
- [ ] **表示モード→編集モード**: スイッチで正常に切り替わる
- [ ] **編集モード→表示モード**: スイッチで正常に切り替わる
- [ ] **表示モード時の編集無効化**: クリックしてもアラートが表示され編集できない
- [ ] **編集モード時の編集可能**: セルをクリックして編集できる

### フォーカス維持機能
- [ ] **編集モード時のセル入力**: Enter押下後、次のセルにフォーカスが移動する
- [ ] **編集モード時の連続入力**: 複数セルを連続で編集できる
- [ ] **カーソル行方不明問題**: 再描画によるフォーカス喪失が発生しない

### リサイズ機能
- [ ] **リサイズハンドル表示**: スプレッドシート下部にリサイズハンドルが表示される
- [ ] **高さ変更**: ドラッグで高さが変更できる
- [ ] **Workbook追随**: リサイズ後にWorkbookの表示領域が連動して変更される
- [ ] **表示モード時のリサイズ**: 表示モードでリサイズが正常に動作する
- [ ] **編集モード時のリサイズ**: 編集モードでリサイズが正常に動作する

### 複合機能
- [ ] **読み込み後の編集**: 読み込み→編集モード→セル編集の流れが正常
- [ ] **編集後の保存**: 編集→保存の流れが正常
- [ ] **リサイズ後の読み込み**: リサイズ→読み込みの流れが正常
- [ ] **モード切り替え後のリサイズ**: モード切り替え→リサイズの流れが正常

### エラー対応
- [ ] **不正データの処理**: 空データや破損データでもエラーにならない
- [ ] **コンソールログ**: 適切なデバッグログが出力される
- [ ] **エラーバウンダリ**: 予期しないエラーで画面が白くならない

**注意事項:**
- キー生成ロジックの変更時は**全項目**を確認すること
- useEffectの依存配列変更時は**フォーカス機能**を重点確認すること
- 新機能追加時は**既存機能への影響**を必ず確認すること