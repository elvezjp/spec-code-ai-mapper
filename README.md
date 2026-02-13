# spec-code-ai-mapper

[English](./README.md) | [日本語](./README_ja.md)

[![Elvez](https://img.shields.io/badge/Elvez-Product-3F61A7?style=flat-square)](https://elvez.co.jp/)
[![IXV Ecosystem](https://img.shields.io/badge/IXV-Ecosystem-3F61A7?style=flat-square)](https://elvez.co.jp/ixv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stars](https://img.shields.io/github/stars/elvezjp/spec-code-ai-mapper?style=social)](https://github.com/elvezjp/spec-code-ai-mapper/stargazers)

A web application that uses AI to map design documents (Excel/Markdown) to program code, visualizing and managing "traceability" within your source code.

<https://github.com/user-attachments/assets/78926022-1498-4d9a-923c-cdf3a9f06534>

## What is AI Mapper?

AI Mapper is a tool that automatically maps sections of design documents (Markdown/Excel) to classes or methods in source code (Java/Python) using AI. In large-scale development projects, it helps you instantly understand whether specifications are correctly implemented in code and which design sections are affected by a change.

## Key Features

- **Traceability Matrix Generation**: Displays a list of mappings between design sections and code symbols, with AI explaining the reasoning.
- **Markdown Export**: Export mapping results as a Markdown table, ready for project traceability documentation.
- **Spec & Code Conversion**:
  - Excel (.xlsx, .xls) to Markdown conversion (powered by MarkItDown).
  - Program code to line-numbered text (powered by add-line-numbers).
- **Semantic Splitting (`md2map` / `code2map`)**:
  - Splits large files into meaningful units (e.g., chapters or functions) for precise mapping within LLM token limits.
- **AI Review**: Automatically checks for inconsistencies between design and implementation based on mapping results.

### High-Precision Mapping via Structure Matching ([Details](docs/split-review.md))

Instead of simple line-based splitting, it analyzes the chapter structure of design documents and the AST (Abstract Syntax Tree) of code to split and match them accurately.

1. **Structure Extraction**: `md2map` and `code2map` create metadata (INDEX) for each.
2. **AI Matching**: AI analyzes the INDEX to identify optimal many-to-many mappings.
3. **Detailed Analysis**: AI compares and verifies the actual content of the mapped sections.

## Usage

1. **Prepare Files**:
   - Upload your design document (Excel) and click "Convert to Markdown".
   - Upload your program (source code) and click "Convert with add-line-numbers".
2. **Split Settings**:
   - In "Split Settings", choose units for AI analysis (you can check the preview).
3. **Run AI Mapping**:
   - Click **"AI Mapper"** in the header to navigate to the Mapper screen.
   - Click "Run Re-matching" to start the AI mapping process.
4. **View & Export**:
   - Review the generated Traceability Matrix.
   - Click "Export to Markdown" to download the traceability document.

## System Architecture (v0.8.0)

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Python / FastAPI
  - `MarkItDown` / `excel2md` (Excel to Markdown)
  - `javalang` / `ast` (Code analysis)
  - `Bedrock` / `Anthropic` / `OpenAI` (AI Engines)

## Setup

### Installation

```bash
git clone git@github.com:elvezjp/spec-code-ai-mapper.git
cd spec-code-ai-mapper
```

### Quick Start (v0.8.0)

**Backend**

```bash
cd versions/v0.8.0/backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd versions/v0.8.0/frontend
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.

---

## Background

This tool was developed as part of **IXV (Ikushibu)**, an AI support system for Japanese development documents. It aims to prevent divergence between design and code, streamlining quality management through AI.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contact

- **Email**: <info@elvez.co.jp>
- **To**: Elvez Co., Ltd.
