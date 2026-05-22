# versions ディレクトリについて

## 概要

このディレクトリには、`spec-code-ai-mapper` の各バージョンのスナップショットを保存します。

## ディレクトリ構成

```
versions/
├── v0.1.0/    # 初版 (AI Mapper)
├── v0.1.1/    # excel2md v2.1.1 取り込み
├── v0.1.2/    # Python 3.11 へ引き上げ、idna 3.16 取り込み（最新）
└── README.md  # このファイル
```

## バージョン更新時に修正が必要なファイル

新しいバージョン（`versions/vX.Y.Z/`）を切る際は、以下のファイルを更新する。
記載順は実作業に沿っており、上から順に進めることを推奨する。

### 1. 新バージョンディレクトリの作成

- `versions/vX.Y.Z/` を直前バージョンからコピー（`node_modules` などは除外）

### 2. バージョン番号・依存定義の更新（新バージョン配下）

- `versions/vX.Y.Z/backend/pyproject.toml`
  - `version`（必須）
  - `requires-python`（Python 最小要件を変更する場合のみ）
- `versions/vX.Y.Z/backend/uv.lock`（`uv lock` で再生成）
- `versions/vX.Y.Z/frontend/package.json` — `version`
- `versions/vX.Y.Z/frontend/package-lock.json` — トップレベル `name` 直下の `version` と `packages.""` の `version`

### 3. 新バージョン配下のコード・仕様書

- `versions/vX.Y.Z/spec.md` — ヘッダのバージョン、各種サンプル（レビュー情報、ヘルスチェック応答、UI モック、E2E試験項目、ディレクトリ構成、技術スタック表）
- `versions/vX.Y.Z/config-file-generator-spec.md` — ヘッダおよび本文中のバージョン
- `versions/vX.Y.Z/frontend/src/core/hooks/useVersions.ts` — `DEFAULT_VERSIONS`
- `versions/vX.Y.Z/frontend/src/features/reviewer/index.tsx` — `APP_INFO.version`
- `versions/vX.Y.Z/frontend/src/features/config-file-generator/schema/configSchema.ts` — `meta.version` と固定値フィールド
- `versions/vX.Y.Z/backend/app/markdown_tools/excel2md_tool.py` — パス構造を説明するコメント

### 4. ルート配下のドキュメント・CI

- `versions/README.md`（本ファイル） — ディレクトリ構成ツリー、更新履歴セクション
- `README.md` / `README_ja.md` — Python バッジ、前提条件、Quick Start のパス、ディレクトリツリー
- `CONTRIBUTING.md` / `CONTRIBUTING_ja.md` — 開発手順内のパス、Python 前提条件
- `SECURITY.md` / `SECURITY_ja.md` — サポートバージョン表
- `CHANGELOG.md` / `CHANGELOG_ja.md` — 新バージョンのセクションと比較表
- `.github/workflows/ci.yml` — `working-directory` と `python-version` matrix（Python 最小要件を変更した場合のみ）

### 5. 仕上げ

- `versions/vX.Y.Z/backend` で `uv run pytest` が pass すること
- `versions/vX.Y.Z/frontend` で `npm run test:run` が pass すること
- リポジトリ全体に旧バージョン参照が残っていないかを `grep` などで確認

## 更新履歴

### v0.1.2 (2026-05-22)

- **Python 最小要件を 3.10 → 3.11 に引き上げ**: 依存先（`add-line-numbers` / `md2map` / `code2map`）の最新 main が Python >=3.11 を要求するため。
- **`idna` を 3.14 → 3.16 に更新**: Dependabot アラート [#66](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/66)（GHSA-65pc-fj4g-8rjx）を解消。
- `versions/v0.1.1/` は凍結スナップショットとして保持。

### v0.1.1 (2026-05-11)

- **excel2md subtree を v2.0 → v2.1.1 に更新**: 脚注番号の重複・`extract_table()` 打ち切りパスの tuple アリティ不整合・`is_code_block` / `build_code_block_from_rows` の v1.x 互換 re-export 復元など、複数の不具合修正を取り込み。
- `versions/v0.1.0/` は凍結スナップショットとして保持。

### v0.1.0 (2026-02-13)

- **初版リリース**: [spec-code-ai-reviewer](https://github.com/elvezjp/spec-code-ai-reviewer) をベースに、設計書-コード間のトレーサビリティ管理に特化したツールとして新規作成。
- **トレーサビリティ・マトリクス生成**: 設計書セクションとコードシンボルのAIマッピング機能。
- **構造マッチング**: md2map/code2mapによるセマンティック分割と構造ベースのマッチング。
- **3つのマッピング方式**: 標準（LLM）、厳密（ID重視）、詳細（内容参照）。
- **結果エクスポート**: Markdown形式でのトレーサビリティ・マトリクス出力。
