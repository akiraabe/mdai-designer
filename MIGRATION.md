# リポジトリ移行ガイド 🚀

## 移行の概要

**移行元**: `https://github.com/tis-abe-akira/design-doc-editor.git`  
**移行先**: `https://github.com/akiraabe/mdai-designer.git`

このプロジェクトを企業アカウントから個人アカウントのOSSプロジェクトとして移行します。

## 📋 事前準備

### ✅ 移行前チェックリスト
- [ ] 現在の作業をすべてコミット済み
- [ ] ローカルに未保存の変更がない
- [ ] GitHubで新リポジトリ`akiraabe/mdai-designer`を作成済み
- [ ] 新リポジトリはPublic設定
- [ ] README、.gitignore、LICENSEは初期化時に作成しない（重複回避）

## 🔧 ステップ1: 新リポジトリ作成

1. **GitHub.com にログイン** (`akiraabe`アカウントでログイン)
2. **新リポジトリ作成**:
   - Repository name: `mdai-designer`
   - Description: `AI-powered Model Driven Architecture design document editor`
   - Public設定
   - **⚠️ 重要**: Add README file、Add .gitignore、Choose a license は**チェックしない**
3. **Create repository** ボタンをクリック

### 🔑 認証問題の解決（403エラー対策）

**ステップA: 古い認証情報のクリア**
```bash
# GitHub認証情報をKeychainから削除
security delete-internet-password -s github.com

# GitHub CLIからログアウト
gh auth logout
```

**ステップB: GitHub CLI で正しいアカウントにサインイン**
```bash
# GitHub CLIでサインイン開始
gh auth login --hostname github.com --git-protocol https --web

# 表示されるコードをコピー（例: 5EB4-CE6D）
# ブラウザで https://github.com/login/device にアクセス
# コードを入力し、akiraabe アカウントでログイン
```

**ステップC: 認証状態確認**
```bash
# 正しいアカウントでログインしているか確認
gh auth status

# 以下のように表示されることを確認:
# ✓ Logged in to github.com account akiraabe
```

**代替方法: Personal Access Token**（GitHub CLI使用不可の場合）:
1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes: `repo` (Full control of private repositories)
4. トークンをコピー（プッシュ時のパスワードとして使用）

## 🌐 ステップ2: リモートリポジトリ変更

```bash
# 現在のディレクトリ確認
pwd
# /Users/akiraabe/practice/design-doc-editor であることを確認

# 現在のリモート設定確認
git remote -v
# origin	https://github.com/tis-abe-akira/design-doc-editor.git (fetch)
# origin	https://github.com/tis-abe-akira/design-doc-editor.git (push)

# 新しいリモートを追加
git remote add new-origin https://github.com/akiraabe/mdai-designer.git

# 古いoriginを削除
git remote remove origin

# new-originをoriginにリネーム
git remote rename new-origin origin

# 設定確認
git remote -v
# origin	https://github.com/akiraabe/mdai-designer.git (fetch)
# origin	https://github.com/akiraabe/mdai-designer.git (push)
```

## 📤 ステップ3: 完全履歴の移行

```bash
# 現在のブランチ確認
git branch -a

# 全ブランチと履歴を新リポジトリにプッシュ
git push -u origin --all

# タグも移行（存在する場合）
git push origin --tags

# 成功確認
# Successfully pushed と表示されることを確認
```

## 🔍 ステップ4: 移行確認

```bash
# 新しいディレクトリで確認（任意）
cd /tmp
git clone https://github.com/akiraabe/mdai-designer.git
cd mdai-designer

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:5173 にアクセスして動作確認
```

## ⚙️ ステップ5: GitHub設定

### リポジトリ設定
1. **Settings → General**
   - Featuresセクション: Issues、Discussions、Projects、Wiki等を設定
   - Pull Requestsセクション: 必要な設定を有効化

2. **Settings → Pages**（GitHub Pages利用時）
   - Source: Deploy from a branch
   - Branch: gh-pages または main

### セキュリティ設定
1. **Settings → Security → Dependabot**
   - Dependabot alerts: 有効化
   - Dependabot security updates: 有効化

## 📚 ステップ6: OSSドキュメント充実

### README.md 更新
```markdown
# mdai-designer 🎨

> AI-powered Model Driven Architecture design document editor

## ✨ Features
- 🖥️ Screen Design Documents
- 🗄️ Data Model Design (ER Diagrams)
- 🤖 AI-powered Design Generation
- 📋 Project-level Export/Import
- 🔄 Model Driven Architecture Support

## 🚀 Quick Start
\`\`\`bash
git clone https://github.com/akiraabe/mdai-designer.git
cd mdai-designer
npm install
npm run dev
\`\`\`

## 📄 License
MIT License - see [LICENSE](LICENSE) file for details.
```

### CONTRIBUTING.md 作成
```markdown
# Contributing to mdai-designer

## 🎯 How to Contribute
1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 🐛 Bug Reports
Please use GitHub Issues to report bugs.

## 📝 Code Style
- Use TypeScript
- Follow existing code patterns
- Write meaningful commit messages
```

## 🏗️ ステップ7: CI/CD設定（推奨）

### GitHub Actions ワークフロー
`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm run lint
```

## 🗂️ ステップ8: 旧リポジトリ処理

### 移行通知用README
旧リポジトリ `tis-abe-akira/design-doc-editor` に以下を追加:

```markdown
# ⚠️ Repository Moved

This repository has been moved to:
**👉 https://github.com/akiraabe/mdai-designer**

Please update your bookmarks and clone the new repository for the latest updates.

## Quick migration:
\`\`\`bash
git remote set-url origin https://github.com/akiraabe/mdai-designer.git
\`\`\`
```

### アーカイブ設定
1. 旧リポジトリのSettings → General → Danger Zone
2. "Archive this repository" を実行

## ✅ 移行完了チェックリスト

- [ ] 新リポジトリに全履歴が移行されている
- [ ] `npm install && npm run dev` が正常動作
- [ ] package.json のURL更新完了
- [ ] LICENSE、NOTICE.md が正しく配置
- [ ] README.md が充実している
- [ ] GitHub Issues/Discussions設定完了
- [ ] 旧リポジトリにリダイレクト通知配置
- [ ] 旧リポジトリアーカイブ完了

## 🎉 移行完了！

新しいOSSプロジェクト `akiraabe/mdai-designer` として公開準備完了です！

### 次のステップ
1. SNSでのプロジェクト紹介
2. OSS関連サイトへの登録
3. コミュニティからのフィードバック収集
4. ユーザーガイド・チュートリアル作成

---

*移行日: 2025年6月23日*  
*移行バージョン: v0.1.0*