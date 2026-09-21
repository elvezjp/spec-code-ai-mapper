# 変更履歴

[English](./CHANGELOG.md) | [日本語](./CHANGELOG_ja.md)

このプロジェクトに対するすべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [セマンティックバージョニング](https://semver.org/lang/ja/) に準拠しています。

## [0.2.0] - 2026-09-21

`versions/` ディレクトリを廃止して最新コードのみをルート直下で保持する構成へ移行し、あわせてセキュリティ修正と依存関係の更新を行ったリリース。

### セキュリティ
- **認証なし API のパストラバーサルによる任意ファイル書き込みを修正**（GHSA-f63v-8r92-h4r7）: `POST /api/split/markdown` / `POST /api/split/code` / `POST /api/convert/excel-to-markdown` がクライアント指定のファイル名を一時ディレクトリのパスへそのまま結合しており、絶対パスや `../` で一時ディレクトリ外にファイルを作成・上書きできた。`safe_filename()` でディレクトリ成分を除去するよう修正し、回帰テストを追加
- **[BREAKING] CORS の既定値を全許可（`*`）からローカル開発用オリジンのみに変更**（#25, #36）: `CORS_ORIGINS` が未設定・空白の場合は `http://localhost:5173` / `http://127.0.0.1:5173` / `http://localhost:4173` / `http://127.0.0.1:4173` のみを許可する。`*` を含む設定（`*,https://app.example.com` のような混在を含む）では認証情報（`allow_credentials`）を許可しない。従来は既定の全許可と `allow_credentials=True` の組み合わせにより、Starlette がリクエスト元の Origin をそのまま返し、任意のサイトがレビュー対象のコードや設計書を含む応答を読める状態だった。**注意:** フロントエンドは同一オリジンから API を呼ぶため通常の構成に影響はないが、別オリジンから API を呼んでいる場合は `CORS_ORIGINS` の明示が必要
- **git 依存の参照先を可変なブランチからリリースタグに固定**（#27、CWE-829）: `add-line-numbers` / `md2map` / `code2map` の参照先を `branch = "main"` からタグ `v0.1.3` / `v0.5.1` / `v0.3.0` に変更し、バージョン下限も宣言した。これに伴い各ツールは 0.1.2 → 0.1.3、0.4.3 → 0.5.1、0.2.1 → 0.3.0 に更新されるが、`md2map` の新機能（OpenAI 互換 API の `base_url`、`reasoning_effort`、AI 呼び出しの並列実行）はいずれもオプトインのため、本バックエンドの挙動には影響しない
- **ローカル利用を前提とする方針を明記**（#36）: 本ツールは認証・認可を持たないため、README / SECURITY に「想定する利用環境」を追加し、起動例を `--host 127.0.0.1` に統一。SECURITY のサポート対象を最新版のみとし、脆弱性の報告先を非公開の窓口（GitHub の非公開脆弱性報告またはメール）に統一
- **フロントエンドの依存関係を更新して既知の脆弱性に対応**: `react-router-dom` 7.17.0 → 7.18.2（XSS、ルートマッチング DoS、コンストラクタインジェクション。#24）、`vitest` 4.1.9 → 4.1.11（GHSA-82fw-gwwq-j7x9）、`browserslist` 4.28.2 → 4.28.9（GHSA-73wf-gq98-2v4g）、`js-yaml` 4.2.0 → 4.3.2（GHSA-5p4m-2wfm-xmqj ほか）、`brace-expansion` → 1.1.16 / 5.0.8、`postcss` 8.5.15 → 8.5.24（GHSA-r28c-9q8g-f849）。GHSA-qwww-vcr4-c8h2（`react-router` の RSC モードの CSRF）は、該当機能を使用しておらず 7.x 系の修正版も存在しないため dismiss

### 変更
- **[BREAKING] `versions/` ディレクトリを廃止し、最新コードのみをルート直下で保持する構成に移行**（#16）: `versions/v0.1.2/` の `backend`・`frontend` をルート直下へ、仕様書類を `docs/` へ移動し、旧バージョン（v0.1.0 / v0.1.1）のスナップショットを削除。旧バージョンの lockfile に対する Dependabot アラートの重複通知が解消される。旧構成は `v0.1.2` タグに保存されており `git checkout v0.1.2` で参照できる（同タグのコードは本リリースのセキュリティ修正を含まない）。今後はリリース時に `vX.Y.Z` タグを作成する
- **[BREAKING] `excel2md` を同梱ディレクトリの `sys.path` 注入から PyPI 依存に移行**（#20）: `excel2md>=2.2.1` を依存に追加（v2.1.1 → v2.3.0）。環境変数 `EXCEL2MD_PATH` は廃止。変換結果の差分として、**印刷領域（未設定時は使用範囲）の外に置かれた画像のリンクが CSV マークダウンに出力されなくなる**（上流 v2.2.1 の修正 [excel2md#14](https://github.com/elvezjp/excel2md/issues/14)）。それ以外のシートと Mermaid 出力は、移行前後で一致することを確認済み
- **ドキュメントを単一バージョン構成・git tag 運用に合わせて整備**（#16, #20, #35）: README / CONTRIBUTING の手順をルート構成に書き換え、README に「バージョン管理」を追加し、「関連プロジェクト」を uv の依存関係としての記述に変更。Dependabot 運用方針をルートの lockfile のみを対象とする内容に更新。`docs/spec.md` から「バージョン切替UI」の章と関連する E2E 試験項目を削除し、`docs/structure-matching.md` のフロントエンド実装の節を実装に合わせて書き直した
- **バックエンドの依存パッケージを更新**: `uv lock --upgrade` により 31 件を更新（`anthropic` 0.121.0、`openai` 2.53.0、`fastapi` 0.141.1、`starlette` 1.6.0、`uvicorn` 0.52.1 ほか）。特定のアドバイザリに対応するものではなく定期更新
- **Node.js の要件を依存関係に合わせて更新**（#36）: 20.19 以上（20.x）/ 22.12 以上（22.x）/ 24 以上。フロントエンド CI の Node.js マトリクスも `["20", "23"]` → `["20", "24"]` に変更

### 削除
- **[BREAKING] バージョン切替 UI を廃止**（#16）: 画面左上のバージョンボタンとバルーン（`VersionSelector` / `useVersions`）、`app_version` Cookie の読み書きを削除。切替先を振り分けるインフラが本リポジトリには存在せず、機能していなかった。起動中のバージョンは従来どおり設定モーダルで確認できる
- **[BREAKING] git subtree で取り込んでいた外部ツールのディレクトリ 5 つを削除**（#16, #20）: `add-line-numbers/`・`code2map/`・`excel2md/`・`markitdown/`・`md2map/`。いずれも PyPI または上流リリースタグの git 依存として取得しており未参照だった。リポジトリ内の依存マニフェストは 33 ファイルから 4 ファイルになった。ソースを参照したい場合は各上流リポジトリを clone する

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
| 0.2.0 | `versions/` 廃止・ルート構成へ移行; excel2md の PyPI 移行; バージョン切替 UI の廃止; セキュリティ修正（認証なし API のパストラバーサル、CORS 既定値のローカル限定、git 依存のタグ固定）; セキュリティサポート対象の現行版 |
| 0.1.2 | Python 最小要件を 3.11 に引き上げ; `idna` を 3.16 に更新（Dependabot #66 解消） |
| 0.1.1 | excel2md subtree v2.1.1 へ更新; ルート配下の日英 OSS 文書（README／CHANGELOG／CONTRIBUTING／SECURITY） |
| 0.1.0 | 初回リリース: トレーサビリティ・マトリクス、構造マッチング（md2map/code2map）、3 方式マッチング、Markdown 出力、マルチ LLM、Vite + React フロントエンド |
