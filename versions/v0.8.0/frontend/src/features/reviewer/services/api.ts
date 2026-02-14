// API service for reviewer feature

import type {
  ConversionTool,
  OrganizeMarkdownRequest,
  OrganizeMarkdownResponse,
  SplitMarkdownRequest,
  SplitMarkdownResponse,
  SplitCodeRequest,
  SplitCodeResponse,
  StructureMatchingRequest,
  StructureMatchingResponse,
} from '../types'

const getBackendUrl = (): string => {
  return ''
}

export async function fetchAvailableTools(): Promise<ConversionTool[]> {
  try {
    const response = await fetch(`${getBackendUrl()}/api/convert/available-tools`)
    const result = await response.json()
    return result.tools || []
  } catch {
    // Fallback to default tools
    return [
      { name: 'markitdown', display_name: 'MarkItDown' },
      { name: 'excel2md', display_name: 'excel2md' },
    ]
  }
}

export async function convertExcelToMarkdown(
  file: File,
  tool: string
): Promise<{ success: boolean; markdown?: string; error?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tool', tool)

  const response = await fetch(`${getBackendUrl()}/api/convert/excel-to-markdown`, {
    method: 'POST',
    body: formData,
  })

  return await response.json()
}

export async function addLineNumbers(
  file: File
): Promise<{ success: boolean; content?: string; error?: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${getBackendUrl()}/api/convert/add-line-numbers`, {
    method: 'POST',
    body: formData,
  })

  return await response.json()
}

export interface TestConnectionRequest {
  provider?: string
  model?: string
  apiKey?: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
}

export interface TestConnectionResponse {
  status: 'connected' | 'error'
  provider?: string
  model?: string
  error?: string
}

export async function testLlmConnection(
  config?: TestConnectionRequest
): Promise<TestConnectionResponse> {
  const response = await fetch(`${getBackendUrl()}/api/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config || {}),
  })

  return await response.json()
}

export async function organizeMarkdown(
  request: OrganizeMarkdownRequest
): Promise<OrganizeMarkdownResponse> {
  const response = await fetch(`${getBackendUrl()}/api/organize-markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return await response.json()
}

// =============================================================================
// Split API (v0.8.0)
// =============================================================================

export async function splitMarkdown(
  request: SplitMarkdownRequest
): Promise<SplitMarkdownResponse> {
  const response = await fetch(`${getBackendUrl()}/api/split/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return await response.json()
}

export async function splitCode(
  request: SplitCodeRequest
): Promise<SplitCodeResponse> {
  const response = await fetch(`${getBackendUrl()}/api/split/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return await response.json()
}

// =============================================================================
// Structure Matching API (v0.8.0)
// =============================================================================

export async function executeStructureMatching(
  request: StructureMatchingRequest
): Promise<StructureMatchingResponse> {
  const response = await fetch(`${getBackendUrl()}/api/review/structure-matching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return await response.json()
}
