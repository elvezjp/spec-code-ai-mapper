# spec-code-ai-mapper

[English](./README.md) | [日本語](./README_ja.md)

[![Elvez](https://img.shields.io/badge/Elvez-Product-3F61A7?style=flat-square)](https://elvez.co.jp/)
[![IXV Ecosystem](https://img.shields.io/badge/IXV-Ecosystem-3F61A7?style=flat-square)](https://elvez.co.jp/ixv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stars](https://img.shields.io/github/stars/elvezjp/spec-code-ai-mapper?style=social)](https://github.com/elvezjp/spec-code-ai-mapper/stargazers)

設計書（Excel形式）とプログラムコードをAIで紐付け、ソースコード間の「トレーサビリティ（追跡可能性）」を可視化・管理するWebアプリケーション。

<https://github.com/user-attachments/assets/78926022-1498-4d9a-923c-cdf3a9f06534>

## AI マッパーとは？

AI マッパーは、設計書（Markdown/Excel）の各セクションと、ソースコード（Java/Python）のクラスやメソッドをAIが自動的にマッピングするツールです。大規模な開発プロジェクトにおいて、仕様がコードに正しく実装されているか、また修正がどの設計セクションに影響するかを瞬時に把握することを目的としています。

## 主な機能

- **トレーサビリティ・マトリクス生成**: 設計書セクションとコードシンボルの紐付けを一覧表示。紐付け理由もAIが解説。
- **紐付けのエクスポート**: 紐付け結果を Markdown 形式のテーブルとして出力。プロジェクトのトレーサビリティ資料に即座に利用可能。
- **設計書・コード変換**:
  - Excel (.xlsx, .xls) → Markdown変換（MarkItDown連携）
  - プログラムコード → 行番号付与（add-line-numbers連携）
- **セマンティック分割 (`md2map` / `code2map`)**:
  - 大規模なファイルを意味のある単位（章立てや関数単位）に分割し、AIが処理可能なサイズで精密なマッピングを実現。
- **AI レビュー**: 紐付けられた結果に基づき、設計と実装の不整合を自動チェック。

## 構造マッチングによる高精度な紐付け

大規模なファイルを単純な文字数で分割するのではなく、設計書の章構造やコードのAST（抽象構文木）を解析して分割・マッチングを行います。

1. **構造抽出**: `md2map` と `code2map` がそれぞれのメタデータ（INDEX / MAP）を作成。
2. **AI マッチング**: AIがINDEX・MAPを分析し、最適な組み合わせ（多対多）を特定。
3. **結果出力**: トレーサビリティ・マトリクスとして紐付け結果と理由を一覧表示。

### マッピング方式

目的に応じて3つのマッピング方式を選択できます。選択した方式に応じてAIへの指示内容（システムプロンプト）が切り替わります。

| 方式 | 説明 |
|------|------|
| **標準（LLM）** | LLMが文脈を分析して柔軟に関連付けます。 |
| **厳密（ID重視）** | IDやシンボル名の一致を優先します。トレーサビリティが明確な場合に適しています。 |
| **詳細（内容参照）** | セクションの内容も一部参照して精度を高めます（トークン消費量が増えます）。 |

### 出力形式

マッピング結果は、関連性の高い設計書セクションとコードシンボルをまとめた **グループ単位** のトレーサビリティ・マトリクスとして出力されます。1つのグループには複数の設計書セクションと複数のコードシンボルが含まれる場合があります。

| 項目 | 内容 |
|------|------|
| **グループID** | グループの識別子（group1, group2, ...） |
| **設計書セクション** | グループに属する設計書のセクションID・タイトル |
| **関連コード** | グループに属するコードのファイル名・シンボル名 |
| **理由** | AIが判断したグループ化の根拠 |

結果はMarkdown形式でエクスポートできます。

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

## システム構成 (v0.8.0)

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

### 起動 (v0.8.0)

**バックエンド**

```bash
cd versions/v0.8.0/backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**フロントエンド**

```bash
cd versions/v0.8.0/frontend
npm install
npm run dev
```

ブラウザで <http://localhost:5173> にアクセスしてください。

---

## 開発の背景

本ツールは、日本語の開発文書を対象とした開発支援AI **IXV（イクシブ）** の一部として生まれました。設計とコードの「乖離」を防ぎ、ソフトウェアの品質管理をAIで効率化することを目指しています。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 問い合わせ先

- **メールアドレス**: <info@elvez.co.jp>
- **宛先**: 株式会社エルブズ
