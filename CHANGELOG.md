# Changelog

[English](./CHANGELOG.md) | [日本語](./CHANGELOG_ja.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - Unreleased

### Security
- **Updated the frontend development dependency `js-yaml` from 4.3.0 to 4.3.2** to address excessive CPU consumption when resolving `!!omap` (GHSA-5p4m-2wfm-xmqj, Dependabot [#179](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/179)). Updated the current version's lockfile.
- **[SECURITY] Fixed a path traversal in unauthenticated APIs that allowed arbitrary file writes** (GHSA-f63v-8r92-h4r7): `POST /api/split/markdown`, `POST /api/split/code`, and `POST /api/convert/excel-to-markdown` joined the client-supplied filename directly into a temporary directory path, so absolute paths or `../` sequences could create or overwrite files outside the temporary directory. Client-supplied filenames are now sanitized with `safe_filename()` (added in `versions/v0.1.2/backend/app/safe_path.py`), which strips directory components, with regression tests. Note: `versions/v0.1.0` / `versions/v0.1.1` share the same flaw but are frozen snapshots and out of scope (the `versions/` layout is scheduled for removal)
- **[SECURITY] Stopped allowing credentials when CORS origins are not restricted** ([#25](https://github.com/elvezjp/spec-code-ai-mapper/pull/25)): `versions/v0.1.2/backend/app/main.py` set `allow_credentials=True` even when `CORS_ORIGINS` was left at its default `*`. Starlette cannot combine a wildcard with credentials, so it echoed the requesting `Origin` back in `Access-Control-Allow-Origin` together with `Access-Control-Allow-Credentials: true` — any site could reach this API with credentials and read the response, exposing the code and design documents under review while the app runs locally. Credentials are now disabled whenever the origin list contains `*` (including mixed values such as `*,https://app.example.com`, which Starlette also treats as allow-all); behavior with an explicitly restricted origin list is unchanged. Regression tests added
- **[SECURITY] Pinned git dependencies to release tags instead of a mutable branch** (CWE-829): `[tool.uv.sources]` in `versions/v0.1.2/backend/pyproject.toml` referenced `branch = "main"` for `add-line-numbers` / `md2map` / `code2map`, so the resolved commit moved whenever `main` advanced and a change of reference target could go unnoticed. The references are now the tags `v0.1.3` / `v0.5.1` / `v0.3.0`; re-locking no longer moves the target, and updating it becomes a reviewable change to `pyproject.toml`. Version floors (`add-line-numbers>=0.1.3`, `md2map[nlp,ai]>=0.5.1`, `code2map>=0.3.0`) were also declared in `[project.dependencies]` — `[tool.uv.sources]` is not transitive, but a version constraint is recorded in the built wheel's `Requires-Dist` and is therefore detected at resolution time
- **[SECURITY] Updated frontend dependencies to resolve Dependabot alerts** (#24): Bumped `react-router-dom` 7.17.0 → 7.18.2 to resolve alerts [#136](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/136) / [#145](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/145) / [#148](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/148) (XSS, route-matching DoS, constructor injection), and updated the transitive dev dependencies `js-yaml` 4.2.0 → 4.3.0 (alert [#141](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/141)) and `brace-expansion` → 1.1.16 / 5.0.8 (alert [#133](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/133)), both CPU-consumption DoS. Also preemptively bumped `postcss` 8.5.15 → 8.5.24 (GHSA-r28c-9q8g-f849, arbitrary `.map` file disclosure). Alert [#142](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/142) (GHSA-qwww-vcr4-c8h2, RSC-mode CSRF) was dismissed as not applicable — the unstable RSC APIs are not used and no 7.x patch exists; alerts [#149](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/149) / [#150](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/150) on the frozen snapshots `versions/v0.1.0` / `versions/v0.1.1` were dismissed as out of scope

### Changed
- **Updated the backend dependencies**: regenerated `versions/v0.1.2/backend/uv.lock` with `uv lock --upgrade`, updating 31 packages (`anthropic` 0.109.2 → 0.121.0, `openai` 2.42.0 → 2.53.0, `fastapi` 0.137.1 → 0.141.1, `starlette` 1.3.1 → 1.6.0, `uvicorn` 0.49.0 → 0.52.1, `pandas` 3.0.3 → 3.0.5, `markitdown` 0.1.6 → 0.1.7, `tree-sitter` 0.25.2 → 0.26.0, and others). Not a response to a specific advisory — a routine refresh
- **Updated the in-house tools alongside the tag pinning above**: `add-line-numbers` 0.1.2 → 0.1.3, `md2map` 0.4.3 → 0.5.1, `code2map` 0.2.1 → 0.3.0. `add-line-numbers` v0.1.3 and `code2map` v0.3.0 change no implementation or output (a `cryptography` floor for development dependencies, and retirement of the `versions/` directory). `md2map` v0.5.0 adds OpenAI-compatible `base_url`, `reasoning_effort`, and concurrent per-section AI calls, but all of them are opt-in and the defaults are unchanged, so the behavior of this backend is unaffected; v0.5.1 is the tag-pinning release only

## [0.1.2] - 2026-06-17

### Security
- **[SECURITY] Bumped `starlette` from 1.0.1 to 1.3.1** to resolve Dependabot alerts [#121](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/121) / [#122](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/122) / [#123](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/123) / [#124](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/124) (`starlette < 1.3.1` and related). Also regenerated `uv.lock`.
- **[SECURITY] Bumped `idna` from 3.14 to 3.16** to resolve Dependabot alert [#66](https://github.com/elvezjp/spec-code-ai-mapper/security/dependabot/66) (GHSA-65pc-fj4g-8rjx, `idna < 3.15`).

### Changed
- **Raised the minimum Python version from 3.10 to 3.11** in `versions/v0.1.2/backend/pyproject.toml`. The latest `main` branches of dependencies (`add-line-numbers`, `md2map`, `code2map`) now require Python >=3.11, and `uv lock` no longer resolves on 3.10.

### Fixed
- Fixed the `/health` endpoint so it is registered before the frontend static file mount and returns a proper health-check response.

### Compatibility
- `versions/v0.1.1/` is preserved as a frozen snapshot. v0.1.2 is a copy of it with the changes above applied.

## [0.1.1] - 2026-05-11

### Changed
- **Updated excel2md subtree from v2.0 to v2.1.1**
  - Upstream: [elvezjp/excel2md PR #31](https://github.com/elvezjp/excel2md/pull/31)
  - Switched `_DEFAULT_EXCEL2MD_PATH` in `versions/v0.1.1/backend/app/markdown_tools/excel2md_tool.py` to `excel2md/v2.1.1`
  - Upstream fixes included:
    - Fixed duplicated footnote numbering across multiple tables (excel2md issue #25)
    - Fixed inconsistent return arity from `extract_table()` on truncation path (excel2md issue #24)
    - Restored backward-compatible re-exports of `is_code_block` / `build_code_block_from_rows` (excel2md issue #15)
    - Fixed sheet-scope footnote definitions being dropped in non-`--split-by-sheet` mode
    - Fixed missing `is_code_block` import in `mermaid_generator.py` (v2.0.1, excel2md issue #13)
    - Raised minimum Python version to 3.10 and applied pytest / Pygments security updates (v2.1.0)

### Documentation

- Bilingual OSS documentation at the repository root: added `README_ja.md`, `CHANGELOG_ja.md`, `CONTRIBUTING_ja.md`, and `SECURITY_ja.md`; refreshed English counterparts and cross-links for public release ([PR #12](https://github.com/elvezjp/spec-code-ai-mapper/pull/12)).

### Compatibility
- `versions/v0.1.0/` is preserved as a frozen snapshot. v0.1.1 is a copy of it with the changes above applied.

## [0.1.0] - 2026-02-13

Initial release. Created as a new tool specialized in design-document-to-code traceability management, based on [spec-code-ai-reviewer](https://github.com/elvezjp/spec-code-ai-reviewer).

### Added
- **Traceability Matrix Generation**: AI-driven automatic mapping between design document sections and code symbols, presented as a list.
- **Structure Matching**: Semantic splitting and structure-based matching using md2map / code2map.
- **Three Mapping Methods**: Standard (LLM), Strict (ID-based), and Detailed (content-aware) — selectable.
- **Result Export**: Traceability matrix output in Markdown format.
- **Spec / Code Conversion**: Excel → Markdown conversion (MarkItDown / excel2md), code → line-numbered text (add-line-numbers).
- **Semantic Splitting**: Splits large files into meaningful units so the AI can perform precise mapping within token limits.
- **Multi-LLM Provider Support**: Switchable execution across Bedrock / Anthropic / OpenAI.
- **Frontend**: A modern SPA built with Vite + React + TypeScript + Tailwind CSS.

---

## Links

- [Repository](https://github.com/elvezjp/spec-code-ai-mapper)
- [Issues](https://github.com/elvezjp/spec-code-ai-mapper/issues)
- [Base project](https://github.com/elvezjp/spec-code-ai-reviewer)

## Version Comparison

| Version | Highlights |
| ------- | ---------- |
| 0.1.2 | Bumped minimum Python to 3.11; updated `idna` to 3.16 (Dependabot #66 resolved); current security-supported release |
| 0.1.1 | excel2md subtree v2.1.1; bilingual root docs (README / CHANGELOG / CONTRIBUTING / SECURITY) |
| 0.1.0 | Initial MVP: traceability matrix, structure matching (`md2map` / `code2map`), three mapping modes, Markdown export, multi-LLM support, Vite + React frontend |
