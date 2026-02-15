import { useCallback } from 'react'
import JSZip from 'jszip'
import type { MatchedGroup, MappingExecutionMeta, SystemPromptValues } from '../types'

interface MappingZipData {
  mappingResult: MatchedGroup[]
  executionMeta: MappingExecutionMeta
  reportText: string
  systemPrompt: SystemPromptValues
  specMarkdown: string
  codeWithLineNumbers: string
}

function buildTraceabilityMarkdown(groups: MatchedGroup[]): string {
  let md = '# Traceability Matrix\n\n'
  md += '| ID | Specification Section | Associated Code | Reason |\n'
  md += '|---|---|---|---|\n'

  groups.forEach((group) => {
    const specSections = group.docSections
      .map((ds) => `${ds.id}: ${ds.title}`)
      .join('<br>')
    const codeSymbols = group.codeSymbols
      .map((cs) => `${cs.filename} (${cs.symbol})`)
      .join('<br>')
    md += `| ${group.groupId} | ${specSections} | ${codeSymbols} | ${group.reason} |\n`
  })

  return md
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildTraceabilityCSV(groups: MatchedGroup[]): string {
  const header = 'ID,Specification Section,Associated Code,Reason'
  const rows = groups.map((group) => {
    const specSections = group.docSections
      .map((ds) => `${ds.id}: ${ds.title}`)
      .join('; ')
    const codeSymbols = group.codeSymbols
      .map((cs) => `${cs.filename}::${cs.symbol}`)
      .join('; ')
    return [group.groupId, specSections, codeSymbols, group.reason]
      .map(escapeCSV)
      .join(',')
  })
  return [header, ...rows].join('\n')
}

function buildReadme(meta: MappingExecutionMeta): string {
  return `# マッピング実行データ

## 実行情報

- バージョン: ${meta.version}
- モデルID: ${meta.modelId}
- 実行日時: ${meta.executedAt}
- マッピングポリシー: ${meta.mappingPolicy}
- グループ数: ${meta.totalGroups}
${meta.inputTokens !== undefined ? `- 入力トークン: ${meta.inputTokens.toLocaleString()}` : ''}
${meta.outputTokens !== undefined ? `- 出力トークン: ${meta.outputTokens.toLocaleString()}` : ''}

## 同梱ファイル

| ファイル名 | 説明 |
|---|---|
| README.md | 本ファイル |
| system-prompt.md | システムプロンプト（役割・目的・出力形式・注意事項） |
| spec-markdown.md | 変換後の設計書（マークダウン形式） |
| code-numbered.txt | 行番号付きプログラム |
| traceability-matrix.md | マッピング結果（Traceability Matrix） |
| mapping-result.csv | マッピング結果一覧（CSV形式） |
| mapping-report.md | AIの出力レポート全文 |
`
}

function buildSystemPromptMarkdown(prompt: SystemPromptValues): string {
  return `# システムプロンプト

## 役割
${prompt.role}

## 目的
${prompt.purpose}

## 出力形式
${prompt.format}

## 注意事項
${prompt.notes}
`
}

interface UseZipExportReturn {
  downloadSpecMarkdown: (markdown: string) => void
  downloadCodeWithLineNumbers: (code: string) => void
  downloadMappingCSV: (groups: MatchedGroup[]) => void
  downloadMappingZip: (data: MappingZipData) => Promise<void>
}

export function useZipExport(): UseZipExportReturn {
  const downloadSpecMarkdown = useCallback((markdown: string) => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spec-markdown.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadCodeWithLineNumbers = useCallback((code: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'code-numbered.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadMappingCSV = useCallback((groups: MatchedGroup[]) => {
    const csv = buildTraceabilityCSV(groups)
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mapping-result.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadMappingZip = useCallback(async (data: MappingZipData) => {
    const zip = new JSZip()

    zip.file('README.md', buildReadme(data.executionMeta))
    zip.file('system-prompt.md', buildSystemPromptMarkdown(data.systemPrompt))
    zip.file('spec-markdown.md', data.specMarkdown)
    zip.file('code-numbered.txt', data.codeWithLineNumbers)
    zip.file('traceability-matrix.md', buildTraceabilityMarkdown(data.mappingResult))
    zip.file('mapping-result.csv', '\uFEFF' + buildTraceabilityCSV(data.mappingResult))
    zip.file('mapping-report.md', data.reportText)

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mapping-${data.executionMeta.executedAt.replace(/[: ]/g, '-')}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    downloadSpecMarkdown,
    downloadCodeWithLineNumbers,
    downloadMappingCSV,
    downloadMappingZip,
  }
}
