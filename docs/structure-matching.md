# AI マッピングと構造マッチング機能の詳細

## 全体像

この機能は **2つの分割ツール** と **構造マッチングAPI** で構成されています。

設計書とコードをそれぞれメタデータ（INDEX / MAP）に変換し、AIがメタデータ同士を比較して関連性の高いセクションとコードシンボルをグループ化します。

---

## 1. md2map（設計書の分割）

**リポジトリ**: [elvezjp/md2map](https://github.com/elvezjp/md2map)（本アプリは `v0.5.1` を使用）

マークダウン変換済みの設計書を、見出し（H1〜H6）単位でセクション分割します。

| コンポーネント | ファイル | 役割 |
|---|---|---|
| パーサー | [markdown_parser.py](https://github.com/elvezjp/md2map/blob/v0.5.1/md2map/parsers/markdown_parser.py) | ATXスタイルの見出しを正規表現で解析。コードブロックやfrontmatterを考慮 |
| Parts生成 | [parts_generator.py](https://github.com/elvezjp/md2map/blob/v0.5.1/md2map/generators/parts_generator.py) | 各セクションを個別ファイルに出力（`<H1>_<H2>_<H3>.md`形式） |
| Index生成 | [index_generator.py](https://github.com/elvezjp/md2map/blob/v0.5.1/md2map/generators/index_generator.py) | 階層ツリー構造の `INDEX.md` を作成 |
| Map生成 | [map_generator.py](https://github.com/elvezjp/md2map/blob/v0.5.1/md2map/generators/map_generator.py) | `MAP.json` を生成（id, section, level, path, 行範囲, word count, SHA-256チェックサム） |

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

**リポジトリ**: [elvezjp/code2map](https://github.com/elvezjp/code2map)（本アプリは `v0.3.0` を使用）

ソースコードをAST（抽象構文木）解析し、クラス・メソッド・関数単位で分割します。

| パーサー | ファイル | 方式 |
|---|---|---|
| Python | [python_parser.py](https://github.com/elvezjp/code2map/blob/v0.3.0/code2map/parsers/python_parser.py) | Python標準の`ast`モジュールで解析。クラス、メソッド、トップレベル関数を抽出 |
| Java | [java_parser.py](https://github.com/elvezjp/code2map/blob/v0.3.0/code2map/parsers/java_parser.py) | `javalang`ライブラリで解析。クラス、インターフェース、メソッド、コンストラクタを抽出 |

各シンボルには `CD1`, `CD2`, ... のIDが付与されます。ネストされた関数は親に含められます。

---

## 3. 構造マッチング

バックエンドのAPIは [backend/app/routers/](../backend/app/routers/) に実装されています。

### エンドポイント: `POST /api/review/structure-matching`

**ファイル**: [review.py](../backend/app/routers/review.py)

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

フロントエンドの実装は [frontend/src/features/reviewer/](../frontend/src/features/reviewer/) にまとまっています。

### Reviewer コンポーネント（画面全体の制御）

**ファイル**: [index.tsx](../frontend/src/features/reviewer/index.tsx)

メイン画面・実行中画面・結果画面の 3 画面を切り替えながら、変換 → 分割プレビュー → マッピングの一連の流れを制御します。分割プレビュー結果や LLM 設定などの状態は、このコンポーネントが各フックから受け取り、子コンポーネントへ props で渡します。

| 機能 | 説明 |
|---|---|
| 分割プレビュー実行 | 変換済みの設計書 Markdown とコードを `useSplitSettings` の `executeSplitPreview` に渡し、md2map / code2map による分割結果（parts / INDEX / MAP）を取得 |
| マッピング実行 | 分割プレビュー結果から設計書の `INDEX.md` + `MAP.json` と、コードファイルごとの INDEX + シンボル一覧を組み立て、システムプロンプト・LLM 設定とともに `executeStructureMatching`（`POST /api/review/structure-matching`）を呼び出し。分割プレビューが未実行の場合は実行せずエラーを表示 |
| 結果の保持 | 返却された `MatchedGroup[]` と実行メタ情報（モデル、トークン数、マッピング方式、グループ数など）を保持し、結果画面に切り替え |

### 分割設定

**ファイル**: [SplitSettingsSection.tsx](../frontend/src/features/reviewer/components/SplitSettingsSection.tsx)

| 設定項目 | 説明 |
|---|---|
| 分割モード | 設計書の分割方法。見出し / NLP / AI（推奨）から選択（[分割モード](#分割モード)を参照） |
| 見出しレベル | 設計書をどの見出しレベルまで分割するか。H2 まで（推奨）/ H3 まで / H4 まで |
| プログラム | 設定項目なし。code2map によりクラスや関数などの単位で分割。対応言語（Python / Java）以外のファイルは未対応ファイルとして表示 |
| 分割プレビュー実行 | 上記の設定で分割を実行し、設計書セクションとコードシンボルの一覧をプレビュー表示。マッピング実行の前提となる |

### マッピング方式の選択

**ファイル**: [MappingPolicySection.tsx](../frontend/src/features/reviewer/components/MappingPolicySection.tsx)

標準 (LLM) / 厳密 (ID重視) / 詳細 (内容参照) の 3 方式から選択します。方式の定義は [mappingPresetCatalog.ts](../frontend/src/core/data/mappingPresetCatalog.ts) にあり、選択に応じてシステムプロンプトが切り替わります（[マッピング方式](#マッピング方式)を参照）。

### 結果画面

**ファイル**: [MappingResult.tsx](../frontend/src/features/reviewer/components/MappingResult.tsx) / [MappingResultTable.tsx](../frontend/src/features/reviewer/components/MappingResultTable.tsx)

| 機能 | 説明 |
|---|---|
| 結果テーブル | グループ数・設計書セクション数・コードシンボル数のサマリーと、項番・グループ名・設計書セクション・コードシンボル・理由の一覧を表示 |
| CSV ダウンロード | マッピング結果一覧を CSV としてダウンロード |
| マッピング結果レポート | Markdown 形式のレポート（セクション形式 + テーブル形式）を表示。クリップボードへのコピーと `mapping-result-report.md` としてのダウンロードが可能 |
| 実行情報 | バージョン、モデルID、実行日時、トークン数、入力ファイル（設計書・プログラム）を表示（[ExecutionInfo.tsx](../frontend/src/features/reviewer/components/ExecutionInfo.tsx)） |
| 一式ダウンロード（ZIP） | システムプロンプト、変換後の設計書、行番号付きプログラム、結果レポート、CSV などマッピング実行の入出力データ一式をダウンロード |

実行中は [MappingExecutingScreen.tsx](../frontend/src/features/reviewer/components/MappingExecutingScreen.tsx) が表示されます。

### 関連するフック・サービス

| ファイル | 役割 |
|---|---|
| [useFileConversion.ts](../frontend/src/features/reviewer/hooks/useFileConversion.ts) | 設計書（Excel → Markdown）とプログラム（行番号付与）の変換、ファイル一覧の状態管理 |
| [useSplitSettings.ts](../frontend/src/features/reviewer/hooks/useSplitSettings.ts) | 分割設定の状態管理、分割プレビュー API（`splitMarkdown` / `splitCode`）の呼び出し |
| [useReviewerSettings.ts](../frontend/src/features/reviewer/hooks/useReviewerSettings.ts) | LLM 設定、システムプロンプト管理、マッピング方式の適用 |
| [useZipExport.ts](../frontend/src/features/reviewer/hooks/useZipExport.ts) | 結果レポートの生成（`buildMappingResultReport`）、CSV / ZIP のダウンロード |
| [api.ts](../frontend/src/features/reviewer/services/api.ts) | 各 API エンドポイントへのリクエスト（`executeStructureMatching` を含む） |

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
