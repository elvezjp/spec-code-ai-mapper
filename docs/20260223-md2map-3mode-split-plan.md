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

## 影響ファイル一覧

| # | ファイル | 変更内容 |
|---|---------|---------|
| 1 | `versions/v0.1.0/backend/app/models/schemas.py` | `SplitMarkdownRequest` に `splitMode`, `llmConfig` 追加 |
| 2 | `versions/v0.1.0/backend/app/routers/split.py` | `LLMConfig` import追加、LLMConfig変換関数追加、MarkdownParser呼び出し修正 |
| 3 | `versions/v0.1.0/frontend/src/features/reviewer/types/index.ts` | `DocumentSplitMode` 型追加、`SplitSettings`・`SplitMarkdownRequest` 拡張 |
| 4 | `versions/v0.1.0/frontend/src/features/reviewer/hooks/useSplitSettings.ts` | デフォルト設定追加、executePreview引数拡張、API呼び出し修正、クリア条件追加 |
| 5 | `versions/v0.1.0/frontend/src/features/reviewer/components/SplitSettingsSection.tsx` | 分割モード選択UI追加、注意文追加 |
| 6 | `versions/v0.1.0/frontend/src/features/reviewer/index.tsx` | `llmConfig` の引き回し |

## 変更不要なファイル

| ファイル | 理由 |
|---------|------|
| `versions/v0.1.0/frontend/src/features/reviewer/services/api.ts` | `SplitMarkdownRequest` の型変更に自動追従。関数本体の修正不要 |

## 既存パターンの再利用

| 再利用対象 | ファイル | 用途 |
|-----------|---------|------|
| `schemas.LLMConfig` | `backend/app/models/schemas.py` L45-69 | 構造マッチングAPIで使用中、分割APIでも同一クラスを使用 |
| `LlmConfig` (TS型) | `frontend/.../types/index.ts` L31-39 | 構造マッチングで使用中、分割APIリクエストでも同一型を使用 |
| `md2map.llm.config.LLMConfig` | `md2map/md2map/llm/config.py` | md2map側のLLM設定データクラス |
| `build_llm_config_from_env()` | `md2map/md2map/llm/factory.py` | システムLLMフォールバック用 |
| `MarkdownParser(split_mode=, llm_config=)` | `md2map/md2map/parsers/markdown_parser.py` | 既存コンストラクタパラメータ |

## AIレビュアー版との差分

AIレビュアー（spec-code-ai-reviewer）の計画書とほぼ同一だが、以下の点が異なる。

| 項目 | AIレビュアー | AIマッパー |
|------|-------------|-----------|
| バージョンパス | `versions/v0.8.2/` | `versions/v0.1.0/` |
| `SplitSettings` の既存フィールド | `reviewMode`, `documentMaxDepth`, `documentSplitMode` | `documentMaxDepth`, `mappingPolicy`, `documentSplitMode`（追加） |
| `SplitSettingsSection` の既存UI | レビュー方式（一括/分割）ラジオボタンあり | 一括/分割選択なし（常に分割モード） |
| `index.tsx` の `handleSplitPreviewExecute` | `executeSplitPreview` に `llmConfig` を渡す | 同様（引数追加） |

## 検証方法

1. バックエンドテスト: `pytest` で既存テスト通過確認
2. フロントエンドテスト: `vitest` で既存テスト通過確認
3. 手動確認:
   - 分割設定で AI / 見出し / NLP モードを切替え可能
   - 見出しモードで分割プレビュー実行 → 従来通り動作
   - AIモード選択時、LLM設定が分割APIに渡される
   - NLPモード選択時、sudachipy で分割される
   - 分割モード変更時にプレビュー結果がクリアされる
