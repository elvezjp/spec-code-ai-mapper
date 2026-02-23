# 変更履歴

このプロジェクトに対するすべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) に基づいており、
このプロジェクトは [セマンティックバージョニング](https://semver.org/spec/v2.0.0.html) に準拠しています。

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
