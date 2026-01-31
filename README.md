# Projects & Resource Visualizer (PRV)

プロジェクトとリソース（人員）の状況を可視化し、最適な管理を支援するダッシュボードアプリケーションです。
React + Vite で構築されており、モダンなUIとインタラクティブな操作性を提供します。

## 機能概要

### 1. ダッシュボード (Dashboard)
- **バブルチャート (Leads Bubble Chart):** 案件の「確度」「予算」「時期」を視覚的に把握できます。
- **KPI表示:** 売上予測、稼働率、リソース不足などの重要指標を一目で確認。

### 2. プロジェクト管理
- **案件一覧:** リード（プレ活動）と受注案件を分けて管理。
- **ドラッグ＆ドロップ:** ステータス変更やメンバーアサインが可能（予定）。
- **AIアドバイス:** 各案件のリスクや課題に対して、AIがアドバイスを提供します。

### 3. リソース管理 (Resource Management)
- **リソースヒートマップ:** メンバーごとの稼働状況を色分けして表示。過負荷や空き状況を即座に特定できます。
- **アサイン管理:** プロジェクトやリードへのメンバー割り当てを管理。

### 4. 高度なログと監査 (Advanced Audit Logging)
- **更新履歴:** プロジェクトの変更、メンバーの移動などの全操作を記録。
- **詳細差分:** 「何が」「どう変わったか」を詳細に追跡可能。
- **AIサマリ生成 (Beta):** 指定期間の動き（新規案件、人の出入り、進捗）をAIが自動で要約・レポート化します。

## 技術スタック

- **Frontend:** React 19, Vite
- **Routing:** React Router v7
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Styling:** Custom CSS Variables, Glassmorphism Design
- **AI Integration:** OpenAI / Azure OpenAI / Vertex AI (Gemini) settings

## セットアップ手順

### 必要要件
- Node.js (v18以上推奨)
- npm

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd projects-resource-visualizer

# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```
ブラウザで `http://localhost:5173` にアクセスしてください。

## AI機能の設定

設定画面（Settings）から、利用するLLMプロバイダーの設定を行ってください。

- **OpenAI:** API Key
- **Azure OpenAI:** API Key, Endpoint, Deployment Name
- **Vertex AI:** Service Account JSON (Google Cloud)

## ログ機能について
本アプリケーションは、ローカルストレージを使用して監査ログを永続化しています。
将来的なバックエンド移行（PocketBase等）を見据えたデータ構造で設計されています。
