import { useState, useCallback, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@core/index'
import type { SplitSettings, DocumentPart, CodePart, SplitPreviewResult } from '../types'

interface SplitSettingsSectionProps {
  settings: SplitSettings
  onSettingsChange: (settings: SplitSettings) => void
  previewResult: SplitPreviewResult | null
  onExecutePreview: () => Promise<void>
  onClearPreview: () => void
  isExecuting: boolean
  hasDesignDoc: boolean
  hasCodeFiles: boolean
  codeFilenames: string[]
  onMappingPolicyChange?: (policy: string) => void
}

export function SplitSettingsSection({
  settings,
  onSettingsChange,
  previewResult,
  onExecutePreview,
  onClearPreview,
  isExecuting,
  hasDesignDoc,
  hasCodeFiles,
  codeFilenames,
  onMappingPolicyChange,
}: SplitSettingsSectionProps) {
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(true)
  const prevHasDesignDocRef = useRef(hasDesignDoc)
  const prevHasCodeFilesRef = useRef(hasCodeFiles)

  // 設計書またはプログラムがdisabledになったらプレビューをクリア
  useEffect(() => {
    const prevHasDesignDoc = prevHasDesignDocRef.current
    const prevHasCodeFiles = prevHasCodeFilesRef.current

    // 設計書がenabled→disabledになった場合、または
    // プログラムがenabled→disabledになった場合にクリア
    if ((prevHasDesignDoc && !hasDesignDoc) || (prevHasCodeFiles && !hasCodeFiles)) {
      if (previewResult) {
        onClearPreview()
      }
    }

    prevHasDesignDocRef.current = hasDesignDoc
    prevHasCodeFilesRef.current = hasCodeFiles
  }, [hasDesignDoc, hasCodeFiles, previewResult, onClearPreview])

  const handleMappingPolicyChange = useCallback((policy: string) => {
    onSettingsChange({ ...settings, mappingPolicy: policy })
    onMappingPolicyChange?.(policy)
  }, [settings, onSettingsChange, onMappingPolicyChange])

  const handleDepthChange = useCallback((depth: number) => {
    onSettingsChange({ ...settings, documentMaxDepth: depth })
  }, [settings, onSettingsChange])

  const canExecutePreview = hasDesignDoc || hasCodeFiles

  // 対応言語を判定
  const supportedCodeFiles = codeFilenames.filter(name => {
    const ext = name.toLowerCase().split('.').pop()
    return ext === 'py' || ext === 'java'
  })
  const unsupportedCodeFiles = codeFilenames.filter(name => {
    const ext = name.toLowerCase().split('.').pop()
    return ext !== 'py' && ext !== 'java'
  })

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800">分割設定</h2>
      <p className="text-xs text-gray-400 mt-2 mb-4">
        設計書とプログラムを分割してマッピングします。
      </p>

      {/* マッピング方式 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-4 pt-2">
          <span className="text-sm font-medium text-gray-700 w-24 mt-1">マッピング方式:</span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mappingPolicy"
                  checked={settings.mappingPolicy === 'standard'}
                  onChange={() => handleMappingPolicyChange('standard')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">標準 (LLM)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mappingPolicy"
                  checked={settings.mappingPolicy === 'strict'}
                  onChange={() => handleMappingPolicyChange('strict')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">厳密 (ID重視)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mappingPolicy"
                  checked={settings.mappingPolicy === 'detailed'}
                  onChange={() => handleMappingPolicyChange('detailed')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">詳細 (内容参照)</span>
              </label>
            </div>
            <p className="text-xs text-gray-400">
              {settings.mappingPolicy === 'standard' && 'AIレビュアーの自動グループ化と同等の動作です。LLMが文脈を分析して柔軟に関連付けます。'}
              {settings.mappingPolicy === 'strict' && 'IDやシンボル名の一致を優先します。トレーサビリティが明確な場合に適しています。'}
              {settings.mappingPolicy === 'detailed' && 'セクションの内容も一部参照して精度を高めます（トークン消費量が増えます）。'}
            </p>
          </div>
        </div>
      </div>

      {/* 分割オプション */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          {isOptionsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          分割オプション
        </button>
        {isOptionsExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 space-y-3">
            {/* 設計書オプション */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                設計書
                <span className="text-xs text-gray-400 ml-2">
                  ※{' '}
                  <a href="https://github.com/elvezjp/md2map" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    md2map
                  </a>
                  {' '}の仕様に準拠し、設定した見出しレベルで分割します。
                </span>
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">見出しレベル:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="docDepth"
                    checked={settings.documentMaxDepth === 2}
                    onChange={() => handleDepthChange(2)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">H2(##)まで（推奨）</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="docDepth"
                    checked={settings.documentMaxDepth === 3}
                    onChange={() => handleDepthChange(3)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">H3(###)まで</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="docDepth"
                    checked={settings.documentMaxDepth === 4}
                    onChange={() => handleDepthChange(4)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">H4(####)まで</span>
                </label>
              </div>
            </div>

            {/* プログラムオプション */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                プログラム
                <span className="text-xs text-gray-400 ml-2">
                  ※{' '}
                  <a href="https://github.com/elvezjp/code2map" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    code2map
                  </a>
                  {' '}の仕様に準拠し、クラスや関数など意味のある単位で分割します。
                </span>
              </p>
              <div className="text-sm text-gray-600">
                <p>対応言語: Python (.py) / Java (.java)</p>
                {supportedCodeFiles.length > 0 && (
                  <p className="mt-1 text-green-600">
                    対応ファイル: {supportedCodeFiles.join(', ')}
                  </p>
                )}
                {unsupportedCodeFiles.length > 0 && (
                  <p className="mt-1 text-amber-600">
                    未対応ファイル: {unsupportedCodeFiles.join(', ')}（一括処理されます）
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分割プレビュー実行ボタン */}
      <div className="mb-4">
        <button
          onClick={onExecutePreview}
          disabled={!canExecutePreview || isExecuting || !!previewResult}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
              プレビュー実行中...
            </>
          ) : previewResult ? (
            'プレビュー実行済み'
          ) : (
            '分割プレビュー実行'
          )}
        </button>
      </div>

      {/* プレビュー結果 */}
      {previewResult && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">プレビュー結果</h3>

          {/* 設計書パーツ */}
          {previewResult.documentParts && previewResult.documentParts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                ■ 設計書: {previewResult.documentParts.length} パート
              </h4>
              <DocumentPartsTable parts={previewResult.documentParts} />
            </div>
          )}

          {/* コードパーツ */}
          {previewResult.codeParts && previewResult.codeParts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                ■ プログラム: {previewResult.codeParts.length} パート
                {previewResult.codeLanguage && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({previewResult.codeLanguage})
                  </span>
                )}
              </h4>
              <CodePartsTable parts={previewResult.codeParts} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DocumentPartsTable({ parts }: { parts: DocumentPart[] }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-sm">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-12">#</TableHeaderCell>
            <TableHeaderCell>セクション名</TableHeaderCell>
            <TableHeaderCell className="w-24">行範囲</TableHeaderCell>
            <TableHeaderCell className="w-28">推定トークン</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parts.map((part, index) => (
            <TableRow key={`${part.section}-${part.startLine}`}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{part.section}</TableCell>
              <TableCell className="text-gray-600">L{part.startLine}-L{part.endLine}</TableCell>
              <TableCell className="text-gray-600">~{part.estimatedTokens.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CodePartsTable({ parts }: { parts: CodePart[] }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-sm">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-12">#</TableHeaderCell>
            <TableHeaderCell>シンボル名</TableHeaderCell>
            <TableHeaderCell className="w-20">種別</TableHeaderCell>
            <TableHeaderCell className="w-24">行範囲</TableHeaderCell>
            <TableHeaderCell className="w-28">推定トークン</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parts.map((part, index) => (
            <TableRow key={`${part.symbol}-${part.startLine}`}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {part.parentSymbol ? `${part.parentSymbol}#${part.symbol}` : part.symbol}
              </TableCell>
              <TableCell className="text-gray-600">{part.symbolType}</TableCell>
              <TableCell className="text-gray-600">L{part.startLine}-L{part.endLine}</TableCell>
              <TableCell className="text-gray-600">~{part.estimatedTokens.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
