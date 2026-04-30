# Dependabot アラート整理計画書

## 概要

リポジトリ全体に発生している 40 件の Dependabot アラート（Vulnerable タブ）について、issue #9 で決定した運用方針に沿って整理する。

- 対応 Issue: [#9](https://github.com/elvezjp/spec-code-ai-mapper/issues/9)
- 参考（姉妹リポジトリ）: [elvezjp/spec-code-ai-reviewer#97](https://github.com/elvezjp/spec-code-ai-reviewer/issues/97) / [PR #98](https://github.com/elvezjp/spec-code-ai-reviewer/pull/98)

## 背景

`md2map/versions/` 配下にアーカイブされた旧バージョンと、git subtree で取り込んでいる外部リポジトリディレクトリ（`add-line-numbers/`、`code2map/`、`excel2md/`、`markitdown/`、`md2map/`）が原因で、Dependabot アラートが大量に発生している。本リポジトリで本来対処すべきは最新版（`versions/v0.1.0/`）のみ。

### 現状の内訳（Vulnerable タブ）

| カテゴリ | 件数 | 対応 |
|---|---|---|
| git subtree 配下 | 30 | Dismiss（subtree 元で管理） |
| 最新版（`versions/v0.1.0/`） | 10 | 修正対応 |
| **合計** | **40** | |

※ ルート `versions/` 配下は `v0.1.0` のみで、現時点では「旧バージョン」のカテゴリは発生していない。今後 `v0.2.0` 以降が追加された際は、姉妹リポジトリと同様に旧バージョンを Dismiss する運用とする。

### Malware タブ

別途確認し、件数があれば最優先で修正する（場所を問わない）。

---

## Step 1: git subtree 配下のアラートを Dismiss

### 対象

以下のディレクトリ配下のアラート（合計 30 件）:

- `add-line-numbers/`
- `code2map/`（`code2map/versions/` 含む）
- `excel2md/`
- `markitdown/`
- `md2map/`（`md2map/versions/` 含む）

| マニフェスト | 件数 |
|---|---|
| `code2map/uv.lock` | 2 |
| `code2map/versions/v0.1.1/uv.lock` | 2 |
| `code2map/versions/v0.1.2/uv.lock` | 2 |
| `code2map/versions/v0.1.3/uv.lock` | 2 |
| `excel2md/uv.lock` | 2 |
| `md2map/uv.lock` | 6 |
| `md2map/versions/ v0.1.0/uv.lock` | 2 |
| `md2map/versions/v0.2.0/uv.lock` | 6 |
| `md2map/versions/v0.3.0/uv.lock` | 6 |

### Dismiss 理由

`not_used`（"Vulnerable code is not actually used"）

理由: subtree 元リポジトリ側で依存管理を行っているため、本リポジトリでは管理対象外。

### 実行コマンド

```bash
# 対象アラート番号を抽出
gh api repos/elvezjp/spec-code-ai-mapper/dependabot/alerts --paginate \
  -q '.[] | select(.state=="open") |
       select(.dependency.manifest_path | startswith("md2map/") or
              startswith("code2map/") or
              startswith("excel2md/") or
              startswith("add-line-numbers/") or
              startswith("markitdown/")) |
       .number' > /tmp/subtree_alerts.txt

# 一括 Dismiss
while read num; do
  gh api -X PATCH repos/elvezjp/spec-code-ai-mapper/dependabot/alerts/$num \
    -f state=dismissed \
    -f dismissed_reason=not_used \
    -f dismissed_comment="Managed in upstream subtree repository. See README Dependabot Alert Policy."
done < /tmp/subtree_alerts.txt
```

### 完了条件

- subtree 配下のすべての open アラートが dismissed になっている
- ダッシュボード上の件数が 40 → 10 に減る

---

## Step 2: 最新版（`versions/v0.1.0/`）のアラートを修正

### 対象（10 件）

| # | 重要度 | パッケージ | manifest | GHSA | 概要 |
|---|---|---|---|---|---|
| 49 | medium | python-dotenv | `versions/v0.1.0/backend/uv.lock` | GHSA-mf9w-mj56-hr94 | set_key の Symlink フォローによる任意ファイル上書き |
| 48 | medium | vite | `versions/v0.1.0/frontend/package-lock.json` | GHSA-4w7w-66w2-5vf9 | Optimized Deps `.map` Path Traversal |
| 47 | high | vite | 同上 | GHSA-v2wj-q39q-566r | `server.fs.deny` バイパス |
| 46 | high | vite | 同上 | GHSA-p9ff-h696-f583 | Dev Server WebSocket の任意ファイル読取 |
| 43 | medium | picomatch | 同上 | GHSA-3v7f-55p6-f55p | POSIX Character Classes Method Injection |
| 41 | medium | yaml | 同上 | GHSA-48c2-rrv3-qjmp | 深いネストによる Stack Overflow |
| 40 | high | flatted | 同上 | GHSA-rf6f-7fwh-wjgh | parse() の Prototype Pollution |
| 38 | high | minimatch | 同上 | GHSA-7r86-cg39-jmmj | matchOne() ReDoS |
| 37 | high | minimatch | 同上 | GHSA-7r86-cg39-jmmj | 同上（別経路） |
| 34 | high | rollup | 同上 | GHSA-mw96-cpmx-2vgc | Arbitrary File Write via Path Traversal |

### 対応方針

#### バックエンド（Python / uv）

```bash
cd versions/v0.1.0/backend
uv lock --upgrade-package python-dotenv
uv sync
uv run pytest tests/ -v
```

#### フロントエンド（npm）

```bash
cd versions/v0.1.0/frontend
npm audit fix
# または個別に
npm update vite picomatch yaml flatted minimatch rollup
npm test
```

### 判断フロー

各パッケージについて以下のフローで判断する:

1. **lockfile 更新だけで解決するか確認**（`uv lock --upgrade-package` / `npm update`）
2. **解決する場合**: lockfile 更新 → テスト実行 → 別 PR を作成して本 PR にマージ後対応
3. **メジャーバージョン更新が必要な場合**:
   - 既存テスト・動作確認に影響が及ぶため、**個別に issue を切って別途対応**
   - 例: vite v5 → v6 のように Breaking Changes を伴う更新

### 完了条件

- v0.1.0 配下のすべての Vulnerable アラートが「修正済み」または「個別 issue 化」されている
- 修正の場合: lockfile 更新 PR がマージされアラートが自動 close される
- issue 化の場合: 該当アラートは一時的に open のまま残る（issue 番号をコメントに記載）

---

## Step 3: Malware タブの確認

### 対象

Dependabot Alerts の Malware タブに表示されているアラート全件。

### 対応

- 発生場所（subtree / 旧バージョン / 最新版）を問わず、**すべて修正対応**
- 修正できないものは個別に issue を切る

### 確認 URL

```
https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot?q=is%3Aopen+is%3Amalware
```

---

## 完了後の検証

```bash
# 残存 open アラート数を確認
gh api repos/elvezjp/spec-code-ai-mapper/dependabot/alerts --paginate \
  -q '.[] | select(.state=="open") | .number' | wc -l
```

期待値: **0 件**（または最新版の修正待ち issue 化分のみ）

## 作業記録

実行時に各ステップで dismissed したアラート数、修正した PR 番号、切った issue 番号を本セクションに追記する。

| Step | 実行日 | 件数 | 関連 PR / Issue | 備考 |
|---|---|---|---|---|
| Step 1（subtree dismiss） | - | 0 / 30 | - | 未実施 |
| Step 2（最新版修正） | - | 0 / 10 | - | 未実施 |
| Step 3（malware 確認） | - | - | - | 未実施 |
