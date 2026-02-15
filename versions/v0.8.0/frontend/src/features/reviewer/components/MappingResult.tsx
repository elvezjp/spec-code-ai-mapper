import { FileText, Clipboard, Save, Package, Download } from 'lucide-react'
import { Table, TableBody, TableRow, TableCell } from '@core/index'
import { ExecutionInfo } from './ExecutionInfo'
import { MappingResultTable } from './MappingResultTable'
import type { MatchedGroup, MappingExecutionMeta } from '../types'

interface MappingResultProps {
  mappingResult: MatchedGroup[]
  executionMeta: MappingExecutionMeta
  reportText: string
  onCopyReport: (text: string) => void
  onDownloadReport: (text: string) => void
  onDownloadCSV: () => void
  onDownloadZip: () => void
  onBack: () => void
}

const downloadFiles = [
  { name: 'README.md', desc: 'マッピング情報と同梱ファイルの説明' },
  { name: 'system-prompt.md', desc: 'システムプロンプト（役割・目的・出力形式・注意事項）' },
  { name: 'spec-markdown.md', desc: '変換後の設計書（マークダウン形式）' },
  { name: 'code-numbered.txt', desc: '行番号付きプログラム' },
  { name: 'traceability-matrix.md', desc: 'マッピング結果（Traceability Matrix）' },
  { name: 'mapping-result.csv', desc: 'マッピング結果一覧（CSV形式）' },
  { name: 'mapping-report.md', desc: 'AIの出力レポート全文' },
]

export function MappingResult({
  mappingResult,
  executionMeta,
  reportText,
  onCopyReport,
  onDownloadReport,
  onDownloadCSV,
  onDownloadZip,
  onBack,
}: MappingResultProps) {
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

      {/* Section 1: マッピング結果一覧 */}
      <MappingResultTable groups={mappingResult} onDownloadCSV={onDownloadCSV} />

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
