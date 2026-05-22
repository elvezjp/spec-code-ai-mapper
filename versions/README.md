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
