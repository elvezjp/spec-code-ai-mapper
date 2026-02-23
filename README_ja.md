# spec-code-ai-mapper

[English](./README.md) | [日本語](./README_ja.md)

[![Elvez](https://img.shields.io/badge/Elvez-Product-3F61A7?style=flat-square)](https://elvez.co.jp/)
[![IXV Ecosystem](https://img.shields.io/badge/IXV-Ecosystem-3F61A7?style=flat-square)](https://elvez.co.jp/ixv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stars](https://img.shields.io/github/stars/elvezjp/spec-code-ai-mapper?style=social)](https://github.com/elvezjp/spec-code-ai-mapper/stargazers)

設計書（Excel形式）とプログラムコードをAIで紐付け、ソースコード間の「トレーサビリティ（追跡可能性）」を可視化・管理するWebアプリケーション。

AI マッパーは、設計書（Markdown/Excel）の各セクションと、ソースコード（Java/Python）のクラスやメソッドをAIが自動的にマッピングするツールです。大規模な開発プロジェクトにおいて、仕様がコードに正しく実装されているか、また修正がどの設計セクションに影響するかを瞬時に把握することを目的としています。

https://github.com/user-attachments/assets/48b9c0a0-3739-4486-8c4f-ac467c5b91e7

## 特徴

- **トレーサビリティ・マトリクス生成**: 設計書セクションとコードシンボルの紐付けを一覧表示。紐付け理由もAIが解説。
- **紐付けのエクスポート**: 紐付け結果を Markdown 形式のテーブルとして出力。プロジェクトのトレーサビリティ資料に即座に利用可能。
- **設計書・コード変換**:
  - Excel (.xlsx, .xls) → Markdown変換（MarkItDown連携）
  - プログラムコード → 行番号付与（add-line-numbers連携）
- **セマンティック分割 (`md2map` / `code2map`)**:
  - 大規模なファイルを意味のある単位（章立てや関数単位）に分割し、AIが処理可能なサイズで精密なマッピングを実現。
- **AI レビュー**: 紐付けられた結果に基づき、設計と実装の不整合を自動チェック。

### 構造マッチングによる高精度な紐付け（[詳細](docs/structure-matching.md)）

大規模なファイルを単純な文字数で分割するのではなく、設計書の章構造やコードのAST（抽象構文木）を解析して分割・マッチングを行います。

1. **構造抽出**: `md2map` と `code2map` がそれぞれのメタデータ（INDEX / MAP）を作成。
2. **AI マッチング**: AIがINDEX・MAPを分析し、最適な組み合わせ（多対多）を特定。
3. **結果出力**: トレーサビリティ・マトリクスとして紐付け結果と理由を一覧表示。

#### マッピング方式

目的に応じて3つのマッピング方式を選択できます。選択した方式に応じてAIへの指示内容（システムプロンプト）が切り替わります。

| 方式 | 説明 |
|------|------|
| **標準（LLM）** | LLMが文脈を分析して柔軟に関連付けます。 |
| **厳密（ID重視）** | IDやシンボル名の一致を優先します。トレーサビリティが明確な場合に適しています。 |
| **詳細（内容参照）** | セクションの内容も一部参照して精度を高めます。 |

#### 出力形式

マッピング結果は、関連性の高い設計書セクションとコードシンボルをまとめた **グループ単位** のトレーサビリティ・マトリクスとして出力されます。1つのグループには複数の設計書セクションと複数のコードシンボルが含まれる場合があります。

| 項目 | 内容 |
|------|------|
| **グループID** | グループの識別子（group1, group2, ...） |
| **設計書セクション** | グループに属する設計書のセクションID・タイトル |
| **関連コード** | グループに属するコードのファイル名・シンボル名 |
| **理由** | AIが判断したグループ化の根拠 |

結果はMarkdown形式でエクスポートできます。

## ユースケース

- **設計書とコードのトレーサビリティ確保**: 設計書のどのセクションがコードのどの部分に対応するかをAIが自動的にマッピングし、可視化します。
- **影響分析**: コード変更時に、影響する設計書セクションを特定します。設計書の修正漏れを防止します。
- **品質管理**: 設計と実装の整合性をAIで管理し、乖離を早期に発見します。
- **AI/LLM連携**: 設計書やコードをセマンティック分割し、AIが処理しやすい形式に変換します。

## システム構成

- **フロントエンド**: Vite + React + TypeScript + Tailwind CSS
- **バックエンド**: Python / FastAPI
  - `MarkItDown` / `excel2md` (Excel→Markdown)
  - `javalang` / `ast` (コード解析)
  - `Bedrock` / `Anthropic` / `OpenAI` (AIエンジン)

## セットアップ

### インストール

```bash
git clone git@github.com:elvezjp/spec-code-ai-mapper.git
cd spec-code-ai-mapper
```

### 起動

**バックエンド**

```bash
cd versions/v0.1.0/backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**フロントエンド**

```bash
cd versions/v0.1.0/frontend
npm install
npm run dev
```

ブラウザで <http://localhost:5173> にアクセスしてください。

## 使い方

1. **ファイルを準備**:
   - 設計書（Excel）をアップロードし、「マークダウンに変換」を実行。
   - プログラム（ソースコード）をアップロードし、「add-line-numbersで変換」を実行。
2. **分割設定**:
   - 画面の「分割設定」で、設計書とコードを AI が解析しやすい単位に分割（プレビューで確認可能）。
3. **AI マッピング実行**:
   - ヘッダーの **「AI Mapper」** をクリックしてマッパー画面へ移動。
   - 「再マッチング実行」をクリックすると、AIが設計とコードの紐付けを開始します。
4. **結果の確認・出力**:
   - 生成されたトレーサビリティ・マトリクスを確認。
   - 「Markdownでエクスポート」をクリックして、紐付け資料をダウンロード。

## ディレクトリ構成

```text
spec-code-ai-mapper/
├── docker-compose.yml           # Docker Compose設定
├── Dockerfile.dev               # 開発用Dockerfile
├── docker-entrypoint.sh         # Docker起動スクリプト
├── ecosystem.config.js          # PM2設定（本番用）
├── dev.ecosystem.config.js      # PM2設定（開発用）
├── nginx/                       # Nginx設定
├── latest -> versions/v0.1.0    # シンボリックリンク（最新版を指す）
│
├── versions/                    # バージョン格納
│   └── v0.1.0/                  # 最新版
│       ├── backend/             # Python / FastAPI
│       ├── frontend/            # Vite + React + TypeScript
│       └── spec.md              # 仕様書
│
├── docs/                        # ドキュメント
│   └── structure-matching.md    # 構造マッチング機能の詳細
│
├── scripts/                     # ユーティリティスクリプト
│
├── add-line-numbers/            # サブツリー（elvezjp）
├── code2map/                    # サブツリー（elvezjp）
├── excel2md/                    # サブツリー（elvezjp）
├── markitdown/                  # サブツリー（Microsoft）
├── md2map/                      # サブツリー（elvezjp）
└── README.md                    # 本ファイル
```

## ドキュメント

- [CHANGELOG.md](CHANGELOG.md) - 変更履歴
- [CONTRIBUTING.md](CONTRIBUTING.md) - コントリビューション方法
- [SECURITY.md](SECURITY.md) - セキュリティポリシー
- [構造マッチング機能の詳細](docs/structure-matching.md) - AI マッピングと構造マッチングの技術詳細

## セキュリティ

セキュリティに関する詳細は [SECURITY.md](SECURITY.md) を参照してください。

- ファイル処理時のセキュリティ対策（Excel ファイルの `read_only=True` モード使用、ファイルサイズ制限など）
- API キーは環境変数で管理し、コードにハードコードしないことを推奨
- 信頼できるソースからのファイルのみを処理することを推奨

## コントリビューション

コントリビューションを歓迎します。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

- バグ報告や機能改善の提案は GitHub Issue で受け付けています
- プルリクエストは `main` ブランチに対して作成してください
- コーディングスタイルは既存のコードベースに従ってください

## 変更履歴

詳細は [CHANGELOG.md](CHANGELOG.md) を参照してください。

## 開発の背景

本ツールは、日本語の開発文書・仕様書を対象とした開発支援AI **IXV（イクシブ）** の開発過程で生まれた小さな実用品です。

IXVでは、システム開発における日本語の文書について、理解・構造化・活用という課題に取り組んでおり、本リポジトリでは、その一部を切り出して公開しています。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 問い合わせ先

- **メールアドレス**: <info@elvez.co.jp>
- **宛先**: 株式会社エルブズ

## 関連プロジェクト

このリポジトリには以下の外部リポジトリを git subtree で追加しています。

| ディレクトリ | リポジトリ | 説明 |
|-------------|-----------|------|
| `add-line-numbers/` | https://github.com/elvezjp/add-line-numbers | ファイルに行番号を追加するツール |
| `code2map/` | https://github.com/elvezjp/code2map | ソースコード→マインドマップ変換ツール |
| `excel2md/` | https://github.com/elvezjp/excel2md | Excel→CSVマークダウン変換ツール |
| `markitdown/` | https://github.com/microsoft/markitdown | 各種ファイル形式をMarkdownに変換するツール |
| `md2map/` | https://github.com/elvezjp/md2map | Markdown→マインドマップ変換ツール |
