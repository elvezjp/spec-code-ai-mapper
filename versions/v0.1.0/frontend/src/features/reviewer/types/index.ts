// Reviewer feature types

export interface DesignFile {
  file: File
  filename: string
  isMain: boolean
  type: string
  tool: string
  markdown?: string
  note?: string
}

export interface CodeFile {
  file: File
  filename: string
  contentWithLineNumbers?: string
}

export interface ConversionTool {
  name: string
  display_name: string
}

export interface SystemPromptValues {
  role: string
  purpose: string
  format: string
  notes: string
}

export interface LlmConfig {
  provider: 'anthropic' | 'openai' | 'bedrock'
  model: string
  maxTokens: number
  apiKey?: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
}

export interface MarkdownSourceInfo {
  filename: string
  tool: string
}

export interface OrganizeMarkdownRequest {
  markdown: string
  policy: string
  source?: MarkdownSourceInfo
  llmConfig?: LlmConfig
}

export interface OrganizeMarkdownWarning {
  code: string
  message: string
}

export interface OrganizeMarkdownResponse {
  success: boolean
  organizedMarkdown?: string
  warnings?: OrganizeMarkdownWarning[]
  error?: string
  errorCode?: string
}

// =============================================================================
// Split Types (v0.8.0)
// =============================================================================

export interface SplitSettings {
  documentMaxDepth: number // 1-6
  mappingPolicy: string // standard, strict, detailed
}

export interface DocumentPart {
  id: string
  section: string
  level: number
  path: string
  startLine: number
  endLine: number
  content: string
  estimatedTokens: number
}

export interface CodePart {
  id: string
  symbol: string
  symbolType: string // class, method, function
  parentSymbol: string | null
  startLine: number
  endLine: number
  content: string
  estimatedTokens: number
}

export interface SplitMarkdownRequest {
  content: string
  filename: string
  maxDepth: number
}

export interface SplitMarkdownResponse {
  success: boolean
  parts: DocumentPart[]
  indexContent?: string
  error?: string
}

export interface SplitCodeRequest {
  content: string
  filename: string
}

export interface SplitCodeResponse {
  success: boolean
  parts: CodePart[]
  indexContent?: string
  language?: string
  error?: string
}

export interface SplitPreviewResult {
  documentParts: DocumentPart[] | null
  codeParts: CodePart[] | null
  documentIndex: string | null
  codeIndex: string | null
  codeLanguage: string | null
}

// =============================================================================
// Structure Matching Types
// =============================================================================

export interface DocumentStructure {
  indexMd: string
  mapJson: Record<string, unknown>
}

export interface CodeFileStructure {
  filename: string
  indexMd: string
  mapJson: Record<string, unknown>
}

export interface StructureMatchingRequest {
  document: DocumentStructure
  codeFiles: CodeFileStructure[]
  mappingPolicy?: string // standard, strict, detailed
  systemPrompt?: SystemPromptValues // ユーザー指定のシステムプロンプト
  llmConfig?: LlmConfig
}

export interface MatchedDocSection {
  id: string
  title: string
  path: string
}

export interface MatchedCodeSymbol {
  id: string
  filename: string
  symbol: string
}

export interface MatchedGroup {
  groupId: string
  groupName: string
  docSections: MatchedDocSection[]
  codeSymbols: MatchedCodeSymbol[]
  reason: string
  estimatedTokens: number
}

export interface ReviewMeta {
  version: string
  modelId: string
  provider?: string
  executedAt: string
  designs: { filename: string; role: string; isMain: boolean; type: string; tool: string }[]
  programs: { filename: string }[]
  inputTokens: number
  outputTokens: number
}

export interface StructureMatchingResponse {
  success: boolean
  groups: MatchedGroup[]
  totalGroups: number
  tokensUsed?: { input: number; output: number }
  reviewMeta?: ReviewMeta
  error?: string
}

// =============================================================================
// Code Line Map (コードシンボルID → 行範囲)
// =============================================================================

export type CodeLineMap = Map<string, { startLine: number; endLine: number }>

// =============================================================================
// Mapping Execution Meta
// =============================================================================

export interface MappingExecutionMeta {
  version: string
  modelId: string
  executedAt: string
  inputTokens?: number
  outputTokens?: number
  designs: { filename: string; role?: string; type?: string; tool?: string }[]
  programs: { filename: string }[]
  mappingPolicy: string
  totalGroups: number
}
