# Changelog

[English](./CHANGELOG.md) | [日本語](./CHANGELOG_ja.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-05-22

### Security
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
