import { Download } from 'lucide-react'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@core/index'
import type { MatchedGroup, CodeLineMap } from '../types'

interface MappingResultTableProps {
  groups: MatchedGroup[]
  codeLineMap: CodeLineMap
  onDownloadCSV: () => void
}

export function MappingResultTable({ groups, codeLineMap, onDownloadCSV }: MappingResultTableProps) {
  const totalDocSections = new Set(
    groups.flatMap((g) => g.docSections.map((ds) => ds.id))
  ).size
  const totalCodeSymbols = new Set(
    groups.flatMap((g) => g.codeSymbols.map((cs) => `${cs.filename}::${cs.symbol}`))
  ).size

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">マッピング結果一覧</h2>
      <div className="flex gap-6 text-sm text-gray-600 mb-4">
        <span>グループ数: <strong className="text-gray-800">{groups.length}</strong></span>
        <span>設計書セクション: <strong className="text-gray-800">{totalDocSections}</strong></span>
        <span>コードシンボル: <strong className="text-gray-800">{totalCodeSymbols}</strong></span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-16">項番</TableHeaderCell>
              <TableHeaderCell>グループ名</TableHeaderCell>
              <TableHeaderCell>設計書セクション</TableHeaderCell>
              <TableHeaderCell>コードシンボル</TableHeaderCell>
              <TableHeaderCell>理由</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group, index) => (
              <TableRow key={group.groupId}>
                <TableCell className="font-mono text-sm text-center">{index + 1}</TableCell>
                <TableCell className="text-sm font-medium">{group.groupName}</TableCell>
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
                  {group.codeSymbols.map((cs, idx) => {
                    const lineInfo = codeLineMap.get(cs.id)
                    return (
                      <div key={`${cs.id}-${idx}`} className="mb-1 text-sm">
                        <span className="text-gray-500">{cs.filename}</span>
                        <span className="mx-1">::</span>
                        <span className="font-medium text-blue-600">{cs.symbol}</span>
                        {lineInfo && (
                          <span className="ml-1 text-gray-400 text-xs">
                            (L{lineInfo.startLine}-{lineInfo.endLine})
                          </span>
                        )}
                      </div>
                    )
                  })}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{group.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex">
        <button
          onClick={onDownloadCSV}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg shadow-md transition text-sm flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> CSVダウンロード
        </button>
      </div>
    </div>
  )
}
