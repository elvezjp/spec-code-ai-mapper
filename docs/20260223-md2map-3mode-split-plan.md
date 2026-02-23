# md2map 3モード分割対応 修正計画

- 作成日: 2026-02-23
- 対象バージョン: v0.1.0
- 関連: md2map AI モード マルチプロバイダー対応（md2map/docs/20260218ai-mode-multi-provider-plan.md 付録A）
- 参考: spec-code-ai-reviewer 側計画書（spec-code-ai-reviewer/docs/20260223-md2map-3mode-split-plan.md）

## 背景

md2map ライブラリは3つの分割モードを持つ（heading / nlp / ai）。
現在、AIマッパーは heading モードのみで `MarkdownParser()` を引数なしで呼び出している。
本修正により、フロントエンドから分割モードを選択し、AIモード時にはLLM設定を md2map に渡せるようにする。

## ゴール

1. 分割APIで3モード（heading / nlp / ai）に対応する
2. フロントエンドの「分割設定」に分割モード選択UIを追加する
3. AIモード時、フロントエンドのLLM設定を md2map に渡す

## 非ゴール

- code2map の分割モード追加（code2map は現状1モードのみ）
- md2map 上流リポジトリへの変更

## 現状整理

### バックエンド（split.py）

```python
# 現在の呼び出し（headingモード固定）
parser = MarkdownParser()
sections, warnings = parser.parse(input_path, request.maxDepth)
```

### md2map の MarkdownParser

```python
def __init__(
    self,
    split_mode: str = "heading",      # "heading", "nlp", "ai"
    split_threshold: int = 500,
    max_subsections: int = 5,
    llm_config: Optional["LLMConfig"] = None,
    llm_provider: Optional["BaseLLMProvider"] = None,
) -> None
```

### フロントエンド（SplitSettingsSection.tsx）

- 分割オプション > 設計書: 見出しレベル（H2/H3/H4）のラジオボタン
- 分割モード選択は未実装

## 実装ステップ

### Step 1: バックエンド - スキーマ拡張

**対象**: `versions/v0.1.0/backend/app/models/schemas.py`

`SplitMarkdownRequest` に以下フィールドを追加:

```python
class SplitMarkdownRequest(BaseModel):
    """Markdown分割APIのリクエスト"""

    content: str
    filename: str
    maxDepth: int = Field(default=2, ge=1, le=6)
    splitMode: Literal["ai", "heading", "nlp"] = "ai"  # 追加
    llmConfig: LLMConfig | None = None                  # 追加（AIモード用）
```

`LLMConfig` クラスは同ファイル内に既存（L45-69）。そのまま再利用する。

### Step 2: バックエンド - split.py の修正

**対象**: `versions/v0.1.0/backend/app/routers/split.py`

LLMConfig 変換ヘルパー関数を追加し、MarkdownParser 呼び出しを修正する。

```python
def _convert_to_md2map_llm_config(llm_config: LLMConfig | None):
    """バックエンドの LLMConfig を md2map の LLMConfig に変換する"""
    from md2map.llm.config import LLMConfig as Md2mapLLMConfig

    if llm_config is None:
        # システムLLM（環境変数）を使用
        from md2map.llm.factory import build_llm_config_from_env
        return build_llm_config_from_env()

    return Md2mapLLMConfig(
        provider=llm_config.provider,
        model=llm_config.model,
        api_key=llm_config.apiKey,
        access_key_id=llm_config.accessKeyId,
        secret_access_key=llm_config.secretAccessKey,
        region=llm_config.region,
        max_tokens=800,  # md2map の分割用途では固定
    )
```

MarkdownParser 呼び出しの変更:

```python
# AIモードの場合のみ LLMConfig を変換
md2map_llm_config = None
if request.splitMode == "ai":
    md2map_llm_config = _convert_to_md2map_llm_config(request.llmConfig)

parser = MarkdownParser(
    split_mode=request.splitMode,
    llm_config=md2map_llm_config,
)
```

import に `LLMConfig` を追加:

```python
from app.models.schemas import (
    SplitMarkdownRequest,
    SplitMarkdownResponse,
    SplitCodeRequest,
    SplitCodeResponse,
    DocumentPart,
    CodePart,
    LLMConfig,  # 追加
)
```

### Step 3: フロントエンド - 型定義の拡張

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/types/index.ts`

```typescript
// 分割モード型を追加
export type DocumentSplitMode = 'ai' | 'heading' | 'nlp'

// SplitSettings に documentSplitMode を追加
export interface SplitSettings {
  documentMaxDepth: number
  documentSplitMode: DocumentSplitMode  // 追加
  mappingPolicy: string
}

// SplitMarkdownRequest に splitMode と llmConfig を追加
export interface SplitMarkdownRequest {
  content: string
  filename: string
  maxDepth: number
  splitMode?: DocumentSplitMode  // 追加
  llmConfig?: LlmConfig          // 追加
}
```

`LlmConfig` 型は同ファイル内に既存（L31-39）。そのまま再利用する。

### Step 4: フロントエンド - useSplitSettings フック修正

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/hooks/useSplitSettings.ts`

4箇所を修正:

**4-1. DEFAULT_SETTINGS に `documentSplitMode` を追加:**

```typescript
const DEFAULT_SETTINGS: SplitSettings = {
  documentMaxDepth: 2,
  documentSplitMode: 'ai',  // 追加
  mappingPolicy: 'standard',
}
```

**4-2. executePreview の引数に `llmConfig` を追加:**

```typescript
executePreview: (
  designMarkdown: string | null,
  designFilename: string,
  codeFiles: Array<{ filename: string; content: string }>,
  llmConfig?: LlmConfig  // 追加
) => Promise<void>
```

**4-3. api.splitMarkdown 呼び出しに `splitMode` と `llmConfig` を渡す:**

```typescript
const response = await api.splitMarkdown({
  content: designMarkdown,
  filename: designFilename,
  maxDepth: settings.documentMaxDepth,
  splitMode: settings.documentSplitMode,
  llmConfig: settings.documentSplitMode === 'ai' ? llmConfig : undefined,
})
```

**4-4. プレビュークリア条件に `documentSplitMode` を追加:**

```typescript
const handleSetSettings = useCallback((newSettings: SplitSettings) => {
  setSettings(prev => {
    if (prev.documentMaxDepth !== newSettings.documentMaxDepth ||
        prev.documentSplitMode !== newSettings.documentSplitMode) {  // 追加
      setPreviewResult(null)
      setError(null)
    }
    return newSettings
  })
}, [])
```

**4-5. useCallback の依存配列に `documentSplitMode` を追加:**

```typescript
}, [settings.documentMaxDepth, settings.documentSplitMode])
```

### Step 5: フロントエンド - SplitSettingsSection UI修正

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/components/SplitSettingsSection.tsx`

「分割オプション > 設計書」セクションに分割モード選択を追加（見出しレベルの上に配置）。
ラジオボタンを縦に並べ、右側に簡単な説明を付ける:

```
設計書
  分割モード:
    ◉ AI（推奨）    AIが文脈を考慮して最適な分割を行います
    ○ 見出し        見出し（H2/H3等）の区切りで機械的に分割します
    ○ NLP          自然言語処理で文章の意味的な区切りを検出します
    ※AIモードでは、設計書が大きい場合は、処理に時間が掛かったり、
      タイムアウトや制限等でエラーになる可能性があります。

  見出しレベル:
    ○ H2(##)まで（推奨）  ○ H3(###)まで  ○ H4(####)まで
```

- デフォルト: AI
- 注意文は分割モード選択の下に常時表示

### Step 6: フロントエンド - index.tsx の接続

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/index.tsx`

`handleSplitPreviewExecute` で `llmConfig` を `executeSplitPreview` に渡す:

```typescript
const handleSplitPreviewExecute = useCallback(async () => {
  const codeFilesForSplit = await Promise.all(
    codeFiles.map(async (cf) => ({
      filename: cf.filename,
      content: await cf.file.text(),
    }))
  )

  await executeSplitPreview(
    specMarkdown,
    specFiles.find(f => f.isMain)?.filename || 'design.md',
    codeFilesForSplit,
    llmConfig || undefined  // 追加
  )
}, [codeFiles, specMarkdown, specFiles, executeSplitPreview, llmConfig])
```

### Step 7: バックエンド - MAP.json生成とレスポンス拡張

**目的**: 構造マッチングに渡す MAP.json を、md2map が生成した内容をそのまま渡す

**現状の問題**:
- バックエンドの split.py は MAP.json を生成していない
- フロントエンドの index.tsx が `documentParts` から手動で `documentMapJson` を構築している（L194-204）
- そのため `is_subsplit`, `subsplit_title`, `note` 等の情報が構造マッチングに渡されない

**対象**: `versions/v0.1.0/backend/app/routers/split.py`, `versions/v0.1.0/backend/app/models/schemas.py`

1. split.py で md2map の `generate_map()` を呼び出し MAP.json を生成・読み取る
2. `SplitMarkdownResponse` に `mapJson` フィールドを追加（md2map生成のMAP.jsonをそのまま返す）

```python
# split.py に追加
from md2map.generators.map_generator import generate_map as md2map_generate_map

# MAP.json生成
map_path = os.path.join(out_dir, "MAP.json")
md2map_generate_map(sections, out_dir, map_path)

# MAP.json読み取り
with open(map_path, "r", encoding="utf-8") as f:
    import json
    map_json = json.load(f)
```

```python
# schemas.py
class SplitMarkdownResponse(BaseModel):
    """Markdown分割APIのレスポンス"""

    success: bool
    parts: list[DocumentPart] = []
    indexContent: str | None = None
    mapJson: list[dict] | None = None  # 追加: md2map生成のMAP.json
    error: str | None = None
```

### Step 8: フロントエンド - MAP.json をそのまま構造マッチングに渡す

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/types/index.ts`, `versions/v0.1.0/frontend/src/features/reviewer/hooks/useSplitSettings.ts`, `versions/v0.1.0/frontend/src/features/reviewer/index.tsx`

1. `SplitMarkdownResponse` に `mapJson` を追加
2. `SplitPreviewResult` に `documentMapJson` を追加
3. `useSplitSettings.ts` でレスポンスから `mapJson` を `documentMapJson` として保持
4. index.tsx の `handleMapping` で、手動構築の `documentMapJson` の代わりにバックエンドから返された `mapJson` を使用

```typescript
// 現在（手動構築）— index.tsx L194-204
const documentMapJson = {
  sections: splitPreviewResult.documentParts?.map((p) => ({
    id: p.id, title: p.section, level: p.level, path: p.path,
    startLine: p.startLine, endLine: p.endLine,
  })) || [],
}

// 修正後（md2map生成のMAP.jsonをそのまま使用）
const documentMapJson = {
  sections: splitPreviewResult.documentMapJson || [],
}
```

### Step 9: 表示名の改善（displayName の追加）

**目的**: subsplit されたセクションの表示名を正しく表示する

**方針**: バックエンド側で `DocumentPart` に `displayName` フィールドを追加し、
md2map の `section.display_name()` を使用する。
フロントエンドでは `section` の代わりに `displayName` を表示に使う。

**対象**: バックエンド `schemas.py`, `split.py` / フロントエンド `types/index.ts`, 表示箇所

1. バックエンド: `DocumentPart` に `displayName` を追加

```python
class DocumentPart(BaseModel):
    """分割された設計書パーツ"""

    id: str
    section: str          # 元のセクション名（title）
    displayName: str      # 表示用名称（subsplit時はsubsplit_title）
    level: int
    path: str
    startLine: int
    endLine: int
    content: str
    estimatedTokens: int
```

```python
# split.py での設定
DocumentPart(
    ...,
    section=section.title,
    displayName=section.display_name(),  # md2mapの既存メソッドを使用
    ...,
)
```

2. フロントエンド: `DocumentPart` 型に `displayName` を追加

```typescript
export interface DocumentPart {
  id: string
  section: string
  displayName: string   // 追加
  level: number
  path: string
  startLine: number
  endLine: number
  content: string
  estimatedTokens: number
}
```

3. 表示箇所で `section` の代わりに `displayName` を使用:
   - `SplitSettingsSection.tsx` のプレビューテーブル（DocumentPartsTable）
   - `index.tsx` の構造マッチング結果構築時
   - マッピング結果レポート・CSVでのセクション名表示

### Step 10: コード分割側の MAP.json 対応 + ZIPダウンロードに INDEX.md / MAP.json を同梱

#### Step 10a: バックエンド - コード分割側の MAP.json 生成

**目的**: code2map が生成した MAP.json もフロントエンドに返す

**現状**:
- `split_code()` は code2map の `generate_parts` を呼ぶが MAP.json は生成していない
- code2map の `generate_map()` は呼ばれていない

**対象**: `versions/v0.1.0/backend/app/models/schemas.py`, `versions/v0.1.0/backend/app/routers/split.py`

1. `SplitCodeResponse` に `mapJson` フィールドを追加:

```python
class SplitCodeResponse(BaseModel):
    """コード分割APIのレスポンス"""

    success: bool
    parts: list[CodePart] = []
    indexContent: str | None = None
    mapJson: list[dict] | None = None  # 追加: code2map生成のMAP.json
    language: str | None = None
    error: str | None = None
```

2. `split_code()` で `generate_map` を呼び出し:

```python
from code2map.generators.map_generator import generate_map as code2map_generate_map

# generate_parts の戻り値を保持
fragments = code2map_generate_parts(symbols, c2m_lines, out_dir)

# MAP.json生成・読み取り
map_path = os.path.join(out_dir, "MAP.json")
code2map_generate_map(fragments, map_path)
with open(map_path, "r", encoding="utf-8") as f:
    map_json = json.load(f)
```

#### Step 10b: フロントエンド - コード側 MAP.json の保持

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/types/index.ts`, `versions/v0.1.0/frontend/src/features/reviewer/hooks/useSplitSettings.ts`

1. `SplitCodeResponse` に `mapJson` を追加
2. `SplitPreviewResult` に `codeMapJson` を追加
3. `useSplitSettings.ts` で code split レスポンスから `mapJson` を収集・保持

#### Step 10c: ZIPダウンロードに INDEX.md / MAP.json を同梱

**目的**: マッピング実行時のZIP一括ダウンロードに、md2map/code2map が生成した INDEX.md と MAP.json を含める

**現状のZIP構成**（`useZipExport.ts`）:
- `README.md`, `system-prompt.md`, `spec-markdown.md`, `code-numbered.txt`, `mapping-result-report.md`, `mapping-result.csv` の6ファイル

**方針**: `downloadMappingZip` の引数（`MappingZipData`）を拡張し、分割データをZIPに同梱する

**対象**: `versions/v0.1.0/frontend/src/features/reviewer/hooks/useZipExport.ts`, `versions/v0.1.0/frontend/src/features/reviewer/index.tsx`

1. `MappingZipData` に分割データフィールドを追加:

```typescript
interface MappingZipData {
  mappingResult: MatchedGroup[]
  executionMeta: MappingExecutionMeta
  reportText: string
  systemPrompt: SystemPromptValues
  specMarkdown: string
  codeWithLineNumbers: string
  codeLineMap: CodeLineMap
  // 追加: 分割データ
  splitData?: {
    documentIndex?: string
    documentMapJson?: Record<string, unknown>[]
    codeIndex?: string
    codeMapJson?: Record<string, unknown>[]
  }
}
```

2. `downloadMappingZip` で分割データをZIPに追加:

```typescript
// 分割データの追加ファイル
if (data.splitData) {
  if (data.splitData.documentIndex) {
    zip.file('split/spec-INDEX.md', data.splitData.documentIndex)
  }
  if (data.splitData.documentMapJson) {
    zip.file('split/spec-MAP.json', JSON.stringify(data.splitData.documentMapJson, null, 2))
  }
  if (data.splitData.codeIndex) {
    zip.file('split/code-INDEX.md', data.splitData.codeIndex)
  }
  if (data.splitData.codeMapJson) {
    zip.file('split/code-MAP.json', JSON.stringify(data.splitData.codeMapJson, null, 2))
  }
}
```

3. `buildReadme` の同梱ファイルテーブルに分割ファイルを追加:

```
| split/spec-INDEX.md | 設計書の構造情報（md2map生成） |
| split/spec-MAP.json | 設計書のセクションマップ（md2map生成） |
| split/code-INDEX.md | プログラムの構造情報（code2map生成） |
| split/code-MAP.json | プログラムのシンボルマップ（code2map生成） |
```

4. index.tsx の `handleDownloadZip` で `splitPreviewResult` から分割データを渡す:

```typescript
downloadMappingZip({
  ...existingData,
  splitData: splitPreviewResult ? {
    documentIndex: splitPreviewResult.documentIndex || undefined,
    documentMapJson: splitPreviewResult.documentMapJson || undefined,
    codeIndex: splitPreviewResult.codeIndex || undefined,
    codeMapJson: splitPreviewResult.codeMapJson || undefined,
  } : undefined,
})
```

## 影響ファイル一覧

| # | ファイル | 変更内容 |
|---|---------|---------|
| 1 | `versions/v0.1.0/backend/app/models/schemas.py` | `SplitMarkdownRequest` に `splitMode`, `llmConfig` 追加。`SplitMarkdownResponse` に `mapJson` 追加。`DocumentPart` に `displayName` 追加。`SplitCodeResponse` に `mapJson` 追加 |
| 2 | `versions/v0.1.0/backend/app/routers/split.py` | `LLMConfig` import追加、LLMConfig変換関数追加、MarkdownParser呼び出し修正、MAP.json生成・返却、displayName設定、code2map MAP.json生成・返却 |
| 3 | `versions/v0.1.0/frontend/src/features/reviewer/types/index.ts` | `DocumentSplitMode` 型追加、`SplitSettings`・`SplitMarkdownRequest` 拡張、`SplitMarkdownResponse` に `mapJson` 追加、`DocumentPart` に `displayName` 追加、`SplitPreviewResult` に `documentMapJson`・`codeMapJson` 追加、`SplitCodeResponse` に `mapJson` 追加 |
| 4 | `versions/v0.1.0/frontend/src/features/reviewer/hooks/useSplitSettings.ts` | デフォルト設定追加、executePreview引数拡張、API呼び出し修正、クリア条件追加、`documentMapJson`・`codeMapJson` の保持 |
| 5 | `versions/v0.1.0/frontend/src/features/reviewer/components/SplitSettingsSection.tsx` | 分割モード選択UI追加、注意文追加、プレビューテーブルで `displayName` 使用 |
| 6 | `versions/v0.1.0/frontend/src/features/reviewer/index.tsx` | `llmConfig` の引き回し、構造マッチングでバックエンド生成 `mapJson` を使用、表示名に `displayName` を使用、ZIPダウンロードに分割データ渡し |
| 7 | `versions/v0.1.0/frontend/src/features/reviewer/hooks/useZipExport.ts` | `MappingZipData` に `splitData` 追加、ZIP内に `split/` ディレクトリ追加、README同梱ファイルテーブル拡張 |

## 変更不要なファイル

| ファイル | 理由 |
|---------|------|
| `versions/v0.1.0/frontend/src/features/reviewer/services/api.ts` | `SplitMarkdownRequest`・`SplitMarkdownResponse`・`SplitCodeResponse` の型変更に自動追従。関数本体の修正不要 |

## 既存パターンの再利用

| 再利用対象 | ファイル | 用途 |
|-----------|---------|------|
| `schemas.LLMConfig` | `backend/app/models/schemas.py` L45-69 | 構造マッチングAPIで使用中、分割APIでも同一クラスを使用 |
| `LlmConfig` (TS型) | `frontend/.../types/index.ts` L31-39 | 構造マッチングで使用中、分割APIリクエストでも同一型を使用 |
| `md2map.llm.config.LLMConfig` | `md2map/md2map/llm/config.py` | md2map側のLLM設定データクラス |
| `build_llm_config_from_env()` | `md2map/md2map/llm/factory.py` | システムLLMフォールバック用 |
| `MarkdownParser(split_mode=, llm_config=)` | `md2map/md2map/parsers/markdown_parser.py` | 既存コンストラクタパラメータ |
| `md2map.generators.map_generator.generate_map()` | `md2map/md2map/generators/map_generator.py` | MAP.json生成 |
| `code2map.generators.map_generator.generate_map()` | `code2map/code2map/generators/map_generator.py` | コード側MAP.json生成 |
| `section.display_name()` | `md2map/md2map/models/section.py` | subsplit時の表示名取得 |

## AIレビュアー版との差分

AIレビュアー（spec-code-ai-reviewer）の計画書とほぼ同一だが、以下の点が異なる。

| 項目 | AIレビュアー | AIマッパー |
|------|-------------|-----------|
| バージョンパス | `versions/v0.8.2/` | `versions/v0.1.0/` |
| `SplitSettings` の既存フィールド | `reviewMode`, `documentMaxDepth`, `documentSplitMode` | `documentMaxDepth`, `mappingPolicy`, `documentSplitMode`（追加） |
| `SplitSettingsSection` の既存UI | レビュー方式（一括/分割）ラジオボタンあり | 一括/分割選択なし（常に分割モード） |
| `index.tsx` の `handleSplitPreviewExecute` | `executeSplitPreview` に `llmConfig` を渡す | 同様（引数追加） |
| `index.tsx` のMAP.json手動構築 | `executeSplitReviewFlow` 内で構築 | `handleMapping` 内で構築（L194-204） |
| ZIPダウンロード | `downloadZip` に `SplitExportData` 引数追加 | `MappingZipData` に `splitData` フィールド追加 |
| ZIPダウンロード呼び出し | `index.tsx` の分割レビュー結果画面 | `handleDownloadZip` コールバック（L294-305） |
| ZIP既存ファイル構成 | 5ファイル（system-prompt, spec, code, review-result, README） | 6ファイル（+ mapping-result.csv） |
| README生成 | `markdown.ts` の `generateReadmeMarkdown` | `useZipExport.ts` の `buildReadme` |

## 検証方法

1. バックエンドテスト: `pytest` で既存テスト通過確認
2. フロントエンドテスト: `vitest` で既存テスト通過確認
3. 手動確認:
   - 分割設定で AI / 見出し / NLP モードを切替え可能
   - 見出しモードで分割プレビュー実行 → 従来通り動作
   - AIモード選択時、LLM設定が分割APIに渡される
   - NLPモード選択時、sudachipy で分割される
   - 分割モード変更時にプレビュー結果がクリアされる
   - AIモードで subsplit が発生した場合、プレビューテーブルで subsplit_title（例: "概要: part-1"）が表示される
   - 構造マッチングに渡される MAP.json に is_subsplit, subsplit_title が含まれる
   - マッピング完了後、ZIP一括ダウンロードに `split/spec-INDEX.md`, `split/spec-MAP.json`, `split/code-INDEX.md`, `split/code-MAP.json` が含まれる
