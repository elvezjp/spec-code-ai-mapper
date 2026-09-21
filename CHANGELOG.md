# Changelog

[English](./CHANGELOG.md) | [日本語](./CHANGELOG_ja.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-21

This release retires the `versions/` directory in favor of a layout that keeps only the latest code at the repository root, together with security fixes and dependency updates.

### Security
- **Fixed a path traversal in unauthenticated APIs that allowed arbitrary file writes** (GHSA-f63v-8r92-h4r7): `POST /api/split/markdown`, `POST /api/split/code`, and `POST /api/convert/excel-to-markdown` joined the client-supplied filename directly into a temporary directory path, so absolute paths or `../` sequences could create or overwrite files outside it. Filenames are now sanitized with `safe_filename()`, which strips directory components, with regression tests
- **[BREAKING] Changed the CORS default from allow-all (`*`) to local development origins only** (#25, #36): When `CORS_ORIGINS` is unset or blank, only `http://localhost:5173` / `http://127.0.0.1:5173` / `http://localhost:4173` / `http://127.0.0.1:4173` are allowed. Credentials (`allow_credentials`) are never allowed when the setting contains `*`, including mixed values such as `*,https://app.example.com`. Previously the allow-all default combined with `allow_credentials=True` made Starlette echo the requesting Origin, so any site could read responses containing the code and design documents under review. **Note:** the frontend calls the API from the same origin, so typical setups are unaffected; if you call the API from a different origin, set `CORS_ORIGINS` explicitly
- **Pinned git dependencies to release tags instead of a mutable branch** (#27, CWE-829): `add-line-numbers` / `md2map` / `code2map` now reference the tags `v0.1.3` / `v0.5.1` / `v0.3.0` instead of `branch = "main"`, and version floors were declared. This moves the tools from 0.1.2 → 0.1.3, 0.4.3 → 0.5.1, and 0.2.1 → 0.3.0; the new `md2map` features (OpenAI-compatible `base_url`, `reasoning_effort`, concurrent AI calls) are all opt-in, so the behavior of this backend is unaffected
- **Documented that the tool is intended for local use** (#36): The tool has no authentication or authorization, so README / SECURITY gained an "Intended environment" section and the launch examples now use `--host 127.0.0.1`. SECURITY now supports the latest version only, and vulnerability reports go through private channels only (GitHub private vulnerability reporting or email)
- **Updated frontend dependencies to address known vulnerabilities**: `react-router-dom` 7.17.0 → 7.18.2 (XSS, route-matching DoS, constructor injection; #24), `vitest` 4.1.9 → 4.1.11 (GHSA-82fw-gwwq-j7x9), `browserslist` 4.28.2 → 4.28.9 (GHSA-73wf-gq98-2v4g), `js-yaml` 4.2.0 → 4.3.2 (GHSA-5p4m-2wfm-xmqj and others), `brace-expansion` → 1.1.16 / 5.0.8, `postcss` 8.5.15 → 8.5.24 (GHSA-r28c-9q8g-f849). GHSA-qwww-vcr4-c8h2 (CSRF in `react-router` RSC mode) was dismissed: the affected feature is not used and no 7.x fix exists

### Changed
- **[BREAKING] Retired the `versions/` directory and moved to a layout that keeps only the latest code at the repository root** (#16): `backend` and `frontend` under `versions/v0.1.2/` moved to the root, the specifications moved to `docs/`, and the snapshots of old versions (v0.1.0 / v0.1.1) were removed. This ends the duplicate Dependabot alerts against the lockfiles of old versions. The old layout is preserved under the `v0.1.2` tag and can be inspected with `git checkout v0.1.2` (the code under that tag does not include this release's security fixes). Going forward, a `vX.Y.Z` tag is created at release time
- **[BREAKING] Migrated `excel2md` from `sys.path` injection of an in-tree copy to a PyPI dependency** (#20): `excel2md>=2.2.1` was added as a dependency (v2.1.1 → v2.3.0). The `EXCEL2MD_PATH` environment variable has been removed. One difference in conversion output: **links to images placed outside the print area (or the used range when no print area is set) are no longer emitted into the CSV Markdown** (upstream v2.2.1 fix [excel2md#14](https://github.com/elvezjp/excel2md/issues/14)). All other sheets and Mermaid output were verified to match before and after the migration
- **Updated the documentation for the single-version layout and git-tag based releases** (#16, #20, #35): The steps in README / CONTRIBUTING now use the root layout, README gained a "Version Management" section, and "Related Projects" now describes the tools as uv dependencies. The Dependabot alert policy now covers the root lockfiles only. `docs/spec.md` lost the "version-switching UI" chapter and the related E2E test items, and the frontend section of `docs/structure-matching.md` was rewritten to match the implementation
- **Updated the backend dependencies**: `uv lock --upgrade` updated 31 packages (`anthropic` 0.121.0, `openai` 2.53.0, `fastapi` 0.141.1, `starlette` 1.6.0, `uvicorn` 0.52.1, and others). Not a response to a specific advisory — a routine refresh
- **Aligned the Node.js requirement with the dependencies** (#36): 20.19+ (20.x) / 22.12+ (22.x) / 24+. The frontend CI Node.js matrix also changed from `["20", "23"]` to `["20", "24"]`

### Removed
- **[BREAKING] Retired the version-switching UI** (#16): Removed the version button and balloon at the top left of the screen (`VersionSelector` / `useVersions`) together with the reads and writes of the `app_version` cookie. This repository has no infrastructure that routes to a per-version backend/frontend, so the feature never did anything. The running version is still shown in the settings modal as before
- **[BREAKING] Removed the five external-tool directories that were embedded via git subtree** (#16, #20): `add-line-numbers/`, `code2map/`, `excel2md/`, `markitdown/`, and `md2map/`. All are installed from PyPI or as git dependencies pinned to upstream release tags, and nothing referenced the embedded copies. The dependency manifests in the repository went from 33 files to 4. To read the sources, clone the upstream repositories

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
| 0.2.0 | Retired `versions/` and moved to a root layout; excel2md migrated to PyPI; version-switching UI removed; security fixes (path traversal in unauthenticated APIs, CORS default restricted to local origins, git dependencies pinned to tags); current security-supported release |
| 0.1.2 | Bumped minimum Python to 3.11; updated `idna` to 3.16 (Dependabot #66 resolved) |
| 0.1.1 | excel2md subtree v2.1.1; bilingual root docs (README / CHANGELOG / CONTRIBUTING / SECURITY) |
| 0.1.0 | Initial MVP: traceability matrix, structure matching (`md2map` / `code2map`), three mapping modes, Markdown export, multi-LLM support, Vite + React frontend |
