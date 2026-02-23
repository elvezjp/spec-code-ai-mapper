# AI マッピングと構造マッチング機能の詳細

## 全体像

この機能は **2つの分割ツール** と **構造マッチングAPI** で構成されています。

設計書とコードをそれぞれメタデータ（INDEX / MAP）に変換し、AIがメタデータ同士を比較して関連性の高いセクションとコードシンボルをグループ化します。

---

## 1. md2map（設計書の分割）

**ディレクトリ**: [md2map/](../md2map/)

マークダウン変換済みの設計書を、見出し（H1〜H6）単位でセクション分割します。

| コンポーネント | ファイル | 役割 |
|---|---|---|
| パーサー | [markdown_parser.py](../md2map/md2map/parsers/markdown_parser.py) | ATXスタイルの見出しを正規表現で解析。コードブロックやfrontmatterを考慮 |
| Parts生成 | [parts_generator.py](../md2map/md2map/generators/parts_generator.py) | 各セクションを個別ファイルに出力（`<H1>_<H2>_<H3>.md`形式） |
| Index生成 | [index_generator.py](../md2map/md2map/generators/index_generator.py) | 階層ツリー構造の `INDEX.md` を作成 |
| Map生成 | [map_generator.py](../md2map/md2map/generators/map_generator.py) | `MAP.json` を生成（id, section, level, path, 行範囲, word count, SHA-256チェックサム） |

各セクションには `MD1`, `MD2`, ... のIDが付与され、デフォルトの分割深度は **H2** です。

### 分割モード

md2map は3つの分割モードを提供します。`heading` モードがデフォルトです。`nlp`・`ai` モードでは、見出しベースの分割後に閾値（`--split-threshold`、デフォルト500）を超えるセクションを再分割し「サブスプリット」を挿入します。

| モード | 概要 | 再分割の境界決定方法 |
|---|---|---|
| **heading** | 見出し階層のみで分割（デフォルト） | なし（再分割しない） |
| **nlp** | 形態素解析で意味的境界を検出 | 隣接段落間の名詞 Jaccard 類似度が低い箇所 |
| **ai** | LLM に行番号付きテキストを送信し分割とタイトル生成を委任 | LLM が返す行範囲グループとタイトル |

#### heading モード

追加依存なし。見出し（H1〜H6）の階層構造のみでセクションを分割します。シンプルで高速ですが、見出しのない長大なセクションはそのまま1つのセクションとして出力されます。

#### nlp モード

`sudachipy` + `sudachidict-core` が必要（`pip install md2map[nlp]`）。見出しベースで分割した後、閾値を超えるセクションに対して段落間の名詞 Jaccard 類似度を算出し、類似度が低い箇所（話題の転換点）で再分割します。日本語文書に適しています。

#### ai モード

LLMプロバイダーの認証情報が必要。見出しベースで分割した後、閾値を超えるセクションの内容を行番号付きでLLMに送信し、意味的に適切な分割位置とサブタイトルの生成を委任します。テーブルなど空行のない構造にも対応でき、最も柔軟な分割が可能です。

| CLI オプション | 説明 | デフォルト |
|---|---|---|
| `--ai-provider` | AIプロバイダー（`openai` / `anthropic` / `bedrock`） | `bedrock` |
| `--ai-model` | AIモデルID | プロバイダーごとのデフォルト |
| `--ai-region` | Bedrock用リージョン | `ap-northeast-1` |

| プロバイダー | 必要な認証情報 | デフォルトモデル |
|---|---|---|
| `openai` | `OPENAI_API_KEY` 環境変数 | `gpt-4o-mini` |
| `anthropic` | `ANTHROPIC_API_KEY` 環境変数 | `claude-haiku-4-5-20251001` |
| `bedrock` | AWS 認証情報（IAMロールまたは環境変数） | `global.anthropic.claude-haiku-4-5-20251001-v1:0` |

---

## 2. code2map（ソースコードの分割）

**ディレクトリ**: [code2map/](../code2map/)

ソースコードをAST（抽象構文木）解析し、クラス・メソッド・関数単位で分割します。

| パーサー | ファイル | 方式 |
|---|---|---|
| Python | [python_parser.py](../code2map/parsers/python_parser.py) | Python標準の`ast`モジュールで解析。クラス、メソッド、トップレベル関数を抽出 |
| Java | [java_parser.py](../code2map/parsers/java_parser.py) | `javalang`ライブラリで解析。クラス、インターフェース、メソッド、コンストラクタを抽出 |

各シンボルには `CD1`, `CD2`, ... のIDが付与されます。ネストされた関数は親に含められます。

---

## 3. 構造マッチング

バックエンドのAPIは [versions/v0.8.0/backend/app/routers/](../versions/v0.8.0/backend/app/routers/) に実装されています。

### エンドポイント: `POST /api/review/structure-matching`

**ファイル**: [review.py](../versions/v0.8.0/backend/app/routers/review.py)

- **入力**: 設計書とコードそれぞれの `INDEX.md` + `MAP.json`
- **処理**: LLMが両方の構造を分析し、関連性の高いセクションとコードシンボルを **多対多** のグループにまとめる
- **出力**: `MatchedGroup[]` — 各グループに `docSections` と `codeSymbols` が含まれる

```
例: group1「ユーザー管理」
  - 設計書: MD1(概要), MD3(ユーザー登録)
  - コード: CD1(UserService), CD4(UserRepository)
  - 理由: "Both handle user operations"
```

ポイントは **1:1マッピングではなく多対多** であること。1つの設計セクションが複数のコード部分に、またその逆も関連づけられます。

### マッピング方式

選択した方式に応じて、AIへのシステムプロンプトの指示内容が切り替わります。

| 方式 | 値 | プロンプトへの影響 |
|---|---|---|
| **標準（LLM）** | `standard` | LLMが文脈を分析して柔軟に関連付け。設計書の構造とコードの構造を比較し、関連性の高いセクションとシンボルをグループにまとめる |
| **厳密（ID重視）** | `strict` | IDやシンボル名の一致を最優先。推測によるマッピングを最小限に抑える |
| **詳細（内容参照）** | `detailed` | 構造だけでなくMAP情報の概要テキストも参照し、意味的に関連の深いセクションとシンボルを網羅的にグループ化 |

### 出力形式

LLMは以下のJSON形式でグループ化結果を返します。

```json
{
  "groups": [
    {
      "id": "group1",
      "name": "グループの表示名",
      "doc_sections": [
        { "id": "MD1", "title": "セクションタイトル", "path": "パス" }
      ],
      "code_symbols": [
        { "id": "CD1", "filename": "ファイル名", "symbol": "シンボル名" }
      ],
      "reason": "グループ化の理由"
    }
  ]
}
```

フロントエンドではこれをトレーサビリティ・マトリクスとしてテーブル表示し、Markdown形式でエクスポートできます。

---

## 4. フロントエンド実装

### Mapper コンポーネント

**ファイル**: [Mapper.tsx](../versions/v0.8.0/frontend/src/features/mapper/Mapper.tsx)

マッピング結果を表示する画面。`SharedStateContext` を通じて分割プレビュー結果やLLM設定を共有し、構造マッチングAPIを呼び出します。

| 機能 | 説明 |
|---|---|
| マッチング実行 | 分割プレビュー結果（INDEX / MAP）をもとに `executeStructureMatching` APIを呼び出し |
| 結果テーブル | グループID・設計書セクション・関連コード・理由を一覧表示 |
| Markdownエクスポート | マッピング結果をMarkdownテーブルとしてダウンロード |

### 分割設定

**ファイル**: [SplitSettingsSection.tsx](../versions/v0.8.0/frontend/src/features/reviewer/components/SplitSettingsSection.tsx)

| 設定項目 | 説明 |
|---|---|
| 設計書モード | 一括 / 分割 の選択 |
| プログラムモード | 一括 / 分割 の選択 |
| 分割深度 | 設計書の分割深度（H2 / H3 / H4） |
| マッピング方式 | 標準（LLM）/ 厳密（ID重視）/ 詳細（内容参照） |

### 関連するフック・サービス

| ファイル | 役割 |
|---|---|
| [useSplitSettings.ts](../versions/v0.8.0/frontend/src/features/reviewer/hooks/useSplitSettings.ts) | 分割設定の状態管理、分割プレビューAPI呼び出し |
| [useReviewerSettings.ts](../versions/v0.8.0/frontend/src/features/reviewer/hooks/useReviewerSettings.ts) | LLM設定、システムプロンプト管理 |
| [api.ts](../versions/v0.8.0/frontend/src/features/reviewer/services/api.ts) | 各APIエンドポイントへのリクエスト |

---

## 5. 設計上のポイント

- **ステートレスなバックエンド**: サーバー側にセッション状態を持たず、各APIコールが必要なデータを全て含む。失敗時のリトライが容易
- **トークン推定**: 日本語 ≈ 1.5トークン/文字、英語 ≈ 0.25トークン/文字 で概算し、分割の必要性判断に利用
- **メタデータのみでマッチング**: 実コンテンツではなく INDEX.md + MAP.json（メタデータ）だけをLLMに渡すため、トークン消費を抑えて構造分析を実施

---

## 6. エンドツーエンドの流れ

```
ユーザー: 設計書.xlsx + ソースコード をアップロード
    ↓
[Excel→Markdown変換、コードに行番号付与]（変換機能）
    ↓
[md2map] 設計書 → セクション分割 → INDEX.md + MAP.json
[code2map] コード → シンボル分割 → INDEX.md + MAP.json
    ↓
[構造マッチング] INDEX + MAP をLLMに送信 → グループ化結果（MatchedGroup[]）
    ↓
トレーサビリティ・マトリクスとして表示 / Markdownエクスポート
```

---

## 補足: AIレビュー機能（レガシー）

バックエンドには以下のエンドポイントが残っていますが、AIマッパーとしての主要機能には含まれません。

| エンドポイント | 説明 |
|---|---|
| `POST /api/review` | 一括レビュー実行 |
| `POST /api/review/group` | グループ単位のレビュー実行 |
| `POST /api/review/integrate` | グループレビュー結果の統合 |

これらはAIレビュアー（spec-code-ai-reviewer）時代のフェーズ2・3に相当する機能です。
