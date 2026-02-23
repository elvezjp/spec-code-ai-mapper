# spec-code-ai-mapper

[English](./README.md) | [日本語](./README_ja.md)

[![Elvez](https://img.shields.io/badge/Elvez-Product-3F61A7?style=flat-square)](https://elvez.co.jp/)
[![IXV Ecosystem](https://img.shields.io/badge/IXV-Ecosystem-3F61A7?style=flat-square)](https://elvez.co.jp/ixv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
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

- Python 3.10+
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
cd versions/v0.1.0/backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd versions/v0.1.0/frontend
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
├── versions/                    # Version storage
│   └── v0.1.0/                  # Latest version
│       ├── backend/             # Python / FastAPI
│       ├── frontend/            # Vite + React + TypeScript
│       └── spec.md              # Specification document
│
├── docs/                        # Documentation
│   └── structure-matching.md    # Structure matching details
│
├── add-line-numbers/            # Subtree (elvezjp)
├── code2map/                    # Subtree (elvezjp)
├── excel2md/                    # Subtree (elvezjp)
├── markitdown/                  # Subtree (Microsoft)
├── md2map/                      # Subtree (elvezjp)
└── README.md                    # This file
```

## Documentation

- [CHANGELOG.md](CHANGELOG.md) - Changelog
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](SECURITY.md) - Security policy
- [Structure Matching Details](docs/structure-matching.md) - AI mapping and structure matching technical details

## Security

For details, see [SECURITY.md](SECURITY.md).

- Security measures for file processing (Excel files opened in `read_only=True` mode, file size limits, etc.)
- API keys should be managed via environment variables, not hardcoded
- Only process files from trusted sources

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- Bug reports and feature requests are accepted via GitHub Issues
- Pull requests should target the `main` branch
- Follow the existing codebase's coding style

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details.

## Background

This tool was created as a small utility during the development of **IXV (Ixiv)**, a development support AI for Japanese development documents and specifications.

IXV addresses the challenges of understanding, structuring, and utilizing Japanese documents in system development. This repository publishes a portion of that work.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contact

- **Email**: <info@elvez.co.jp>
- **To**: Elvez Co., Ltd.

## Related Projects

This repository includes the following external repositories added via git subtree.

| Directory | Repository | Description |
|-----------|-----------|-------------|
| `add-line-numbers/` | https://github.com/elvezjp/add-line-numbers | Tool to add line numbers to files |
| `code2map/` | https://github.com/elvezjp/code2map | Source code to mind map conversion tool |
| `excel2md/` | https://github.com/elvezjp/excel2md | Excel to CSV Markdown conversion tool |
| `markitdown/` | https://github.com/microsoft/markitdown | Convert various file formats to Markdown |
| `md2map/` | https://github.com/elvezjp/md2map | Markdown to mind map conversion tool |
