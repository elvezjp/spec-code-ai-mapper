# Contributing to spec-code-ai-mapper

[English](./CONTRIBUTING.md) | [日本語](./CONTRIBUTING_ja.md)

This document describes guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open a GitHub issue with the following information:

- A clear, descriptive title
- Steps to reproduce the problem
- Expected behavior
- Actual behavior
- A sample file (if possible)
- Python version (for backend-related issues)
- Node.js version (for frontend-related issues)
- Operating system

### Suggesting Enhancements

Enhancement proposals are welcome. Please open an issue with:

- A clear, descriptive title
- A detailed description of the proposed feature
- Use cases and benefits
- Related examples or mockups

### Pull Requests

1. **Fork the repository** and create a branch from `main` (format: `username/YYYYMMDD-description`)
   ```bash
   git checkout -b user/20260105-fix-feature
   ```

2. **Follow the existing coding style** of the codebase
   - Use meaningful variable and function names
   - Add comments to complex logic
   - Follow PEP 8 style guidelines

3. **Write tests** for your changes
   ```bash
   # Run backend tests
   cd versions/v0.1.1/backend
   uv run pytest tests/ -v

   # Run backend tests with coverage
   uv run pytest tests/ --cov=app --cov-report=html

   # Run frontend tests
   cd versions/v0.1.1/frontend
   npm run test:run

   # Run frontend tests with coverage
   npm run test:coverage
   ```

4. **Update documentation** as needed
   - Update README.md for user-facing changes
   - Update spec.md for specification changes
   - Add examples when introducing new features

5. **Commit your changes** with a clear commit message
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

6. **Push to your fork** and open a pull request
   ```bash
   git push origin user/20260105-fix-feature
   ```

7. **Wait for review** — maintainers will review the PR and may request changes

## Development Setup

### Prerequisites

- Python 3.10 or later
- Node.js 18 or later
- The [uv](https://docs.astral.sh/uv/) package manager
- An AWS account (with Bedrock access) or an Anthropic / OpenAI API key

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/spec-code-ai-mapper.git
cd spec-code-ai-mapper

# Install backend dependencies
cd versions/v0.1.1/backend
uv sync

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Tests

```bash
# Backend: run all tests
cd versions/v0.1.1/backend
uv run pytest tests/ -v

# Backend: run a specific test file
uv run pytest tests/test_convert.py -v

# Backend: run with coverage
uv run pytest tests/ --cov=app --cov-report=html

# Frontend: run all tests
cd versions/v0.1.1/frontend
npm run test:run

# Frontend: run tests in watch mode
npm run test

# Frontend: run with coverage
npm run test:coverage
```

### Testing Your Changes

Before submitting a PR, please confirm:

1. All existing tests pass
2. New tests are added for new features
3. Code coverage is maintained or improved
4. The application works correctly with a variety of files

## Coding Guidelines

### Python Style (Backend)

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Maximum line length: 100 characters (relaxed for long strings)
- Use meaningful variable names

### TypeScript / React Style (Frontend)

- Follow the ESLint configuration (verify with `npm run lint`)
- Use TypeScript strict mode
- Write components as function components
- Style with Tailwind CSS
- Use meaningful component and variable names

### Documentation

- Add docstrings / JSDoc to all public functions and classes
- Use clear, concise language
- Include examples in docstrings when helpful

### Commit Messages

- Use the present tense ("Add feature", not "Added feature")
- Use the imperative mood ("Move cursor to...", not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference related issues and pull requests where applicable

Example:
```
Add multi-provider LLM support

- Add Anthropic API integration
- Add OpenAI API integration
- Update configuration file format

Closes #123
```

## Version Management

When contributing, please:
- Focus on the latest version
- Maintain backward compatibility where possible
- Clearly document breaking changes

## Code Review Process

1. Maintainers will review your pull request
2. They may request changes or ask questions
3. Once approved, the PR will be merged
4. Contributions are acknowledged in the release notes

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others where you can
- Follow the code of conduct

## Questions

If you have questions about contributing, feel free to:
- Open an issue with the "question" label
- Contact the maintainers
