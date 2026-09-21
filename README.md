# spec-code-ai-mapper

[English](./README.md) | [日本語](./README_ja.md)

[![Elvez](https://img.shields.io/badge/Elvez-Product-3F61A7?style=flat-square)](https://elvez.co.jp/)
[![IXV Ecosystem](https://img.shields.io/badge/IXV-Ecosystem-3F61A7?style=flat-square)](https://elvez.co.jp/ixv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stars](https://img.shields.io/github/stars/elvezjp/spec-code-ai-mapper?style=social)](https://github.com/elvezjp/spec-code-ai-mapper/stargazers)

A web application that uses AI to map design documents (Excel/Markdown) to program code, visualizing and managing "traceability" within your source code.

AI Mapper is a tool that automatically maps sections of design documents (Markdown/Excel) to classes or methods in source code (Java/Python) using AI. In large-scale development projects, it helps you instantly understand whether specifications are correctly implemented in code and which design sections are affected by a change.

https://github.com/user-attachments/assets/48b9c0a0-3739-4486-8c4f-ac467c5b91e7

## Features

- **Traceability Matrix Generation**: Displays a list of mappings between design sections and code symbols, with AI explaining the reasoning.
- **Markdown Export**: Export mapping results as a Markdown table, ready for project traceability documentation.
- **Spec & Code Conversion**:
  - Excel (.xlsx, .xls) to Markdown conversion (powered by MarkItDown).
  - Program code to line-numbered text (powered by add-line-numbers).
- **Semantic Splitting (`md2map` / `code2map`)**:
  - Splits large files into meaningful units (e.g., chapters or functions) for precise mapping within LLM token limits.
- **AI Review**: Automatically checks for inconsistencies between design and implementation based on mapping results.

### High-Precision Mapping via Structure Matching ([Details](docs/structure-matching.md))

Instead of simple line-based splitting, it analyzes the chapter structure of design documents and the AST (Abstract Syntax Tree) of code to split and match them accurately.

1. **Structure Extraction**: `md2map` and `code2map` create metadata (INDEX / MAP) for each.
2. **AI Matching**: AI analyzes INDEX and MAP to identify optimal many-to-many mappings.
3. **Result Output**: Displays mapping results and reasoning as a Traceability Matrix.

#### Mapping Methods

Three mapping methods are available depending on your needs. The system prompt sent to the AI changes based on the selected method.

| Method | Description |
|--------|-------------|
| **Standard (LLM)** | LLM analyzes context and flexibly associates sections with code. |
| **Strict (ID-based)** | Prioritizes matching by ID and symbol name. Suitable when traceability is well-defined. |
| **Detailed (Content-aware)** | Increases accuracy by partially referencing section content. |

#### Output Format

Mapping results are output as a **group-based** Traceability Matrix, where related design sections and code symbols are grouped together. A single group may contain multiple design sections and multiple code symbols.

| Field | Description |
|-------|-------------|
| **Group ID** | Group identifier (group1, group2, ...) |
| **Specification Section** | Section IDs and titles belonging to the group |
| **Associated Code** | Filenames and symbol names belonging to the group |
| **Reason** | AI-generated rationale for the grouping |

Results can be exported in Markdown format.

## Use Cases

- **Design-Code Traceability**: AI automatically maps which design document sections correspond to which parts of the code, providing full visibility.
- **Impact Analysis**: Identify affected design sections when code changes are made. Prevent missed updates in design documents.
- **Quality Management**: Manage design-implementation consistency with AI, detecting divergence early.
- **AI/LLM Integration**: Semantically split design documents and code into AI-friendly formats for processing.

## System Architecture

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Python / FastAPI
  - `MarkItDown` / `excel2md` (Excel to Markdown)
  - `javalang` / `ast` (Code analysis)
  - `Bedrock` / `Anthropic` / `OpenAI` (AI Engines)

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) package manager
- AWS account (with Bedrock access) or Anthropic/OpenAI API key

### Installation

```bash
git clone git@github.com:elvezjp/spec-code-ai-mapper.git
cd spec-code-ai-mapper
```

### Quick Start

**Backend**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.

## Usage

1. **Prepare Files**:
   - Upload your design document (Excel) and click "Convert to Markdown".
   - Upload your program (source code) and click "Convert with add-line-numbers".
2. **Split Settings**:
   - Design documents: Choose bulk or split (heading level H2/H3/H4).
   - Program code: Choose bulk or split.
   - Preview the split results before proceeding.
3. **Select Mapping Method**:
   - Choose from Standard / Strict / Detailed. The system prompt sent to the AI changes based on the selected method.
4. **Run AI Mapping**:
   - Click **"AI Mapper"** in the header to navigate to the Mapper screen.
   - Click "Run Re-matching" to start the AI mapping process.
5. **View & Export**:
   - Review the generated Traceability Matrix.
   - Download a ZIP archive containing all input/output data (system prompt, design document MD, code, results).

## Directory Structure

```text
spec-code-ai-mapper/
├── backend/                     # Python / FastAPI
├── frontend/                    # Vite + React + TypeScript
│
├── docs/                        # Documentation
│   ├── spec.md                  # Specification document
│   ├── config-file-generator-spec.md  # Config file generator specification
│   └── structure-matching.md    # Structure matching details
│
├── .env.example                 # Sample environment variables for the system LLM (AWS Bedrock)
└── README.md                    # This file
```

## Version Management

Only the latest code is kept at the repository root. Versions are managed with git tags.

- The `main` branch accumulates changes for the next version under a `## [X.Y.Z] - Unreleased` heading in [CHANGELOG.md](CHANGELOG.md)
- On release, the heading date is finalized, the version in `backend/pyproject.toml` (and the frontend version labels) is confirmed, and a `vX.Y.Z` tag is created

### Using Old Versions

Old versions (v0.1.0–v0.1.2) were previously kept as snapshots under a `versions/` directory. That layout, including the external-tool directories embedded via git subtree, is preserved in the `v0.1.2` tag:

```bash
git checkout v0.1.2
# Old versions are under versions/v0.1.0 ... versions/v0.1.2
```

**Note**:

- The code under the `v0.1.2` tag is a frozen snapshot and does not include the security fixes made in v0.2.0 and later (path traversal, CORS configuration, and others — see [CHANGELOG.md](CHANGELOG.md)). Use it for reference and verification only, and use the latest version for actual use
- Do not delete or move the `v0.1.2` tag — it serves as the archive reference point for the old layout

## Documentation

- [CHANGELOG.md](CHANGELOG.md) - Changelog
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](SECURITY.md) - Security policy
- [Specification](docs/spec.md) - Detailed specification (Japanese)
- [Structure Matching Details](docs/structure-matching.md) - AI mapping and structure matching technical details

## Security

For details, see [SECURITY.md](SECURITY.md).

- Security measures for file processing (Excel files opened in `read_only=True` mode, file size limits, etc.)
- API keys should be managed via environment variables, not hardcoded
- Only process files from trusted sources

### Dependabot Alert Policy

This repository keeps only the latest code at the root (`backend/` / `frontend/`) and old versions are referenced via git tags, so old versions are not scanned by Dependabot. The external tools (`add-line-numbers`, `code2map`, `excel2md`, `markitdown`, `md2map`) are installed as uv dependencies, so their vulnerabilities are detected through the root lockfiles. Given this, we operate Dependabot alerts as follows.

#### Malware tab

- **Always fix**

#### Vulnerable tab

| Target | Action |
|--------|--------|
| Root lockfiles (`backend/uv.lock`, `frontend/package-lock.json`) | **Fix** (dependency update / PR) |

A dismissed alert will not reappear for the same combination of manifest × package × CVE, but a new CVE published for the same package will be raised as a new alert.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- Bug reports and feature requests are accepted via GitHub Issues
- Pull requests should target the `main` branch
- Follow the existing codebase's coding style

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details.

## Background

This tool was created as a small utility during the development of **IXV (Ixiv)**, an AI development ecosystem designed for Japanese engineering teams.

IXV delivers a methodology and OSS that put AI to practical use in real development workflows. This repository publishes a portion of that work.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contact

- **Email**: <info@elvez.co.jp>
- **To**: Elvez Co., Ltd.

## Related Projects

The following external tools are used as dependencies (installed via uv from PyPI or git sources — see `backend/pyproject.toml`).

| Package | Repository | Description |
|---------|-----------|-------------|
| add-line-numbers | https://github.com/elvezjp/add-line-numbers | Tool to add line numbers to files |
| code2map | https://github.com/elvezjp/code2map | Source code to mind map conversion tool |
| excel2md | https://github.com/elvezjp/excel2md | Excel to CSV Markdown conversion tool |
| markitdown | https://github.com/microsoft/markitdown | Convert various file formats to Markdown |
| md2map | https://github.com/elvezjp/md2map | Markdown to mind map conversion tool |

If you need the sources for reference, clone the upstream repositories directly (e.g., `git clone https://github.com/elvezjp/excel2md.git`). These repositories were previously embedded as git subtrees; that layout is preserved in the `v0.1.2` tag.
