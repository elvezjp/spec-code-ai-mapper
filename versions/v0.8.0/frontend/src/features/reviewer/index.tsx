import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { Settings, FileText, Layers, Download, RefreshCw } from 'lucide-react'
import {
  Layout,
  Header,
  Card,
  Button,
  FileInputButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  SettingsModal,
  TokenEstimator,
  SystemPromptEditor,
  VersionSelector,
  useModal,
  useTokenEstimation,
  useVersions,
} from '@core/index'
import {
  SpecTypesSection,
  SpecFileList,
  CodeFileList,
  MarkdownOrganizer,
  SplitSettingsSection,
} from './components'
import { useFileConversion, useReviewerSettings, useZipExport, useSplitSettings } from './hooks'
import { testLlmConnection, executeStructureMatching } from './services/api'
import type { MatchedGroup } from './types'

const APP_INFO = {
  name: 'spec-code-ai-mapper',
  version: 'v0.8.0',
  description: 'spec-code-ai-mapper',
  copyright: '© 株式会社エルブズ',
  url: 'https://elvez.co.jp',
}

export function Reviewer() {
  const settingsModal = useModal()
  const { versions, currentVersion, switchVersion } = useVersions()
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef<number | null>(null)

  // File conversion
  const {
    specFiles,
    specMarkdown,
    isSpecConverting,
    specStatus,
    addSpecFiles,
    setMainSpec,
    setSpecType,
    setSpecTool,
    applyToolToAll,
    convertSpecs,
    applyOrganizedMarkdown,
    codeFiles,
    codeWithLineNumbers,
    isCodeConverting,
    codeStatus,
    addCodeFiles,
    convertCodes,
    availableTools,
    loadTools,
  } = useFileConversion()

  // Settings
  const {
    llmConfig,
    selectedModel,
    setSelectedModel,
    specTypesConfig,
    currentPromptValues,
    updatePromptValue,
    applyMappingPolicy,
    reviewerConfig,
    configFilename,
    configModified,
    configLoadStatus,
    loadConfigFile,
    saveConfigToBrowser,
    clearSavedConfig,
    hasSavedConfig,
    getTypeNote,
    getSpecTypesList,
  } = useReviewerSettings()

  // Zip export
  const { downloadSpecMarkdown, downloadCodeWithLineNumbers } =
    useZipExport()

  // Split settings
  const {
    settings: splitSettings,
    previewResult: splitPreviewResult,
    isExecutingPreview: isSplitPreviewExecuting,
    setSettings: setSplitSettings,
    executePreview: executeSplitPreview,
    clearPreview: clearSplitPreview,
  } = useSplitSettings()

  // Mapping state
  const [mappingResult, setMappingResult] = useState<MatchedGroup[] | null>(null)
  const [isMapping, setIsMapping] = useState(false)
  const [mappingError, setMappingError] = useState<string | null>(null)

  // System prompt text for token estimation
  const systemPromptText = useMemo(() => {
    return [
      currentPromptValues.role,
      currentPromptValues.purpose,
      currentPromptValues.format,
      currentPromptValues.notes,
    ].join('\n')
  }, [currentPromptValues])

  // Token estimation
  const tokenEstimation = useTokenEstimation(
    specMarkdown || '',
    codeWithLineNumbers || '',
    systemPromptText
  )

  // Load tools on mount
  useEffect(() => {
    loadTools()
  }, [loadTools])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 3000)
  }, [])

  useEffect(() => {
    const message = sessionStorage.getItem('preset-toast')
    if (!message) return

    sessionStorage.removeItem('preset-toast')
    showToast(message)
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [showToast])

  const isReviewEnabled = specMarkdown && codeWithLineNumbers

  // Handler for split preview execution
  const handleSplitPreviewExecute = useCallback(async () => {
    const codeFilesForSplit = await Promise.all(
      codeFiles.map(async (cf) => ({
        filename: cf.filename,
        content: await cf.file.text(),
      }))
    )

    await executeSplitPreview(
      specMarkdown,
      specFiles.find(f => f.isMain)?.filename || 'design.md',
      codeFilesForSplit
    )
  }, [codeFiles, specMarkdown, specFiles, executeSplitPreview])

  // Mapping execution
  const handleMapping = useCallback(async () => {
    if (!splitPreviewResult || !specMarkdown) {
      setMappingError('設計書とコードを変換し、分割プレビューを先に実行してください。')
      return
    }

    setIsMapping(true)
    setMappingError(null)

    try {
      const documentIndexMd = splitPreviewResult.documentIndex || ''
      const documentMapJson = {
        sections: splitPreviewResult.documentParts?.map((p) => ({
          id: p.id,
          title: p.section,
          level: p.level,
          path: p.path,
          startLine: p.startLine,
          endLine: p.endLine,
        })) || [],
      }

      const codeFileStructures = codeFiles.map((cf) => {
        const codeParts = splitPreviewResult.codeParts || []
        return {
          filename: cf.filename,
          indexMd: splitPreviewResult.codeIndex || '',
          mapJson: {
            symbols: codeParts.map((p) => ({
              id: p.id,
              name: p.symbol,
              symbolType: p.symbolType,
              parentSymbol: p.parentSymbol,
              startLine: p.startLine,
              endLine: p.endLine,
            })),
          },
        }
      })

      const response = await executeStructureMatching({
        document: { indexMd: documentIndexMd, mapJson: documentMapJson },
        codeFiles: codeFileStructures,
        systemPrompt: currentPromptValues,
        llmConfig: llmConfig || undefined,
      })

      if (response.success && response.groups) {
        setMappingResult(response.groups)
      } else {
        setMappingError(response.error || 'マッピングに失敗しました。')
      }
    } catch (err) {
      setMappingError(err instanceof Error ? err.message : 'エラーが発生しました。')
    } finally {
      setIsMapping(false)
    }
  }, [splitPreviewResult, specMarkdown, codeFiles, currentPromptValues, llmConfig])

  // Markdown export
  const handleExportMarkdown = useCallback(() => {
    if (!mappingResult) return

    let markdown = '# Traceability Matrix\n\n'
    markdown += '| ID | Specification Section | Associated Code | Reason |\n'
    markdown += '|---|---|---|---|\n'

    mappingResult.forEach(group => {
      const specSections = group.docSections.map(ds => `${ds.id}: ${ds.title}`).join('<br>')
      const codeSymbols = group.codeSymbols.map(cs => `${cs.filename} (${cs.symbol})`).join('<br>')
      markdown += `| ${group.groupId} | ${specSections} | ${codeSymbols} | ${group.reason} |\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'traceability_matrix.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [mappingResult])

  const handleConvertSpecs = () => {
    convertSpecs(getTypeNote)
  }

  // Config file load handler
  const handleConfigFileLoad = async (content: string, filename: string) => {
    const file = new File([content], filename, { type: 'text/markdown' })
    await loadConfigFile(file)
  }

  // LLM connection test handler
  const handleTestConnection = useCallback(async () => {
    try {
      if (llmConfig) {
        const result = await testLlmConnection({
          provider: llmConfig.provider,
          model: selectedModel || llmConfig.model,
          apiKey: llmConfig.apiKey,
          accessKeyId: llmConfig.accessKeyId,
          secretAccessKey: llmConfig.secretAccessKey,
          region: llmConfig.region,
        })
        return {
          success: result.status === 'connected',
          model: result.model,
          provider: result.provider,
          error: result.error,
        }
      } else {
        const result = await testLlmConnection({})
        return {
          success: result.status === 'connected',
          model: result.model,
          provider: result.provider,
          error: result.error,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '接続エラー',
      }
    }
  }, [llmConfig, selectedModel])

  return (
    <>
      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}
      <Layout>
        {/* Header */}
        <Header
          title={APP_INFO.description}
          leftContent={
            <VersionSelector
              versions={versions}
              currentVersion={currentVersion}
              onVersionSelect={switchVersion}
            />
          }
          rightContent={
            <div className="flex items-center gap-3">
              <button
                onClick={settingsModal.open}
                className="text-gray-500 hover:text-gray-700"
                title="設定"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          }
        />

        {/* Spec files section */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">設計書 (Excel)</h2>
          <div className="flex items-center gap-2 mb-2">
            <FileInputButton
              accept=".xlsx,.xls"
              multiple
              onFilesSelect={addSpecFiles}
              label="ファイルを選択"
            />
            <span className="text-gray-600 text-sm flex items-center gap-1">
              {specFiles.length > 0 ? (
                <>
                  <FileText className="w-4 h-4" />
                  {specFiles.map((f) => f.filename).join(', ')}
                </>
              ) : (
                '選択してください'
              )}
            </span>
          </div>
          <SpecFileList
            files={specFiles}
            availableTools={availableTools}
            specTypesList={getSpecTypesList()}
            specMarkdown={specMarkdown}
            specStatus={specStatus}
            isConverting={isSpecConverting}
            onMainChange={setMainSpec}
            onTypeChange={setSpecType}
            onToolChange={setSpecTool}
            onApplyToolToAll={applyToolToAll}
            onConvert={handleConvertSpecs}
            onDownload={() => specMarkdown && downloadSpecMarkdown(specMarkdown)}
          />
          <MarkdownOrganizer
            specMarkdown={specMarkdown}
            specFiles={specFiles}
            llmConfig={llmConfig || undefined}
            getTypeNote={getTypeNote}
            onAdopt={(organizedFiles) => applyOrganizedMarkdown(organizedFiles, getTypeNote)}
          />
        </Card>

        {/* Code files section */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">プログラム</h2>
          <div className="flex items-center gap-2 mb-2">
            <FileInputButton
              multiple
              onFilesSelect={addCodeFiles}
              label="ファイルを選択"
            />
            <span className="text-gray-600 text-sm flex items-center gap-1">
              {codeFiles.length > 0 ? (
                <>
                  <FileText className="w-4 h-4" />
                  {codeFiles.map((f) => f.filename).join(', ')}
                </>
              ) : (
                '選択してください'
              )}
            </span>
          </div>
          <CodeFileList
            files={codeFiles}
            codeWithLineNumbers={codeWithLineNumbers}
            codeStatus={codeStatus}
            isConverting={isCodeConverting}
            onConvert={convertCodes}
            onDownload={() => codeWithLineNumbers && downloadCodeWithLineNumbers(codeWithLineNumbers)}
          />
        </Card>

        {/* System prompt settings */}
        <SystemPromptEditor
          currentValues={currentPromptValues}
          onValueChange={updatePromptValue}
          isCollapsible={true}
          defaultExpanded={false}
        />

        {/* Token estimate */}
        <TokenEstimator
          totalTokens={tokenEstimation.totalTokens}
          specTokens={tokenEstimation.specTokens}
          codeTokens={tokenEstimation.codeTokens}
          promptTokens={tokenEstimation.promptTokens}
          isWarning={tokenEstimation.isWarning}
          isVisible={!!(specMarkdown || codeWithLineNumbers)}
        />

        {/* Split settings */}
        <div className="mb-6">
          <SplitSettingsSection
            settings={splitSettings}
            onSettingsChange={setSplitSettings}
            previewResult={splitPreviewResult}
            onExecutePreview={handleSplitPreviewExecute}
            onClearPreview={clearSplitPreview}
            isExecuting={isSplitPreviewExecuting}
            hasDesignDoc={!!specMarkdown}
            hasCodeFiles={!!codeWithLineNumbers}
            codeFilenames={codeFiles.map(f => f.filename)}
            onMappingPolicyChange={applyMappingPolicy}
          />
        </div>

        {/* Mapping button */}
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <Button
              variant="success"
              size="lg"
              disabled={!isReviewEnabled || !splitPreviewResult || isMapping}
              onClick={handleMapping}
            >
              {isMapping ? (
                <>
                  <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  マッピング実行中...
                </>
              ) : (
                'マッピング実行'
              )}
            </Button>
            {mappingResult && (
              <Button
                variant="success"
                size="sm"
                onClick={handleExportMarkdown}
              >
                <Download className="w-4 h-4 mr-2" />
                Markdown出力
              </Button>
            )}
          </div>
          {!isReviewEnabled && (
            <p className="text-xs text-orange-500 mt-3 text-center">
              ※ マッピングを実行するには、設計書とプログラムを両方変換してください。
            </p>
          )}
          {isReviewEnabled && !splitPreviewResult && (
            <p className="text-xs text-orange-500 mt-3 text-center">
              ※ マッピングを実行するには、先に「分割プレビュー実行」を行ってください。
            </p>
          )}
        </Card>

        {/* Mapping error */}
        {mappingError && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">{mappingError}</p>
          </Card>
        )}

        {/* Traceability Matrix */}
        {mappingResult && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-500" />
              Traceability Matrix
            </h2>
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
                      {group.docSections.map(ds => (
                        <div key={ds.id} className="mb-1">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs mr-2">{ds.id}</span>
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
          </Card>
        )}

        {/* Settings modal */}
        <SettingsModal
          isOpen={settingsModal.isOpen}
          onClose={settingsModal.close}
          appInfo={APP_INFO}
          llmSettings={
            reviewerConfig?.llm
              ? { ...reviewerConfig.llm, selectedModel }
              : undefined
          }
          onModelChange={setSelectedModel}
          onConfigFileLoad={handleConfigFileLoad}
          onSaveToStorage={saveConfigToBrowser}
          onClearStorage={clearSavedConfig}
          loadedConfigFilename={configFilename || undefined}
          configLoadStatus={configLoadStatus || undefined}
          isConfigSavedToBrowser={hasSavedConfig()}
          isConfigModified={configModified}
          onTestConnection={handleTestConnection}
          isSystemFallback={!reviewerConfig?.llm}
          extensionSections={[<SpecTypesSection key="spec-types" specTypes={specTypesConfig} />]}
        />
      </Layout>
    </>
  )
}
