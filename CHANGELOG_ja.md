# 変更履歴

[English](./CHANGELOG.md) | [日本語](./CHANGELOG_ja.md)

このプロジェクトに対するすべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [セマンティックバージョニング](https://semver.org/lang/ja/) に準拠しています。

## [0.1.1] - 2026-05-11

### 変更
- **excel2md subtree を v2.0 → v2.1.1 に更新**
  - upstream: [elvezjp/excel2md PR #31](https://github.com/elvezjp/excel2md/pull/31)
  - `versions/v0.1.1/backend/app/markdown_tools/excel2md_tool.py` の `_DEFAULT_EXCEL2MD_PATH` を `excel2md/v2.1.1` に切り替え
  - 取り込まれる upstream の主な修正:
    - 複数テーブル間で脚注番号が重複する不具合の修正（excel2md issue #25）
    - `extract_table()` 打ち切りパスの tuple アリティ不整合の修正（excel2md issue #24）
    - `is_code_block` / `build_code_block_from_rows` の v1.x 互換 re-export を復元（excel2md issue #15）
    - `footnote_scope=sheet` × 非 `--split-by-sheet` 時に sheet スコープ脚注定義が出力されない不具合の修正
    - `mermaid_generator.py` の `is_code_block` import 漏れ修正（v2.0.1, excel2md issue #13）
    - 最低 Python バージョンを 3.10 に引き上げ、pytest / Pygments のセキュリティ更新（v2.1.0）

### ドキュメント

- リポジトリルートの OSS 公開用文書を日英バイリンガル化: `README_ja.md`、`CHANGELOG_ja.md`、`CONTRIBUTING_ja.md`、`SECURITY_ja.md` を追加し、英語版の更新と相互リンクを整理（[PR #12](https://github.com/elvezjp/spec-code-ai-mapper/pull/12)）。

### 互換性
- `versions/v0.1.0/` は凍結スナップショットとして保持し、v0.1.1 はそのコピーをベースに修正。

## [0.1.0] - 2026-02-13

[spec-code-ai-reviewer](https://github.com/elvezjp/spec-code-ai-reviewer) をベースに、設計書-コード間のトレーサビリティ管理に特化したツールとして新規作成。

### 追加
- **トレーサビリティ・マトリクス生成**: 設計書セクションとコードシンボルの紐付けをAIで自動マッピングし、一覧表示
- **構造マッチング**: md2map/code2mapを使用したセマンティック分割と構造ベースのマッチング
- **3つのマッピング方式**: 標準（LLM）、厳密（ID重視）、詳細（内容参照）の選択式
- **結果エクスポート**: Markdown形式でのトレーサビリティ・マトリクス出力
- **設計書・コード変換**: Excel→Markdown変換（MarkItDown/excel2md）、コード→行番号付与（add-line-numbers）
- **セマンティック分割**: 大規模ファイルを意味のある単位に分割してAIが処理可能なサイズで精密マッピング
- **マルチLLMプロバイダー対応**: Bedrock / Anthropic / OpenAI を切り替えて実行可能
- **フロントエンド**: Vite + React + TypeScript + Tailwind CSS によるモダンSPA

---

## リンク

- [リポジトリ](https://github.com/elvezjp/spec-code-ai-mapper)
- [Issue](https://github.com/elvezjp/spec-code-ai-mapper/issues)
- [ベースプロジェクト](https://github.com/elvezjp/spec-code-ai-reviewer)

## バージョン比較

| バージョン | 主な内容 |
| ---------- | -------- |
| 0.1.1 | excel2md subtree v2.1.1 へ更新; ルート配下の日英 OSS 文書（README／CHANGELOG／CONTRIBUTING／SECURITY）; セキュリティサポート対象の現行版 |
| 0.1.0 | 初回リリース: トレーサビリティ・マトリクス、構造マッチング（md2map/code2map）、3 方式マッチング、Markdown 出力、マルチ LLM、Vite + React フロントエンド |
