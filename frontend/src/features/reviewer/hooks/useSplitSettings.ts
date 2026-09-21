import { useState, useCallback } from 'react'
import type {
  SplitSettings,
  SplitPreviewResult,
  DocumentPart,
  CodePart,
  LlmConfig,
} from '../types'
import * as api from '../services/api'

interface UseSplitSettingsReturn {
  // State
  settings: SplitSettings
  previewResult: SplitPreviewResult | null
  isExecutingPreview: boolean
  error: string | null

  // Actions
  setSettings: (settings: SplitSettings) => void
  executePreview: (
    designMarkdown: string | null,
    designFilename: string,
    codeFiles: Array<{ filename: string; content: string }>,
    llmConfig?: LlmConfig
  ) => Promise<void>
  clearPreview: () => void
}

const DEFAULT_SETTINGS: SplitSettings = {
  documentMaxDepth: 2,
  documentSplitMode: 'ai',
  mappingPolicy: 'standard',
}

export function useSplitSettings(): UseSplitSettingsReturn {
  const [settings, setSettings] = useState<SplitSettings>(DEFAULT_SETTINGS)
  const [previewResult, setPreviewResult] = useState<SplitPreviewResult | null>(null)

  const [isExecutingPreview, setIsExecutingPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executePreview = useCallback(async (
    designMarkdown: string | null,
    designFilename: string,
    codeFiles: Array<{ filename: string; content: string }>,
    llmConfig?: LlmConfig
  ) => {
    setIsExecutingPreview(true)
    setError(null)

    try {
      let documentParts: DocumentPart[] | null = null
      let documentIndex: string | null = null
      let documentMapJson: Record<string, unknown>[] | null = null
      let codeParts: CodePart[] | null = null
      let codeIndex: string | null = null
      let codeMapJson: Record<string, unknown>[] | null = null
      let codeLanguage: string | null = null

      // 設計書分割
      if (designMarkdown) {
        const response = await api.splitMarkdown({
          content: designMarkdown,
          filename: designFilename,
          maxDepth: settings.documentMaxDepth,
          splitMode: settings.documentSplitMode,
          llmConfig: settings.documentSplitMode === 'ai' ? llmConfig : undefined,
        })

        if (response.success) {
          documentParts = response.parts
          documentIndex = response.indexContent || null
          documentMapJson = response.mapJson || null
        } else {
          throw new Error(response.error || '設計書の分割に失敗しました')
        }
      }

      // コード分割（対応言語のファイルのみ）
      if (codeFiles.length > 0) {
        const allCodeParts: CodePart[] = []
        const allIndexContents: string[] = []
        const allCodeMapEntries: Record<string, unknown>[] = []

        for (const codeFile of codeFiles) {
          const ext = codeFile.filename.toLowerCase().split('.').pop()
          if (ext !== 'py' && ext !== 'java') {
            continue // 未対応言語はスキップ
          }

          const response = await api.splitCode({
            content: codeFile.content,
            filename: codeFile.filename,
          })

          if (response.success) {
            allCodeParts.push(...response.parts)
            if (response.indexContent) {
              allIndexContents.push(response.indexContent)
            }
            if (response.mapJson) {
              allCodeMapEntries.push(...response.mapJson)
            }
            if (response.language && !codeLanguage) {
              codeLanguage = response.language
            }
          } else {
            console.warn(`Failed to split ${codeFile.filename}: ${response.error}`)
          }
        }

        if (allCodeParts.length > 0) {
          codeParts = allCodeParts
          codeIndex = allIndexContents.join('\n\n---\n\n')
          codeMapJson = allCodeMapEntries.length > 0 ? allCodeMapEntries : null
        }
      }

      setPreviewResult({
        documentParts,
        codeParts,
        documentIndex,
        documentMapJson,
        codeIndex,
        codeMapJson,
        codeLanguage,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '分割プレビューに失敗しました'
      setError(message)
      setPreviewResult(null)
    } finally {
      setIsExecutingPreview(false)
    }
  }, [settings.documentMaxDepth, settings.documentSplitMode])

  const clearPreview = useCallback(() => {
    setPreviewResult(null)
    setError(null)
  }, [])

  const handleSetSettings = useCallback((newSettings: SplitSettings) => {
    setSettings(prev => {
      // 分割に影響する設定が変更された場合のみプレビューをクリア
      if (prev.documentMaxDepth !== newSettings.documentMaxDepth ||
          prev.documentSplitMode !== newSettings.documentSplitMode) {
        setPreviewResult(null)
        setError(null)
      }
      return newSettings
    })
  }, [])

  return {
    settings,
    previewResult,
    isExecutingPreview,
    error,
    setSettings: handleSetSettings,
    executePreview,
    clearPreview,
  }
}
