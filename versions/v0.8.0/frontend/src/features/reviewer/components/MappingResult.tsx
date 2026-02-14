import { Layers, FileText, Clipboard, Save, Package, Download } from 'lucide-react'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@core/index'
import { ExecutionInfo } from './ExecutionInfo'
import type { MatchedGroup, MappingExecutionMeta } from '../types'

interface MappingResultProps {
  mappingResult: MatchedGroup[]
  executionMeta: MappingExecutionMeta
  reportText: string
  onCopyReport: (text: string) => void
  onDownloadReport: (text: string) => void
  onDownloadZip: () => void
  onBack: () => void
}

const downloadFiles = [
  { name: 'README.md', desc: 'マッピング情報と同梱ファイルの説明' },
  { name: 'system-prompt.md', desc: 'システムプロンプト（役割・目的・出力形式・注意事項）' },
  { name: 'spec-markdown.md', desc: '変換後の設計書（マークダウン形式）' },
  { name: 'code-numbered.txt', desc: '行番号付きプログラム' },
  { name: 'traceability-matrix.md', desc: 'マッピング結果（Traceability Matrix）' },
  { name: 'mapping-report.md', desc: 'AIの出力レポート全文' },
]

export function MappingResult({
  mappingResult,
  executionMeta,
  reportText,
  onCopyReport,
  onDownloadReport,
  onDownloadZip,
  onBack,
}: MappingResultProps) {
  const totalDocSections = new Set(
    mappingResult.flatMap((g) => g.docSections.map((ds) => ds.id))
  ).size
  const totalCodeSymbols = new Set(
    mappingResult.flatMap((g) => g.codeSymbols.map((cs) => `${cs.filename}::${cs.symbol}`))
  ).size

  return (
    <div className="w-fit max-w-full mx-auto min-w-[56rem]">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">マッピング結果</h1>
          <button onClick={onBack} className="text-blue-500 hover:text-blue-700">
            &larr; 戻る
          </button>
        </div>
      </div>

      {/* Section 1: Traceability Matrix */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" /> Traceability Matrix
        </h2>
        <div className="flex gap-6 text-sm text-gray-600 mb-4">
          <span>グループ数: <strong className="text-gray-800">{mappingResult.length}</strong></span>
          <span>設計書セクション: <strong className="text-gray-800">{totalDocSections}</strong></span>
          <span>コードシンボル: <strong className="text-gray-800">{totalCodeSymbols}</strong></span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-20">ID</TableHeaderCell>
                <TableHeaderCell>Specification Section</TableHeaderCell>
                <TableHeaderCell>Associated Code</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappingResult.map((group) => (
                <TableRow key={group.groupId}>
                  <TableCell className="font-mono text-sm">{group.groupId}</TableCell>
                  <TableCell>
                    {group.docSections.map((ds) => (
                      <div key={ds.id} className="mb-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs mr-2">
                          {ds.id}
                        </span>
                        {ds.title}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {group.codeSymbols.map((cs, idx) => (
                      <div key={`${cs.id}-${idx}`} className="mb-1 text-sm">
                        <span className="text-gray-500">{cs.filename}</span>
                        <span className="mx-1">::</span>
                        <span className="font-medium text-blue-600">{cs.symbol}</span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{group.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 2: Execution Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">実行情報</h2>
        <ExecutionInfo
          version={executionMeta.version}
          modelId={executionMeta.modelId}
          executedAt={executionMeta.executedAt}
          inputTokens={executionMeta.inputTokens}
          outputTokens={executionMeta.outputTokens}
          designs={executionMeta.designs}
          programs={executionMeta.programs}
        />
      </div>

      {/* Section 3: Detailed Report */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> 詳細レポート
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96 mb-4">
          <pre className="whitespace-pre-wrap text-gray-700">{reportText}</pre>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onCopyReport(reportText)}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg shadow-md transition text-sm flex items-center justify-center gap-2"
          >
            <Clipboard className="w-4 h-4" /> コピー
          </button>
          <button
            onClick={() => onDownloadReport(reportText)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg shadow-md transition text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> ダウンロード
          </button>
        </div>
      </div>

      {/* Section 4: ZIP Download */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" /> マッピング実行データ一式ダウンロード
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          マッピング実行の入出力データを一式ダウンロードできます。
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">ダウンロード内容:</h3>
          <Table className="text-sm text-gray-600">
            <TableBody>
              {downloadFiles.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="font-mono text-xs py-1 pr-2 align-top whitespace-nowrap border-0">
                    {f.name}
                  </TableCell>
                  <TableCell className="py-1 border-0">{f.desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <button
          onClick={onDownloadZip}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" /> 一式ダウンロード（ZIP）
        </button>
      </div>
    </div>
  )
}
