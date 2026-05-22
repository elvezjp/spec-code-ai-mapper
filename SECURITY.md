# Security Policy

[English](./SECURITY.md) | [日本語](./SECURITY_ja.md)

## Supported Versions

We support the latest version:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.1   | :white_check_mark: |
| < 0.1.1 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in spec-code-ai-mapper, please follow the responsible disclosure process below:

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Send a detailed report to the maintainers via one of the following channels:
   - Open a GitHub private security advisory (recommended)
   - For lower-severity issues, open an issue with the "security" label

### What to Include

Please include the following information in your report:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity
- Proposed fix or mitigation
- Contact information (optional)

### Example Report

```
Subject: [SECURITY] Potential vulnerability in file upload handling

Description:
When a specially crafted Excel file is uploaded, the server side
may exhibit unexpected behavior.

Steps to reproduce:
1. Create an Excel file containing a malicious macro
2. Upload the file
3. Run the conversion process

Impact:
May cause excessive server resource consumption or denial of service.

Suggested fix:
Enforce stricter file-size and cell-count limits.
```

## Response Timeline

- **Initial response**: within 48 hours
- **Status updates**: within 7 days
- **Resolution** (depending on severity):
  - Critical: within 14 days
  - High: within 30 days
  - Medium: within 60 days
  - Low: next release cycle

## Security Considerations

### File Handling

spec-code-ai-mapper processes files that may contain:

- Excel files (macros, external links, embedded objects)
- Source code files (arbitrary text files)
- Configuration files (API keys, credentials)

**Recommendations:**

1. Only process files from trusted sources
2. Inspect files received from external sources before processing
3. Run inside a sandbox when processing untrusted files
4. Manage configuration files containing API keys / credentials carefully

### API Key Management

This application may use the following APIs:

- AWS Bedrock
- Anthropic API
- OpenAI API

**Recommendations:**

1. Manage API keys via environment variables; do not hard-code them
2. Follow the principle of least privilege — grant only the permissions required
3. Rotate API keys regularly
4. Use different API keys for production and development environments

### Input Validation

spec-code-ai-mapper includes the following security measures:

- Uses `read_only=True` mode when processing Excel files
- Enforces file-size limits
- Validates input files

### Output Security

Things to be aware of when using the generated review reports:

- Reports may contain the content of input files
- If the reviewed files contain confidential information, the report will as well
- Review report content before sharing

### Dependencies

This project uses the following major dependencies:

- `fastapi`: web framework
- `markitdown`: Excel → Markdown conversion
- `openpyxl`: Excel file processing
- `boto3`: AWS Bedrock integration
- `anthropic`: Anthropic API integration
- `openai`: OpenAI API integration

We monitor security advisories for these dependencies and update them as needed.

### Dependabot Alert Policy

This repository keeps past releases archived under `versions/`, which means Dependabot alerts are also raised against their lockfiles. In addition, `add-line-numbers/`, `code2map/`, `excel2md/`, `markitdown/`, and `md2map/` are pulled in via git subtree, and their dependencies are managed in the upstream repositories. Given this, we operate Dependabot alerts as follows.

**Malware tab**: Always fix, regardless of where it is detected.

**Vulnerable**: Follow the table below.

| Target | Action |
|--------|--------|
| The latest version under `versions/` | **Fix** (dependency update / PR) |
| Older versions archived under `versions/` | **Dismiss**. Review impact and close |
| git subtree directories (`add-line-numbers/`, `code2map/`, `excel2md/`, `markitdown/`, `md2map/`) | **Dismiss**. Used only in older versions; review impact and close |

A dismissed alert will not reappear for the same combination of manifest × package × CVE, but a new CVE published for the same package will be raised as a new alert.

## Security Best Practices

Recommendations when using spec-code-ai-mapper:

1. **Stay up to date**: always use the latest version
2. **Inspect input**: verify files before processing
3. **Sandbox processing**: use a container or VM for untrusted files
4. **Verify output**: review generated reports before use
5. **Restrict permissions**: run with the minimum required permissions
6. **Monitor dependencies**: keep dependent libraries up to date
7. **Protect credentials**: manage API keys securely

## Known Security Limitations

1. **Macro detection**: macros in Excel files are not executed, but their presence is not warned about
2. **External links**: external links inside Excel files are processed but not validated
3. **File size**: very large files may cause memory issues
4. **LLM output**: AI output is not always accurate. Human review is required for important decisions

## Security Updates

Security updates are released in the following form:

- Patch version for minor issues (e.g. 0.5.1)
- Minor version for significant issues (e.g. 0.6.0)
- Recorded in CHANGELOG.md with a `[SECURITY]` prefix

## Acknowledgments

We thank security researchers who report vulnerabilities responsibly. Reporters of valid security issues will be acknowledged in:

- CHANGELOG.md (unless anonymity is requested)
- The release notes for the fix

## Questions

For security-related questions that are not vulnerabilities, please contact us via:

- An issue with the "security" label
- The maintainers directly
