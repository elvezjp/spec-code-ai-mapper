# spec-code-ai-mapper

[English](./README.md) | [日本語](./README_ja.md)

[![Elvez](https://img.shields.io/badge/Elvez-Product-3F61A7?style=flat-square)](https://elvez.co.jp/)
[![IXV Ecosystem](https://img.shields.io/badge/IXV-Ecosystem-3F61A7?style=flat-square)](https://elvez.co.jp/ixv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stars](https://img.shields.io/github/stars/elvezjp/spec-code-ai-mapper?style=social)](https://github.com/elvezjp/spec-code-ai-mapper/stargazers)

設計書（Excel形式）とプログラムコードをAIで紐付け、ソースコード間の「トレーサビリティ（追跡可能性）」を可視化・管理するWebアプリケーション。

AI マッパーは、設計書（Markdown/Excel）の各セクションと、ソースコード（Java/Python）のクラスやメソッドをAIが自動的にマッピングするツールです。大規模な開発プロジェクトにおいて、仕様がコードに正しく実装されているか、また修正がどの設計セクションに影響するかを瞬時に把握することを目的としています。

https://github.com/user-attachments/assets/48b9c0a0-3739-4486-8c4f-ac467c5b91e7

## 想定する利用環境

本ツールはローカル実行を前提としており、アプリケーション自体に認証・認可はありません。到達できる相手は、サーバーに設定された認証情報で LLM を呼び出し、課金を発生させる可能性があります。

- バックエンドは `--host 127.0.0.1` を指定して起動してください。
- ネットワークに公開する場合は、リバースプロキシ等で認証を必須にし、バックエンドへの直接アクセスを制限してください。
- CORS の既定値は `http://localhost:5173`、`http://127.0.0.1:5173`、`http://localhost:4173`、`http://127.0.0.1:4173` のみです。未設定・空白の場合もこの既定値を使います。
- 別オリジンを使う場合は `CORS_ORIGINS` に明示してください。`*` を含む設定では認証情報を許可しません。全許可は避けてください。CORS は認証やネットワークアクセス制限の代わりにはなりません。


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

### 必要環境

- Python 3.11 以上
- Node.js 20.19以上（20.x）、22.12以上（22.x）、または24以上
- [uv](https://docs.astral.sh/uv/) パッケージマネージャー
- AWS アカウント（Bedrock へのアクセス権限）または Anthropic/OpenAI API キー

### インストール

```bash
git clone git@github.com:elvezjp/spec-code-ai-mapper.git
cd spec-code-ai-mapper
```

### 起動

**バックエンド**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**フロントエンド**

```bash
cd frontend
npm install
npm run dev
```

ブラウザで <http://localhost:5173> にアクセスしてください。

## 使い方

1. **ファイルを準備**:
   - 設計書（Excel）をアップロードし、「マークダウンに変換」を実行。
   - プログラム（ソースコード）をアップロードし、「add-line-numbersで変換」を実行。
2. **分割設定**:
   - 設計書: 一括 or 分割（見出しレベル H2/H3/H4）を選択。
   - プログラム: 一括 or 分割を選択。
   - プレビューで分割結果を確認可能。
3. **マッピング方式の選択**:
   - 標準 / 厳密 / 詳細 から選択。方式に応じてAIへのシステムプロンプトが切り替わります。
4. **AI マッピング実行**:
   - ヘッダーの **「AI Mapper」** をクリックしてマッパー画面へ移動。
   - 「再マッチング実行」をクリックすると、AIが設計とコードの紐付けを開始します。
5. **結果の確認・出力**:
   - 生成されたトレーサビリティ・マトリクスを確認。
   - ZIPで入出力データ一式（システムプロンプト、設計書MD、コード、結果）をダウンロード。

## ディレクトリ構成

```text
spec-code-ai-mapper/
├── backend/                     # Python / FastAPI
├── frontend/                    # Vite + React + TypeScript
│
├── docs/                        # ドキュメント
│   ├── spec.md                  # 仕様書
│   ├── config-file-generator-spec.md  # 設定ファイルジェネレーター仕様書
│   └── structure-matching.md    # 構造マッチング機能の詳細
│
├── .env.example                 # システムLLM（AWS Bedrock）用の環境変数サンプル
└── README.md                    # 本ファイル
```

## バージョン管理

リポジトリのルートでは最新のコードのみを保持し、バージョン管理は git tag で行います。

- `main` ブランチには次バージョンの変更を [CHANGELOG_ja.md](CHANGELOG_ja.md) の `## [X.Y.Z] - Unreleased` 見出しの下に蓄積します
- リリース時に見出しの日付を確定し、`backend/pyproject.toml` のバージョン（およびフロントエンドのバージョン表記）を確認のうえ、`vX.Y.Z` タグを作成します

### 旧バージョンを利用する場合

旧バージョン（v0.1.0〜v0.1.2）は、以前は `versions/` ディレクトリ配下にスナップショットとして保持していました。この構成（git subtree で取り込んでいた外部ツールのディレクトリを含む）は `v0.1.2` タグに保存されています。

```bash
git checkout v0.1.2
# 旧バージョンは versions/v0.1.0 〜 versions/v0.1.2 配下にあります
```

**注意**:

- `v0.1.2` タグ配下のコードは凍結スナップショットであり、v0.2.0 以降のセキュリティ修正（パストラバーサル、CORS 設定など。詳細は [CHANGELOG_ja.md](CHANGELOG_ja.md)）を含みません。参照・検証用途に限り、実際の利用には最新版を使用してください
- `v0.1.2` タグは旧構成のアーカイブ参照点のため、削除・付け替えを行わないでください

## ドキュメント

- [CHANGELOG_ja.md](CHANGELOG_ja.md) - 変更履歴
- [CONTRIBUTING_ja.md](CONTRIBUTING_ja.md) - コントリビューション方法
- [SECURITY_ja.md](SECURITY_ja.md) - セキュリティポリシー
- [仕様書](docs/spec.md) - 詳細仕様書
- [構造マッチング機能の詳細](docs/structure-matching.md) - AI マッピングと構造マッチングの技術詳細

## セキュリティ

セキュリティに関する詳細は [SECURITY_ja.md](SECURITY_ja.md) を参照してください。

- ファイル処理時のセキュリティ対策（Excel ファイルの `read_only=True` モード使用、ファイルサイズ制限など）
- API キーは環境変数で管理し、コードにハードコードしないことを推奨
- 信頼できるソースからのファイルのみを処理することを推奨

### Dependabotアラートの運用方針

本リポジトリはルート直下（`backend/` / `frontend/`）に最新コードのみを保持し、旧バージョンは git tag で参照するため、旧バージョンは Dependabot のスキャン対象になりません。外部ツール（`add-line-numbers`、`code2map`、`excel2md`、`markitdown`、`md2map`）は uv の依存関係として取得しており、それらの脆弱性はルートの lockfile 経由で検出されます。これらを踏まえ、本リポジトリでは以下の方針で Dependabot アラートを運用します。

#### Malware タブ

- **必ず修正対応する**

#### Vulnerable タブ

| 対象 | 対応 |
|------|------|
| ルートの lockfile（`backend/uv.lock`、`frontend/package-lock.json`） | **修正対応**（依存更新／PR作成） |

Dismiss したアラートは「同一 manifest × 同一パッケージ × 同一 CVE」の組み合わせでは再発生しませんが、同じパッケージに別の CVE が公開された場合は新規アラートとして再通知されます。

## コントリビューション

コントリビューションを歓迎します。詳細は [CONTRIBUTING_ja.md](CONTRIBUTING_ja.md) を参照してください。

- バグ報告や機能改善の提案は GitHub Issue で受け付けています
- プルリクエストは `main` ブランチに対して作成してください
- コーディングスタイルは既存のコードベースに従ってください

## 変更履歴

詳細は [CHANGELOG_ja.md](CHANGELOG_ja.md) を参照してください。

## 開発の背景

本ツールは、日本の開発現場でAIを活かすためのAI開発エコシステム **IXV（イクシブ）** の開発過程で生まれた小さな実用品です。

IXVでは、開発方法論とOSSを提供することで、AI活用を現場に根付かせる取り組みを進めており、本リポジトリでは、その一部を切り出して公開しています。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 問い合わせ先

- **メールアドレス**: <info@elvez.co.jp>
- **宛先**: 株式会社エルブズ

## 関連プロジェクト

以下の外部ツールを依存関係として使用しています（uv により PyPI または git ソースからインストール。`backend/pyproject.toml` 参照）。

| パッケージ | リポジトリ | 説明 |
|-------------|-----------|------|
| add-line-numbers | https://github.com/elvezjp/add-line-numbers | ファイルに行番号を追加するツール |
| code2map | https://github.com/elvezjp/code2map | ソースコード→マインドマップ変換ツール |
| excel2md | https://github.com/elvezjp/excel2md | Excel→CSVマークダウン変換ツール |
| markitdown | https://github.com/microsoft/markitdown | 各種ファイル形式をMarkdownに変換するツール |
| md2map | https://github.com/elvezjp/md2map | Markdown→マインドマップ変換ツール |

ソースを参照したい場合は、各上流リポジトリを直接 clone してください（例: `git clone https://github.com/elvezjp/excel2md.git`）。これらのリポジトリは以前 git subtree として取り込まれており、その構成は `v0.1.2` タグに保存されています。
