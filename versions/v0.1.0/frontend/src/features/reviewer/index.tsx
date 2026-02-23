import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { Settings, FileText } from 'lucide-react'
import {
  Layout,
  Header,
  Card,
  Button,
  FileInputButton,
  ScreenContainer,
  SettingsModal,
  TokenEstimator,
  SystemPromptEditor,
  VersionSelector,
  useModal,
  useScreenManager,
  useTokenEstimation,
  useVersions,
} from '@core/index'
import {
  SpecTypesSection,
  SpecFileList,
  CodeFileList,
  MarkdownOrganizer,
  SplitSettingsSection,
  MappingPolicySection,
  MappingExecutingScreen,
  MappingResult,
} from './components'
import { useFileConversion, useReviewerSettings, useZipExport, useSplitSettings, buildMappingResultReport } from './hooks'
import { testLlmConnection, executeStructureMatching } from './services/api'
import type { MatchedGroup, MappingExecutionMeta, CodeLineMap } from './types'

const APP_INFO = {
  name: 'spec-code-ai-mapper',
  version: 'v0.1.0',
  description: '設計書-Javaプログラム突合 AIマッパー',
  copyright: '© 株式会社エルブズ',
  url: 'https://elvez.co.jp',
}

export function Reviewer() {
  const settingsModal = useModal()
  const { versions, currentVersion, switchVersion } = useVersions()
  const { currentScreen, showMain, showExecuting, showResult } = useScreenManager()
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
  const { downloadSpecMarkdown, downloadCodeWithLineNumbers, downloadMappingCSV, downloadMappingZip } =
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
  const [mappingReportText, setMappingReportText] = useState('')
  const [mappingMeta, setMappingMeta] = useState<MappingExecutionMeta | null>(null)
  const [codeLineMap, setCodeLineMap] = useState<CodeLineMap>(new Map())

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

  // Handler for mapping policy change
  const handleMappingPolicyChange = useCallback((policy: string) => {
    setSplitSettings({ ...splitSettings, mappingPolicy: policy })
    applyMappingPolicy(policy)
  }, [splitSettings, setSplitSettings, applyMappingPolicy])

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
      codeFilesForSplit,
      llmConfig || undefined
    )
  }, [codeFiles, specMarkdown, specFiles, executeSplitPreview, llmConfig])


  // Mapping execution
  const handleMapping = useCallback(async () => {
    if (!splitPreviewResult || !specMarkdown) {
      setMappingError('設計書とコードを変換し、分割プレビューを先に実行してください。')
      return
    }

    setIsMapping(true)
    setMappingError(null)
    showExecuting()

    try {
      const documentIndexMd = splitPreviewResult.documentIndex || ''
      const documentMapJson = {
        sections: splitPreviewResult.documentMapJson || [],
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
        const meta = response.reviewMeta

        // Build codeLineMap from splitPreviewResult.codeParts
        const lineMap: CodeLineMap = new Map()
        if (splitPreviewResult.codeParts) {
          for (const part of splitPreviewResult.codeParts) {
            lineMap.set(part.id, { startLine: part.startLine, endLine: part.endLine })
          }
        }
        setCodeLineMap(lineMap)

        setMappingResult(response.groups)
        setMappingReportText(buildMappingResultReport(response.groups, lineMap))
        setMappingMeta({
          version: meta?.version || APP_INFO.version,
          modelId: meta?.modelId || llmConfig?.model || 'unknown',
          executedAt: meta?.executedAt || new Date().toISOString(),
          inputTokens: meta?.inputTokens ?? response.tokensUsed?.input,
          outputTokens: meta?.outputTokens ?? response.tokensUsed?.output,
          designs: specFiles.map((f) => ({
            filename: f.filename,
            type: f.type,
            tool: f.tool,
          })),
          programs: codeFiles.map((f) => ({ filename: f.filename })),
          mappingPolicy: splitSettings.mappingPolicy,
          totalGroups: response.totalGroups,
        })
        setIsMapping(false)
        showResult()
      } else {
        setMappingError(response.error || 'マッピングに失敗しました。')
        setIsMapping(false)
      }
    } catch (err) {
      setMappingError(err instanceof Error ? err.message : 'エラーが発生しました。')
      setIsMapping(false)
    }
  }, [splitPreviewResult, specMarkdown, codeFiles, specFiles, currentPromptValues, llmConfig, splitSettings.mappingPolicy, showExecuting, showResult])

  // Result screen handlers
  const handleCopyReport = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('レポートをクリップボードにコピーしました')
    })
  }, [showToast])

  const handleDownloadReport = useCallback((text: string) => {
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mapping-result-report.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleDownloadCSV = useCallback(() => {
    if (!mappingResult) return
    downloadMappingCSV(mappingResult, codeLineMap)
  }, [mappingResult, codeLineMap, downloadMappingCSV])

  const handleDownloadZip = useCallback(() => {
    if (!mappingResult || !mappingMeta || !specMarkdown || !codeWithLineNumbers) return
    downloadMappingZip({
      mappingResult,
      executionMeta: mappingMeta,
      reportText: mappingReportText,
      systemPrompt: currentPromptValues,
      specMarkdown,
      codeWithLineNumbers,
      codeLineMap,
      splitData: splitPreviewResult ? {
        documentIndex: splitPreviewResult.documentIndex || undefined,
        documentMapJson: splitPreviewResult.documentMapJson || undefined,
        codeIndex: splitPreviewResult.codeIndex || undefined,
        codeMapJson: splitPreviewResult.codeMapJson || undefined,
      } : undefined,
    })
  }, [mappingResult, mappingMeta, mappingReportText, currentPromptValues, specMarkdown, codeWithLineNumbers, codeLineMap, splitPreviewResult, downloadMappingZip])

  const handleBackFromExecuting = useCallback(() => {
    setMappingError(null)
    showMain()
  }, [showMain])

  const handleBackFromResult = useCallback(() => {
    showMain()
  }, [showMain])

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
      <ScreenContainer
        currentScreen={currentScreen}
        mainScreen={
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
                />
              </div>

              {/* Mapping policy */}
              <MappingPolicySection
                currentPolicy={splitSettings.mappingPolicy}
                onPolicyChange={handleMappingPolicyChange}
              />

              {/* System prompt settings */}
              <SystemPromptEditor
                currentValues={currentPromptValues}
                onValueChange={updatePromptValue}
                isCollapsible={true}
                defaultExpanded={false}
                disabledFields={['format']}
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

              {/* Mapping button */}
              <Card className="mb-6">
                <Button
                  variant="success"
                  size="lg"
                  disabled={!isReviewEnabled || !splitPreviewResult || isMapping}
                  onClick={handleMapping}
                >
                  マッピング実行
                </Button>
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
          </Layout>
        }
        executingScreen={
          <Layout>
            <MappingExecutingScreen
              isExecuting={isMapping}
              error={mappingError}
              onBack={handleBackFromExecuting}
              onRetry={handleMapping}
            />
          </Layout>
        }
        resultScreen={
          /* 結果画面: Traceability Matrixテーブルの内容に応じて幅が変わるため、
             Layout (max-w-4xl) ではなくフル幅コンテナを使用。
             各セクションの幅揃えは MappingResult 内の w-fit コンテナで制御。 */
          mappingResult && mappingMeta ? (
            <div className="mx-auto p-6">
              <MappingResult
                mappingResult={mappingResult}
                executionMeta={mappingMeta}
                reportText={mappingReportText}
                codeLineMap={codeLineMap}
                onCopyReport={handleCopyReport}
                onDownloadReport={handleDownloadReport}
                onDownloadCSV={handleDownloadCSV}
                onDownloadZip={handleDownloadZip}
                onBack={handleBackFromResult}
              />
            </div>
          ) : undefined
        }
      />

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
    </>
  )
}
