# 変更履歴

[English](./CHANGELOG.md) | [日本語](./CHANGELOG_ja.md)

このプロジェクトに対するすべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [セマンティックバージョニング](https://semver.org/lang/ja/) に準拠しています。

## [0.2.0] - Unreleased

### セキュリティ
- **[SECURITY] 認証なし API のパストラバーサルによる任意ファイル書き込みを修正**（GHSA-f63v-8r92-h4r7）: `POST /api/split/markdown` / `POST /api/split/code` / `POST /api/convert/excel-to-markdown` がクライアント指定のファイル名を一時ディレクトリのパスへそのまま結合していたため、絶対パスや `../` を含む値で一時ディレクトリ外にファイルを作成・上書きできた。クライアント由来のファイル名は `safe_filename()`（`versions/v0.1.2/backend/app/safe_path.py` に追加）でディレクトリ成分を除去してから使用するよう修正し、回帰テストを追加。注: `versions/v0.1.0` / `versions/v0.1.1` にも同一の欠陥があるが、凍結スナップショットのため修正対象外（`versions/` レイアウトは廃止予定）
- **[SECURITY] CORS のオリジンを限定していない場合に認証情報を許可しないよう修正**（[#25](https://github.com/elvezjp/spec-code-ai-mapper/pull/25)）: `versions/v0.1.2/backend/app/main.py` が `CORS_ORIGINS` 既定値（`*`）のままでも `allow_credentials=True` としていた。Starlette はワイルドカードと認証情報を併用できない仕様のため、この場合 `Access-Control-Allow-Origin` にリクエスト元 Origin をそのまま返し、あわせて `Access-Control-Allow-Credentials: true` を返す。結果として任意のサイトがこの API に資格情報付きで到達して応答を読めるため、ローカル起動中に利用者が悪意あるページを開くとレビュー対象のコードや設計書が読み取られうる状態だった。オリジン一覧に `*` が含まれる場合（Starlette が同じく全許可として扱う `*,https://app.example.com` のような混在指定を含む）は認証情報を許可しないよう修正。オリジンを限定している場合の挙動は変更なし。回帰テストを追加
- **[SECURITY] git 依存の参照先を可変なブランチからリリースタグに固定**（CWE-829）: `versions/v0.1.2/backend/pyproject.toml` の `[tool.uv.sources]` で `add-line-numbers` / `md2map` / `code2map` が `branch = "main"` を参照していたため、`main` が進むたびに解決先コミットが移動し、参照先のすり替えが気付かれない経路が残っていた。参照先をタグ `v0.1.3` / `v0.5.1` / `v0.3.0` に変更し、再ロックで解決先が動かないようにした。更新は `pyproject.toml` の差分としてレビューに乗る。あわせて `[project.dependencies]` にバージョン下限（`add-line-numbers>=0.1.3`、`md2map[nlp,ai]>=0.5.1`、`code2map>=0.3.0`）を宣言した。`[tool.uv.sources]` は伝播しないが、バージョン制約はビルドした wheel の `Requires-Dist` に載るため、解決時点で検出できる
- **[SECURITY] フロントエンド依存関係を更新し Dependabot アラートを解消**（#24）: `react-router-dom` を 7.17.0 → 7.18.2 に更新してアラート [#136](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/136) / [#145](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/145) / [#148](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/148)（XSS、ルートマッチング DoS、コンストラクタインジェクション）を解消。あわせて推移的な開発依存 `js-yaml` 4.2.0 → 4.3.0（アラート [#141](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/141)）と `brace-expansion` → 1.1.16 / 5.0.8（アラート [#133](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/133)、いずれも CPU 消費型 DoS）を更新し、`postcss` も 8.5.15 → 8.5.24 に先行更新（GHSA-r28c-9q8g-f849、任意 `.map` ファイル漏えい）。アラート [#142](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/142)（GHSA-qwww-vcr4-c8h2、RSC モードの CSRF）は unstable RSC API 未使用かつ 7.x 系修正版が存在しないため「該当機能未使用」として dismiss。凍結スナップショット `versions/v0.1.0` / `versions/v0.1.1` のアラート [#149](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/149) / [#150](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/150) は修正対象外として dismiss

### 変更
- **バックエンドの依存パッケージを更新**: `uv lock --upgrade` により `versions/v0.1.2/backend/uv.lock` を再生成し、31件を更新（`anthropic` 0.109.2 → 0.121.0、`openai` 2.42.0 → 2.53.0、`fastapi` 0.137.1 → 0.141.1、`starlette` 1.3.1 → 1.6.0、`uvicorn` 0.49.0 → 0.52.1、`pandas` 3.0.3 → 3.0.5、`markitdown` 0.1.6 → 0.1.7、`tree-sitter` 0.25.2 → 0.26.0 ほか）。特定のアドバイザリに対応するものではなく定期更新
- **上記のタグ固定にあわせて自社ツールを更新**: `add-line-numbers` 0.1.2 → 0.1.3、`md2map` 0.4.3 → 0.5.1、`code2map` 0.2.1 → 0.3.0。`add-line-numbers` v0.1.3 と `code2map` v0.3.0 は実装・出力に変更なし（開発依存 `cryptography` の下限引き上げと `versions/` ディレクトリの廃止）。`md2map` v0.5.0 は OpenAI 互換 API の `base_url`、`reasoning_effort`、セクション単位 AI 呼び出しの並列実行を追加しているが、いずれもオプトインで既定値は従来どおりのため、本バックエンドの挙動には影響しない。v0.5.1 はタグ固定のみのリリース

## [0.1.2] - 2026-06-17

### セキュリティ
- **[SECURITY] `starlette` を 1.0.1 → 1.3.1 に更新**: Dependabot アラート [#121](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/121) / [#122](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/122) / [#123](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/123) / [#124](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/124)（`starlette < 1.3.1` ほか）を解消。あわせて `uv.lock` を再生成。
- **[SECURITY] `idna` を 3.14 → 3.16 に更新**: Dependabot アラート [#66](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/66)（GHSA-65pc-fj4g-8rjx, `idna < 3.15`）を解消。

### 変更
- **Python 最小要件を 3.10 → 3.11 に引き上げ**: 依存先（`add-line-numbers`、`md2map`、`code2map`）の最新 main が Python >=3.11 を要求するようになり、3.10 では `uv lock` が解決できないため、`versions/v0.1.2/backend/pyproject.toml` の `requires-python` を更新。

### 修正
- `/health` エンドポイントをフロントエンド静的ファイル配信より前に登録し、ヘルスチェック応答を正しく返すように修正。

### 互換性
- `versions/v0.1.1/` は凍結スナップショットとして保持し、v0.1.2 はそのコピーをベースに上記の修正を適用。

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
| 0.1.2 | Python 最小要件を 3.11 に引き上げ; `idna` を 3.16 に更新（Dependabot #66 解消）; セキュリティサポート対象の現行版 |
| 0.1.1 | excel2md subtree v2.1.1 へ更新; ルート配下の日英 OSS 文書（README／CHANGELOG／CONTRIBUTING／SECURITY） |
| 0.1.0 | 初回リリース: トレーサビリティ・マトリクス、構造マッチング（md2map/code2map）、3 方式マッチング、Markdown 出力、マルチ LLM、Vite + React フロントエンド |
