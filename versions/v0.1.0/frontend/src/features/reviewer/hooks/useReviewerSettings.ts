import { useState, useCallback, useEffect, useMemo } from 'react'
import type { LlmConfig, SystemPromptValues } from '../types'
import type { SpecType, ReviewerConfig, LlmSettings, SystemPromptPreset } from '@core/types'
import {
  DEFAULT_SPEC_TYPES,
  DEFAULT_SYSTEM_PROMPTS,
  DEFAULT_LLM_SETTINGS,
} from '@core/hooks/useSettings'
import { MAPPING_PRESET_CATALOG, DEFAULT_MAPPING_PRESET_ID } from '@core/data/mappingPresetCatalog'

export interface ConfigLoadStatus {
  llm?: string
  specTypes?: string
  prompts?: string
}

interface UseReviewerSettingsReturn {
  // LLM settings
  llmConfig: LlmConfig | null
  selectedModel: string
  setSelectedModel: (model: string) => void

  // Spec types
  specTypesConfig: SpecType[]
  getTypeNote: (type: string) => string
  getSpecTypesList: () => string[]

  // System prompts
  currentPromptValues: SystemPromptValues
  updatePromptValue: (field: keyof SystemPromptValues, value: string) => void
  applyMappingPolicy: (policy: string) => void

  // Config file
  reviewerConfig: ReviewerConfig | null
  configFilename: string | null
  configModified: boolean
  configLoadStatus: ConfigLoadStatus | null
  loadConfigFile: (file: File) => Promise<void>
  saveConfigToBrowser: () => void
  clearSavedConfig: () => void
  hasSavedConfig: () => boolean
}

const STORAGE_KEY = 'reviewer-config'
const SELECTED_MODEL_KEY = 'selected-model'
const SELECTED_PROMPT_KEY = 'selected-system-prompt'

// 最初の:でのみ分割（モデル名に:が含まれる場合に対応）
const parseSelectedModelKey = (key: string): { provider: string; model: string } | null => {
  const firstColonIndex = key.indexOf(':')
  if (firstColonIndex === -1) return null
  return {
    provider: key.substring(0, firstColonIndex),
    model: key.substring(firstColonIndex + 1),
  }
}

export function useReviewerSettings(): UseReviewerSettingsReturn {
  const [currentPromptValues, setCurrentPromptValues] = useState<SystemPromptValues>(() => {
    const defaultMappingPreset = MAPPING_PRESET_CATALOG.find(
      p => p.id === DEFAULT_MAPPING_PRESET_ID
    )
    if (defaultMappingPreset) {
      return { ...defaultMappingPreset.systemPrompt }
    }
    const defaultPrompt = DEFAULT_SYSTEM_PROMPTS[0]
    return {
      role: defaultPrompt?.role ?? '',
      purpose: defaultPrompt?.purpose ?? '',
      format: defaultPrompt?.format ?? '',
      notes: defaultPrompt?.notes ?? '',
    }
  })

  const [reviewerConfig, setReviewerConfig] = useState<ReviewerConfig | null>(null)
  const [configFilename, setConfigFilename] = useState<string | null>(null)
  const [configModified, setConfigModified] = useState(false)
  const [configLoadStatus, setConfigLoadStatus] = useState<ConfigLoadStatus | null>(null)
  const [selectedModel, setSelectedModelState] = useState('')

  // Derived values
  const specTypesConfig: SpecType[] =
    reviewerConfig?.specTypes && reviewerConfig.specTypes.length > 0
      ? reviewerConfig.specTypes
      : DEFAULT_SPEC_TYPES

  // システムプロンプト: デフォルト + 設定ファイル
  const systemPromptPresets: SystemPromptPreset[] = useMemo(() => {
    const defaultPreset = DEFAULT_SYSTEM_PROMPTS[0]
    const configPrompts = reviewerConfig?.systemPrompts || []
    const allPrompts = [
      ...(defaultPreset ? [defaultPreset] : []),
      ...configPrompts,
    ]
    return allPrompts.filter((item, index, array) => {
      return array.findIndex(entry => entry.name === item.name) === index
    })
  }, [reviewerConfig])

  const llmConfig = useMemo((): LlmConfig | null => {
    if (!reviewerConfig?.llm?.provider) return null

    const config = {
      provider: reviewerConfig.llm.provider as LlmConfig['provider'],
      model: selectedModel || reviewerConfig.llm.models?.[0] || '',
      maxTokens: reviewerConfig.llm.maxTokens || DEFAULT_LLM_SETTINGS.maxTokens,
      apiKey: reviewerConfig.llm.apiKey,
      accessKeyId: reviewerConfig.llm.accessKeyId,
      secretAccessKey: reviewerConfig.llm.secretAccessKey,
      region: reviewerConfig.llm.region,
    }
    return config
  }, [reviewerConfig, selectedModel])

  // モデル選択変更時にlocalStorageにも保存
  const setSelectedModel = useCallback(
    (model: string) => {
      setSelectedModelState(model)
      if (model && reviewerConfig?.llm?.provider) {
        localStorage.setItem(SELECTED_MODEL_KEY, `${reviewerConfig.llm.provider}:${model}`)
      }
    },
    [reviewerConfig?.llm?.provider]
  )

  const getTypeNote = useCallback(
    (type: string): string => {
      const found = specTypesConfig.find((item) => item.type === type)
      if (found) return found.note
      const defaultFound = DEFAULT_SPEC_TYPES.find((item) => item.type === type)
      return defaultFound ? defaultFound.note : ''
    },
    [specTypesConfig]
  )

  const getSpecTypesList = useCallback((): string[] => {
    return specTypesConfig.map((item) => item.type)
  }, [specTypesConfig])

  const normalizePromptText = (text: string | undefined): string => {
    if (!text) return ''
    return String(text).replace(/<br\s*\/?>/gi, '\n')
  }

  const updatePromptValue = useCallback((field: keyof SystemPromptValues, value: string) => {
    setCurrentPromptValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [setCurrentPromptValues])

  const applyMappingPolicy = useCallback((policy: string) => {
    const preset = MAPPING_PRESET_CATALOG.find(p => p.id === policy)
    if (preset) {
      setCurrentPromptValues({ ...preset.systemPrompt })
    }
  }, [setCurrentPromptValues])

  const parseReviewerConfig = (content: string): ReviewerConfig => {
    const result: ReviewerConfig = {
      info: { version: '', created_at: '' },
      llm: undefined,
      specTypes: [],
      systemPrompts: [],
    }

    const llmData: Partial<LlmSettings> = {
      models: [],
    }

    const llmKeyMap: Record<string, string> = {
      api_key: 'apiKey',
      access_key_id: 'accessKeyId',
      secret_access_key: 'secretAccessKey',
      max_tokens: 'maxTokens',
    }
    const normalizeLLMKey = (key: string) => llmKeyMap[key] || key

    const lines = content.split('\n')
    let currentSection: string | null = null
    let currentSubSection: string | null = null
    let inModels = false
    let currentPrompt: Partial<SystemPromptPreset> | null = null
    let currentPromptField: string | null = null
    let currentPromptFieldContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('## ')) {
        if (currentPrompt && currentPrompt.name) {
          if (currentPromptField && currentPromptFieldContent.length > 0) {
            (currentPrompt as Record<string, unknown>)[currentPromptField] = currentPromptFieldContent.join('\n')
          }
          if (!result.systemPrompts) result.systemPrompts = []
          result.systemPrompts.push(currentPrompt as SystemPromptPreset)
          currentPrompt = null
          currentPromptField = null
          currentPromptFieldContent = []
        }

        currentSection = trimmed.substring(3).toLowerCase().trim()
        currentSubSection = null
        inModels = false
        continue
      }

      if (trimmed.startsWith('### ')) {
        if (currentPrompt && currentPrompt.name) {
          if (currentPromptField && currentPromptFieldContent.length > 0) {
            (currentPrompt as Record<string, unknown>)[currentPromptField] = currentPromptFieldContent.join('\n')
          }
          if (!result.systemPrompts) result.systemPrompts = []
          result.systemPrompts.push(currentPrompt as SystemPromptPreset)
        }

        currentSubSection = trimmed.substring(4).trim()
        currentPromptField = null
        currentPromptFieldContent = []

        if (currentSection === 'systemprompts') {
          currentPrompt = { name: currentSubSection }
        }
        continue
      }

      if (currentSection === 'systemprompts' && currentPrompt && trimmed.startsWith('#### ')) {
        if (currentPromptField && currentPromptFieldContent.length > 0) {
          (currentPrompt as Record<string, unknown>)[currentPromptField] = currentPromptFieldContent.join('\n')
        }

        const fieldName = trimmed.substring(5).toLowerCase().trim()
        currentPromptField = fieldName
        currentPromptFieldContent = []
        continue
      }

      if (currentSection === 'systemprompts' && currentPrompt && currentPromptField) {
        if (trimmed !== '') {
          currentPromptFieldContent.push(line)
        } else if (currentPromptFieldContent.length > 0) {
          currentPromptFieldContent.push('')
        }
        continue
      }

      if (currentSection === 'llm') {
        if (inModels && trimmed.startsWith('- ')) {
          const model = trimmed.substring(2).trim()
          if (model && llmData.models) {
            llmData.models.push(model)
          }
          continue
        }

        if (trimmed === '- models:') {
          inModels = true
          llmData.models = []
          continue
        }

        const match = trimmed.match(/^-\s*(\w+):\s*(.+)$/)
        if (match) {
          inModels = false
          const key = normalizeLLMKey(match[1])
          let value: string | number = match[2]

          if (key === 'maxTokens') {
            value = parseInt(value as string, 10)
          }
          (llmData as Record<string, unknown>)[key] = value
        }
      }

      if (currentSection === 'spectypes') {
        if (trimmed.startsWith('|') && !trimmed.includes('---')) {
          const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean)
          if (cells.length >= 2 && cells[0] !== '種別' && cells[0] !== 'type') {
            if (!result.specTypes) result.specTypes = []
            result.specTypes.push({
              type: cells[0],
              note: cells[1] || '',
            })
          }
        }
      }

      if (currentSection === 'info') {
        if (trimmed.startsWith('- ')) {
          const keyValue = trimmed.substring(2)
          const colonIndex = keyValue.indexOf(':')
          if (colonIndex !== -1) {
            const key = keyValue.substring(0, colonIndex).trim()
            const value = keyValue.substring(colonIndex + 1).trim()
            if (!result.info) result.info = { version: '', created_at: '' }
            if (key === 'version') {
              result.info.version = value
            } else if (key === 'generated_at' || key === 'created_at') {
              result.info.created_at = value
            }
          }
        }
      }
    }

    if (currentPrompt && currentPrompt.name) {
      if (currentPromptField && currentPromptFieldContent.length > 0) {
        (currentPrompt as Record<string, unknown>)[currentPromptField] = currentPromptFieldContent.join('\n')
      }
      if (!result.systemPrompts) result.systemPrompts = []
      result.systemPrompts.push(currentPrompt as SystemPromptPreset)
    }

    if (llmData.provider) {
      result.llm = llmData as LlmSettings
    }

    return result
  }

  const loadConfigFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md')) {
      throw new Error('Markdownファイル (.md) を選択してください')
    }

    const content = await file.text()
    const parsed = parseReviewerConfig(content)

    setReviewerConfig(parsed)
    setConfigFilename(file.name)
    setConfigModified(true)

    const llmUpdated = !!(parsed.llm && parsed.llm.provider)
    const specUpdated = !!(parsed.specTypes && parsed.specTypes.length > 0)
    const promptsUpdated = !!(parsed.systemPrompts && parsed.systemPrompts.length > 0)

    setConfigLoadStatus({
      llm: llmUpdated
        ? '・LLM設定を更新しました'
        : '・LLM設定は更新されませんでした',
      specTypes: specUpdated
        ? '・設計書種別と注意事項を更新しました'
        : '・設計書種別と注意事項は更新されませんでした',
      prompts: promptsUpdated
        ? `・システムプロンプトを更新しました（${parsed.systemPrompts?.length}件）`
        : '・システムプロンプトは更新されませんでした',
    })

    if (parsed.llm?.models && parsed.llm.models.length > 0) {
      const savedModelKey = localStorage.getItem(SELECTED_MODEL_KEY)
      let modelToSelect = parsed.llm.models[0]

      if (savedModelKey) {
        const parsed_model = parseSelectedModelKey(savedModelKey)
        if (parsed_model && parsed_model.provider === parsed.llm.provider && parsed.llm.models.includes(parsed_model.model)) {
          modelToSelect = parsed_model.model
        }
      }
      setSelectedModelState(modelToSelect)
    }
  }, [parseReviewerConfig])

  const saveConfigToBrowser = useCallback(() => {
    if (!reviewerConfig) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewerConfig))
    setConfigModified(false)
  }, [reviewerConfig])

  const clearSavedConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SELECTED_MODEL_KEY)
    localStorage.removeItem(SELECTED_PROMPT_KEY)
    setReviewerConfig(null)
    setConfigFilename(null)
    setConfigModified(false)
    setConfigLoadStatus(null)
    setSelectedModelState('')
  }, [])

  const hasSavedConfig = useCallback((): boolean => {
    return localStorage.getItem(STORAGE_KEY) !== null
  }, [])

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY)
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as ReviewerConfig
        setReviewerConfig(parsed)
        setConfigFilename('保存済み設定')
        setConfigModified(false)

        const llmUpdated = !!(parsed.llm && parsed.llm.provider)
        const specUpdated = !!(parsed.specTypes && parsed.specTypes.length > 0)
        const promptsUpdated = !!(parsed.systemPrompts && parsed.systemPrompts.length > 0)

        setConfigLoadStatus({
          llm: llmUpdated
            ? '・LLM設定を読み込みました'
            : '・LLM設定は設定されていません',
          specTypes: specUpdated
            ? '・設計書種別と注意事項を読み込みました'
            : '・設計書種別と注意事項は設定されていません',
          prompts: promptsUpdated
            ? `・システムプロンプトを読み込みました（${parsed.systemPrompts?.length}件）`
            : '・システムプロンプトは設定されていません',
        })

        if (parsed.llm?.models && parsed.llm.models.length > 0) {
          const savedModelKey = localStorage.getItem(SELECTED_MODEL_KEY)
          let modelToSelect = parsed.llm.models[0]

          if (savedModelKey) {
            const parsed_model = parseSelectedModelKey(savedModelKey)
            if (parsed_model && parsed_model.provider === parsed.llm.provider && parsed.llm.models.includes(parsed_model.model)) {
              modelToSelect = parsed_model.model
            }
          }
          setSelectedModelState(modelToSelect)
        }

        // 保存されたプリセット名を復元
        const savedPreset = localStorage.getItem(SELECTED_PROMPT_KEY)
        if (savedPreset) {
          // マッピングカタログ + 設定ファイルのプリセットから検索
          const catalogPresets: SystemPromptPreset[] = MAPPING_PRESET_CATALOG.map((preset) => ({
            name: preset.name,
            role: preset.systemPrompt.role,
            purpose: preset.systemPrompt.purpose,
            format: preset.systemPrompt.format,
            notes: preset.systemPrompt.notes,
          }))
          const configPrompts = parsed.systemPrompts || []
          const allPresets = [...catalogPresets, ...configPrompts]
          const preset = allPresets.find((p) => p.name === savedPreset)
          if (preset) {
            setCurrentPromptValues({
              role: normalizePromptText(preset.role),
              purpose: normalizePromptText(preset.purpose),
              format: normalizePromptText(preset.format),
              notes: normalizePromptText(preset.notes),
            })
          }
          // マッチしない場合はマッピングカタログの初期値（useState）を維持
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [setCurrentPromptValues])

  // 保存設定がない場合のフォールバック
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY)
    if (savedConfig) return

    if (systemPromptPresets.length > 0) {
      const savedPreset = localStorage.getItem(SELECTED_PROMPT_KEY)
      // マッピングカタログ + システムプロンプトプリセットから検索
      const catalogPresets: SystemPromptPreset[] = MAPPING_PRESET_CATALOG.map((preset) => ({
        name: preset.name,
        role: preset.systemPrompt.role,
        purpose: preset.systemPrompt.purpose,
        format: preset.systemPrompt.format,
        notes: preset.systemPrompt.notes,
      }))
      const allPresets = [...catalogPresets, ...systemPromptPresets]
      const preset = savedPreset
        ? allPresets.find(p => p.name === savedPreset)
        : undefined
      if (preset) {
        setCurrentPromptValues({
          role: normalizePromptText(preset.role),
          purpose: normalizePromptText(preset.purpose),
          format: normalizePromptText(preset.format),
          notes: normalizePromptText(preset.notes),
        })
      }
      // マッチしない場合はマッピングカタログの初期値（useState）を維持
    }
  }, [systemPromptPresets, setCurrentPromptValues])

  return {
    llmConfig,
    selectedModel,
    setSelectedModel,
    specTypesConfig,
    getTypeNote,
    getSpecTypesList,
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
  }
}
