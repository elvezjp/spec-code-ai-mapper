import { useCallback } from 'react'
import JSZip from 'jszip'
import type { MatchedGroup, MappingExecutionMeta, SystemPromptValues, CodeLineMap } from '../types'

interface MappingZipData {
  mappingResult: MatchedGroup[]
  executionMeta: MappingExecutionMeta
  reportText: string
  systemPrompt: SystemPromptValues
  specMarkdown: string
  codeWithLineNumbers: string
  codeLineMap: CodeLineMap
  splitData?: {
    documentIndex?: string
    documentMapJson?: Record<string, unknown>[]
    codeIndex?: string
    codeMapJson?: Record<string, unknown>[]
  }
}

function formatCodeSymbol(cs: { id: string; filename: string; symbol: string }, codeLineMap?: CodeLineMap): string {
  const lineInfo = codeLineMap?.get(cs.id)
  const lineRange = lineInfo ? ` (L${lineInfo.startLine}-${lineInfo.endLine})` : ''
  return `${cs.filename}::${cs.symbol}${lineRange}`
}

function buildSectionReport(groups: MatchedGroup[], codeLineMap?: CodeLineMap): string {
  let report = '# マッピング結果レポート\n\n'
  report += `グループ数: ${groups.length}\n\n`

  groups.forEach((group, index) => {
    report += `## ${index + 1}. ${group.groupName} (${group.groupId})\n\n`
    report += '### 設計書セクション\n'
    group.docSections.forEach((ds) => {
      report += `- ${ds.id}: ${ds.title} (${ds.path})\n`
    })
    report += '\n### コードシンボル\n'
    group.codeSymbols.forEach((cs) => {
      const lineInfo = codeLineMap?.get(cs.id)
      const lineRange = lineInfo ? ` (L${lineInfo.startLine}-${lineInfo.endLine})` : ''
      report += `- ${cs.filename} :: ${cs.symbol}${lineRange}\n`
    })
    report += `\n### 理由\n${group.reason}\n\n---\n\n`
  })

  return report
}

function buildTableReport(groups: MatchedGroup[], codeLineMap?: CodeLineMap): string {
  let md = '# マッピング結果一覧\n\n'
  md += '| 項番 | グループ名 | 設計書セクション | コードシンボル | 理由 |\n'
  md += '|---|---|---|---|---|\n'

  groups.forEach((group, index) => {
    const specSections = group.docSections
      .map((ds) => `${ds.id}: ${ds.title}`)
      .join('<br>')
    const codeSymbols = group.codeSymbols
      .map((cs) => formatCodeSymbol(cs, codeLineMap))
      .join('<br>')
    md += `| ${index + 1} | ${group.groupName} | ${specSections} | ${codeSymbols} | ${group.reason} |\n`
  })

  return md
}

export function buildMappingResultReport(groups: MatchedGroup[], codeLineMap?: CodeLineMap): string {
  return buildSectionReport(groups, codeLineMap) + '\n' + buildTableReport(groups, codeLineMap)
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildTraceabilityCSV(groups: MatchedGroup[], codeLineMap?: CodeLineMap): string {
  const header = '項番,グループ名,設計書セクション,コードシンボル,理由'
  const rows = groups.map((group, index) => {
    const specSections = group.docSections
      .map((ds) => `${ds.id}: ${ds.title}`)
      .join('; ')
    const codeSymbols = group.codeSymbols
      .map((cs) => formatCodeSymbol(cs, codeLineMap))
      .join('; ')
    return [String(index + 1), group.groupName, specSections, codeSymbols, group.reason]
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
| mapping-result-report.md | マッピング結果レポート（セクション形式 + テーブル形式） |
| mapping-result.csv | マッピング結果一覧（CSV形式） |
| split/spec-INDEX.md | 設計書の構造情報（md2map生成） |
| split/spec-MAP.json | 設計書のセクションマップ（md2map生成） |
| split/code-INDEX.md | プログラムの構造情報（code2map生成） |
| split/code-MAP.json | プログラムのシンボルマップ（code2map生成） |
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
  downloadMappingCSV: (groups: MatchedGroup[], codeLineMap?: CodeLineMap) => void
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

  const downloadMappingCSV = useCallback((groups: MatchedGroup[], codeLineMap?: CodeLineMap) => {
    const csv = buildTraceabilityCSV(groups, codeLineMap)
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
    zip.file('mapping-result-report.md', data.reportText)
    zip.file('mapping-result.csv', '\uFEFF' + buildTraceabilityCSV(data.mappingResult, data.codeLineMap))

    if (data.splitData) {
      if (data.splitData.documentIndex) {
        zip.file('split/spec-INDEX.md', data.splitData.documentIndex)
      }
      if (data.splitData.documentMapJson) {
        zip.file('split/spec-MAP.json', JSON.stringify(data.splitData.documentMapJson, null, 2))
      }
      if (data.splitData.codeIndex) {
        zip.file('split/code-INDEX.md', data.splitData.codeIndex)
      }
      if (data.splitData.codeMapJson) {
        zip.file('split/code-MAP.json', JSON.stringify(data.splitData.codeMapJson, null, 2))
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dt = new Date(data.executionMeta.executedAt)
    const ts = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}${String(dt.getHours()).padStart(2, '0')}${String(dt.getMinutes()).padStart(2, '0')}`
    a.download = `${ts}-mapping-data.zip`
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
