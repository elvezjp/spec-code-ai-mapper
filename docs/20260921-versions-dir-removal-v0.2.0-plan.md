# `versions/` ディレクトリ廃止と v0.2.0 ルート構成移行 計画書

作成日: 2026-09-21

## 1. 背景・目的

これまで本リポジトリは、`versions/` ディレクトリに全バージョン（v0.1.0 / v0.1.1 / v0.1.2）のスナップショットを実体として保持し、外部ツール（`add-line-numbers/`、`code2map/`、`excel2md/`、`markitdown/`、`md2map/`）もリポジトリ直下に git subtree で取り込んできた。

この構成には以下の問題がある。

- Dependabot アラートが旧バージョン・subtree の lockfile ごとに重複通知される（#16）。現在リポジトリ内の依存マニフェストは 33 ファイルあり、実際に保守しているのはそのうち `versions/v0.1.2/` 配下の 4 ファイルのみ。subtree 内にはさらに上流の旧バージョン（`code2map/versions/`、`md2map/versions/`）の lockfile まで含まれている
- セキュリティ修正のたびに「旧バージョンにも同一の欠陥があるが対象外」というトリアージが発生している（0.2.0 ではパストラバーサル GHSA-f63v-8r92-h4r7 の注記と、凍結スナップショット由来のアラート 2 件の dismiss）
- `excel2md` だけが依存管理の外にあり、`sys.path` への動的注入で同梱の `excel2md/v2.1.1` を読み込んでいる（#20）。#27 で他の自社ツール 3 件がタグ固定の git 依存になった結果、サプライチェーン面で唯一残った未管理の依存になっている。上流は v2.3.0 まで進んでおり、2 マイナー遅れている
- `add-line-numbers/` / `code2map/` / `md2map/` / `markitdown/` は uv が PyPI・git ソースから取得しており、同梱ディレクトリはどこからも参照されていない
- 画面左上のバージョン切替 UI は、切替先を振り分ける nginx 等のインフラが本リポジトリに存在せず、選択肢も現行バージョン 1 件のみで、機能していない
- 新バージョン追加のたびに `versions/<version>/` を丸ごとコピーし、多数のファイルを定型更新する運用コストが大きい（`versions/README.md` の手順参照）

本計画では `versions/` ディレクトリと subtree を廃止し、**最新コードのみをルート直下で保持する構成**へ移行する。先行して同じ対応を完了した AIレビュアー（[spec-code-ai-reviewer PR #122](https://github.com/elvezjp/spec-code-ai-reviewer/pull/122)）と AIオーディター（[coding-policy-ai-auditor PR #39〜#42](https://github.com/elvezjp/coding-policy-ai-auditor/pull/39)）の方式に揃える。移行後は次の運用とする。

- main ブランチには次バージョンの変更を未リリースとして蓄積する（CHANGELOG の `[0.2.0] - Unreleased` セクション。現行運用のまま）
- リリース時に `pyproject.toml` 等のバージョンを確定し、git tag（`vX.Y.Z`）を打つ
- 旧構成（`versions/` ディレクトリ時代）のバージョンを利用したい場合は、既存の **`v0.1.2` タグ**を checkout する。このタグには `versions/` の全スナップショット（v0.1.0〜v0.1.2）と subtree 一式が含まれるため、旧バージョンごとの tag は新規作成しない（code2map / md2map / AIレビュアー / AIオーディターと同方式）
- 本移行は開発中の **v0.2.0** に含める

### 関連 Issue

| Issue | 内容 | 本計画での扱い |
| --- | --- | --- |
| #16 | `versions/` 廃止・依存ライブラリの uv 管理への移行 | 本計画の中核。`versions/` 削除・subtree 削除。旧構成は `v0.1.2` タグで参照。Issue 本文の「`v0.1.0` タグを作成する」は実施しない（同 Issue コメントの方針どおり）。依存ライブラリ 5 件のうち 4 件は #27 までに対応済みで、残る excel2md を本計画で対応 |
| #20 | excel2md の `sys.path` 注入を撤去し PyPI 版に切り替える | PyPI 版 `excel2md>=2.2.1` へ移行。subtree ディレクトリを削除し、README に上流リポジトリの clone 方法を記載 |

最終 PR で #16 / #20 をクローズする。

## 2. 移行後のディレクトリ構成

`versions/v0.1.2/` の内容をルートに昇格させ、以下の構成とする。

```
spec-code-ai-mapper/
├── .github/
│   └── workflows/
│       └── ci.yml                  # working-directory を backend/ / frontend/ に変更
├── backend/                        # ← versions/v0.1.2/backend を昇格
│   ├── app/
│   ├── tests/
│   ├── pyproject.toml              # version = "0.2.0"、excel2md を依存に追加
│   └── uv.lock
├── frontend/                       # ← versions/v0.1.2/frontend を昇格
│   ├── src/
│   ├── package.json                # version = "0.2.0"
│   └── ...
├── docs/
│   ├── spec.md                     # ← versions/v0.1.2/spec.md を移動
│   ├── config-file-generator-spec.md  # ← versions/v0.1.2/ から移動
│   ├── structure-matching.md
│   ├── tests/                      # 移行の試験項目表と確認結果（新設）
│   └── （既存の計画書類）
├── .env.example
├── Constitution.md
├── CHANGELOG.md / CHANGELOG_ja.md
├── README.md / README_ja.md
├── CONTRIBUTING.md / CONTRIBUTING_ja.md
├── SECURITY.md / SECURITY_ja.md
└── LICENSE
```

**なくなるもの**: `versions/`（`versions/README.md` 含む）、subtree 5 ディレクトリ（`add-line-numbers/`、`code2map/`、`excel2md/`、`markitdown/`、`md2map/`）、フロントエンドのバージョン切替 UI（`VersionSelector` / `useVersions` / `VersionInfo` / `app_version` Cookie）。

> **AIレビュアー・AIオーディターとの差分**
>
> - `nginx/`、Docker 関連ファイル、PM2 設定、`latest` シンボリックリンク、`scripts/sync_version.py` は本リポジトリにもともと存在しない（AIオーディターと同じ）。インフラ一式の削除作業はない
> - バージョン切替 UI は AIオーディターでは未使用コードだったが、本リポジトリでは `features/reviewer/index.tsx` のヘッダー左上で**実際に描画されている**。AIレビュアーと同じ UI 改修（ヘッダーからの除去）が必要
> - subtree が 5 ディレクトリある（AIオーディターは 2）。ただしコードから参照しているのは `excel2md/` のみ
> - `docs/spec.md` に AIレビュアー由来の「3.5 バージョン切替UI」「13.3.4 バージョン切替テスト」「13.3.5 旧バージョン動作確認テスト」が残っており、削除と後続セクションの繰り上げが必要

## 3. 削除対象の一覧

### 3.1 ディレクトリ

| 対象 | 規模 | 理由 | 前提条件 |
| --- | --- | --- | --- |
| `versions/v0.1.0/` `versions/v0.1.1/` | 274 ファイル | 旧構成は既存の `v0.1.2` タグの checkout で参照可能 | README に `v0.1.2` checkout の案内を記載 |
| `versions/README.md` | 1 ファイル | バージョン更新手順（丸ごとコピー運用）が廃止される。更新履歴は CHANGELOG（「バージョン比較」セクションを含む）に同等の情報がある | CHANGELOG に不足がないことを確認（不足があれば追記） |
| `markitdown/` | 117 ファイル | PyPI の `markitdown[xlsx]` を使用しており未参照 | — |
| `excel2md/` | 149 ファイル | PyPI 公開済み（v2.3.0）。`sys.path` 注入を撤去し依存宣言に移行（#20） | フェーズ 2 のコード修正とセット |
| `add-line-numbers/` | 12 ファイル | #27 でタグ固定の git ソース（`v0.1.3`）取得に移行済みで未参照 | — |
| `code2map/` | 258 ファイル | 同上（`v0.3.0`） | — |
| `md2map/` | 243 ファイル | 同上（`v0.5.1`） | — |

subtree 5 ディレクトリの合計は 779 ファイル。

> **補足**: `v0.1.2` タグには `versions/` 全体と subtree 一式が含まれるため、タグを checkout すれば全旧バージョンが従来どおり動作する（旧バージョンの excel2md は同梱ディレクトリの `sys.path` 注入で動作する）。

### 3.2 フロントエンドのバージョン切替 UI

| 対象 | 内容 |
| --- | --- |
| `frontend/src/core/hooks/useVersions.ts` | `DEFAULT_VERSIONS` / Cookie（`app_version`）読み書き / `switchVersion` を含むフックごと削除 |
| `frontend/src/core/components/shared/VersionSelector.tsx` | ピル型ボタンとバルーン UI を削除 |
| `frontend/src/core/index.ts` | `VersionSelector`（31 行目）、`useVersions` / `DEFAULT_VERSIONS`（43 行目）の export を削除 |
| `frontend/src/core/types/index.ts` | `VersionInfo` 型（80 行目付近）を削除 |
| `frontend/src/features/reviewer/index.tsx` | import（13 / 17 行目）、`useVersions()` 呼び出し（43 行目）、`<Header>` の `leftContent` に渡している `<VersionSelector>`（376 行目付近）を削除 |

- `Header` の `leftContent` は省略可能な prop のため、削除後もレイアウトは崩れない（画面で確認する）
- 設定モーダルの「起動中のバージョン番号の表示」は `APP_INFO`（`features/reviewer/index.tsx`）のまま残す
- これらを対象とするテストは存在しない

## 4. 実装修正が必要な箇所

### 4.1 バックエンド（#20: excel2md の PyPI 移行）

| ファイル | 修正内容 |
| --- | --- |
| `backend/pyproject.toml` | `dependencies` に `"excel2md>=2.2.1"` を追加（PyPI 公開済みのため `[tool.uv.sources]` への追記は不要。下限は AIレビュアー・AIオーディターに揃える。lock 上は 2.3.0 に解決される見込み） |
| `backend/app/markdown_tools/excel2md_tool.py` | `_DEFAULT_EXCEL2MD_PATH` / `EXCEL2MD_PATH` 環境変数 / `sys.path.insert` による動的注入と `sys.path` の復元処理を撤去し、`from excel2md.cli import build_argparser` / `from excel2md.runner import run` の通常 import に変更。`safe_filename()` によるサニタイズと `preprocess_for_organize()` は維持 |
| `backend/app/markdown_tools/excel2md_mermaid_tool.py` | 同上（`EXCEL2MD_PATH` の import と `sys.path` 操作を撤去） |
| `backend/tests/test_excel2md_tool.py` / `test_excel2md_mermaid_tool.py` | 変更不要の見込み（AIレビュアーの移行前後でテストは無変更。本リポジトリのテストは AIレビュアーの移行前と同一内容） |
| `backend/uv.lock` | `uv lock` で再生成 |

本リポジトリの 2 ファイルは、AIレビュアーの移行前コードに `safe_filename` を追加したものと同一で、AIレビュアーの移行後ファイル（現 main）がそのまま目標形になる。`build_argparser` / `run` が PyPI 版に同一シグネチャで存在し、`--csv-markdown-enabled` / `--no-csv-include-metadata` / `--mermaid-enabled` / `--mermaid-detect-mode shapes` が動作することは AIレビュアー・AIオーディターで確認済み。

なお `_DEFAULT_EXCEL2MD_PATH` はディレクトリ階層（`versions/vX.Y.Z/backend/...` から 6 階層上）に依存しているため、ルート昇格だけでもパスが壊れる。**ルート昇格（フェーズ 3）より先に対応する。**

### 4.2 バージョン表記（0.1.2 → 0.2.0）

| ファイル | 箇所 |
| --- | --- |
| `backend/pyproject.toml` | `version = "0.1.2"`（`uv.lock` も追従） |
| `frontend/package.json` / `package-lock.json` | `"version": "0.1.2"` |
| `frontend/src/features/reviewer/index.tsx` | `APP_INFO.version: 'v0.1.2'`（35 行目） |
| `frontend/src/features/config-file-generator/schema/configSchema.ts` | `version: 'v0.1.2'`（7 行目）、`value: 'v0.1.2'`（20 行目） |
| `docs/spec.md`（移動後） | 冒頭（3 行目）、レポート例・画面例・API 例など本文中のバージョン表記（537 / 622 / 1117 / 1265 / 1703 / 1778 / 2070 行目付近ほか） |
| `docs/config-file-generator-spec.md`（移動後） | 冒頭（3 行目）と本文中のバージョン表記（50 / 140 / 150 / 210 / 278 / 293 / 569 行目付近） |

バージョン文字列を期待値に持つテストがあれば追従させる。

### 4.3 CI

| ファイル | 修正内容 |
| --- | --- |
| `.github/workflows/ci.yml` | `working-directory` を `versions/v0.1.2/backend` → `backend`、`versions/v0.1.2/frontend` → `frontend` に変更 |

### 4.4 ドキュメント

| ファイル | 修正内容 |
| --- | --- |
| `README.md` / `README_ja.md` | 「Quick Start」の `cd versions/v0.1.2/...`（96 / 104 行目付近）をルートパスに変更。「Directory Structure」（129 行目〜）を新構成に書き換え。「Related Projects」（221 行目〜）を「git subtree で追加している」から「uv により PyPI または git ソースからインストール」に書き換え、ソース参照時は各上流リポジトリを clone する旨を記載（#20 の方針）。「Version Management」を新設し、git tag ベースの運用と、**旧構成のバージョンを利用したい場合は `git checkout v0.1.2` で取得する**旨、注意書き（6 章参照）を記載。「Dependabot Alert Policy」（167 行目〜）から旧バージョン・subtree の行と前提説明を削除し、単一バージョン構成向けに書き換え |
| `docs/spec.md`（移動後） | 「3.5 バージョン切替UI」（1175 行目〜）、「13.3.4 バージョン切替テスト」（E2E-VS-001〜004）、「13.3.5 旧バージョン動作確認テスト」（E2E-OLD-001〜002）を削除し、後続セクション（13.3.6 / 13.3.7）を繰り上げ。Cookie `app_version` の記述を削除。「8. ディレクトリ構成」の `versions/v0.1.2/` をルート構成に更新。「8.1 バージョン管理」の「マルチバージョン運用〜は README を参照」の注記を削除し、バージョン更新手順を git tag 運用に合わせる。「11. デプロイ構成」の `../../README.md` を `../README.md` に修正し、本リポジトリに存在しない `docs/ec2-deployment-spec.md` へのリンク行を削除。excel2md への相対リンク `../../excel2md/`（127 / 128 / 200 行目）を上流リポジトリ URL に変更し、古い「v1.7」表記を削除。バージョン表記の更新（4.2） |
| `docs/config-file-generator-spec.md`（移動後） | バージョン表記の更新（4.2） |
| `CHANGELOG.md` / `CHANGELOG_ja.md` | 各 PR で自身の変更分を `[0.2.0] - Unreleased` に追記。最終 PR で、同セクション内の既存エントリにある `versions/v0.1.2/backend/...` のパス表記をルート構成に更新し、「`versions/` layout is scheduled for removal」の注記を「本リリースで削除」に合わせて整理。リリース済みバージョン（0.1.2 以前）のエントリは変更しない |
| `CONTRIBUTING.md` / `CONTRIBUTING_ja.md` | `cd versions/v0.1.2/...`（46 / 53 / 94 / 106 / 116 行目付近）をルートパスに更新 |
| `SECURITY.md` / `SECURITY_ja.md` | Dependabot 運用方針（128〜138 行目付近）の「旧バージョン（`versions/`）は Dismiss」「git subtree ディレクトリ」の記述を、単一バージョン + git tag 構成に合わせて書き換え |
| `docs/` の過去の計画書 | 当時の記録のため変更しない |

## 5. 移行フェーズ

変更差分が大きくなるため、AIオーディターと同じく PR を 4 本に分割し、番号順にマージする。各 PR 内ではフェーズ・作業単位でコミットを分ける。

| PR | 範囲 | マージ後の main の状態 |
| --- | --- | --- |
| PR 1 | 本計画書 + フェーズ 1〜2 | `versions/v0.1.2/` 構成のまま。バージョン切替 UI なし、excel2md は PyPI 依存で動作 |
| PR 2 | フェーズ 3 | ルート構成（`backend/` / `frontend/`）。CI もルート構成。subtree は未参照のまま残存 |
| PR 3 | フェーズ 4 | subtree 削除済み |
| PR 4 | フェーズ 5 | ドキュメント整備済み。#16 / #20 をクローズ |

- 後続 PR のブランチは直前の PR のブランチから作成する（積み上げ構成）。差分を見やすくするため、後続 PR の base は直前の PR のブランチとし、直前の PR のマージ後に main へ付け替える
- CI は `main` 向けの PR でのみ起動し、base の付け替えだけでは自動起動しない。付け替え後に PR の close → reopen で CI を起動し、グリーンを確認してからマージする（AIオーディターで実績あり）
- 積み上げ構成を保つため、マージはマージコミット方式（squash しない）で行う
- CHANGELOG は各 PR で自身の変更分を追記する。既存エントリのパス表記の整理は PR 4 で行う
- PR 2 のマージから PR 4 のマージまでの間、README / CONTRIBUTING 等の手順は旧パス（`versions/v0.1.2/...`）のままとなる。間を空けずにマージする

### フェーズ 0: 旧構成への到達性の確認

旧バージョンごとの git tag は**新規作成しない**。

1. `v0.1.2` タグ（annotated、`68a0c32`、2026-06-17）のツリーに `versions/v0.1.0` / `v0.1.1` / `v0.1.2` と subtree 5 ディレクトリがすべて含まれていることを確認する（確認済み）
2. README に旧構成の取得方法を記載する（フェーズ 5 に含める）

### フェーズ 1: バージョン切替 UI の廃止

- セクション 3.2 の削除を実施
- `npm run test:run` / `npm run build`（`tsc -b` を含む）が通ることを確認
- 実画面で、ヘッダー左上からバージョンボタンが消えレイアウトが崩れていないこと、設定モーダルにバージョンが表示されることを確認

### フェーズ 2: excel2md の PyPI 移行（#20）

- セクション 4.1 を `versions/v0.1.2/backend/` に対して実施（この時点ではまだ昇格しない）
- `uv lock` → `uv sync` → `uv run pytest` が通ることを確認
- 実ファイル（同梱 `excel2md/` のテストフィクスチャ `test_standard.xlsx` / `test_mermaid.xlsx`）で excel2md / excel2md-mermaid の変換結果を移行前後で比較する（v2.1.1 → v2.3.0 の出力差分の有無を確認）。本リポジトリには `docs/` 配下にサンプル Excel がないため、削除前の同梱フィクスチャを利用する

### フェーズ 3: v0.1.2 のルート昇格と旧バージョン削除（#16）

1. `git mv versions/v0.1.2/backend backend`、`git mv versions/v0.1.2/frontend frontend`（履歴追跡のため `git mv` を使用）
2. `versions/v0.1.2/spec.md` / `config-file-generator-spec.md` を `docs/` へ `git mv`
3. `versions/`（v0.1.0 / v0.1.1 と `README.md`）を削除
4. バージョンを 0.2.0 に更新（4.2）、`uv lock` と `npm install --package-lock-only` で lockfile を追従
5. CI の `working-directory` を更新（4.3）
6. ルートで `uv sync` / `uv run pytest`、`npm ci` / `npm run test:run` / `npm run build` が通ることを確認

移動（rename のみ）と修正（差分あり）はコミットを分け、レビューしやすくする。

### フェーズ 4: subtree ディレクトリの削除（#16 / #20）

1. `add-line-numbers/`、`code2map/`、`excel2md/`、`markitdown/`、`md2map/` を `git rm -r` で削除
2. 削除後に `.venv` を作り直し、バックエンドテストが通ること（同梱ディレクトリに暗黙依存していないこと）を確認

### フェーズ 5: ドキュメント整備

1. セクション 4.4 のドキュメント更新
2. 移行の試験項目表と確認結果を `docs/tests/` に追加（AIレビュアーと同じ）
3. `git grep -n -E 'versions/|subtree|EXCEL2MD_PATH|app_version'` で取りこぼしを確認（CHANGELOG の履歴記述、README の旧構成案内、過去の計画書は対象外）

### マージ後

- Dependabot: `versions/` と subtree の manifest 消滅により、重複アラートは自動クローズされる見込み。残存アラートは SECURITY.md の新方針で運用
- v0.2.0 リリース時: CHANGELOG の `[0.2.0] - Unreleased` を日付で確定 → バージョン表記と SECURITY のサポートバージョン表を確認 → tag `v0.2.0` を作成・push

## 6. リスク・留意点

| リスク | 対応 |
| --- | --- |
| `v0.1.2` タグの削除・付け替えにより旧構成へ到達できなくなる | `v0.1.2` タグを旧構成アーカイブの参照点として位置づけ、削除・付け替えを行わない運用を README に明記 |
| `v0.1.2` タグは 0.2.0 のセキュリティ修正（パストラバーサル GHSA-f63v-8r92-h4r7、CORS #25、git 依存のタグ固定 #27 ほか、タグ以降 16 コミット分）を含まない | README の旧構成案内に「`v0.1.2` タグ配下のコードは既知の脆弱性を含む凍結スナップショットであり、参照・検証用途に限る。利用には最新版を使うこと」を明記 |
| excel2md v2.1.1 → v2.3.0 で変換出力が変わる | フェーズ 2 で既存テストに加え、フィクスチャ Excel の変換結果を移行前後で比較。差分があれば内容を確認し CHANGELOG に記載（AIオーディターでは生成日時行を除き完全一致） |
| ルート昇格により `_DEFAULT_EXCEL2MD_PATH` の相対階層が壊れる | フェーズ 2（excel2md 移行）をフェーズ 3（昇格）より先に実施 |
| バージョン切替 UI の削除でヘッダーのレイアウトが崩れる | `leftContent` は省略可能な prop。フェーズ 1 で実画面を確認 |
| ブラウザに残った `app_version` Cookie | 読み書きするコードがなくなるため無害。明示的な削除処理は入れない |
| `git mv` による大規模移動で PR レビューが困難になる | PR を 4 分割し、移動と修正でコミットを分ける |
| `EXCEL2MD_PATH` 環境変数で同梱外の excel2md を指定していた利用者がいる | 環境変数は廃止。CHANGELOG に破壊的変更として記載 |
| Windows / macOS の CI でのみ失敗する | CI マトリクス（3 OS × Python 3.11/3.13、Node 20/24）が各 PR でグリーンになることをマージ条件とする |

## 7. 受け入れ条件

- [ ] `git checkout v0.1.2` で旧構成（`versions/` + subtree 一式）が取得でき、その手順と注意書きが README に記載されている
- [ ] ルート直下の `backend/` / `frontend/` で開発・テスト・起動が完結する（`uv run pytest` / `npm run test:run` / `npm run build` がパス）
- [ ] `versions/` と subtree 5 ディレクトリ（add-line-numbers / code2map / excel2md / markitdown / md2map）がリポジトリから削除されている
- [ ] excel2md が PyPI 依存（`excel2md>=2.2.1`）で動作し、`sys.path` 注入・`EXCEL2MD_PATH` が撤去されている
- [ ] 画面からバージョン切替 UI が除去され、設定モーダルに起動中バージョン（`v0.2.0`）のみ表示される
- [ ] バージョン表記が 0.2.0 に統一されている（pyproject.toml / package.json / APP_INFO / configSchema / spec.md / config-file-generator-spec.md）
- [ ] CI がルート構成でグリーン
- [ ] README / CONTRIBUTING / SECURITY / spec.md が新構成・新運用に更新されている
- [ ] CHANGELOG の `[0.2.0] - Unreleased` に本移行が記録されている
- [ ] リポジトリ内の依存マニフェストが `backend/pyproject.toml` / `backend/uv.lock` / `frontend/package.json` / `frontend/package-lock.json` の 4 ファイルのみになっている
