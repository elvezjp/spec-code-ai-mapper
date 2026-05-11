import { useState, useCallback, useEffect } from 'react'
import type { Settings, LlmSettings, SpecType, SystemPromptPreset, ReviewerConfig } from '../types'

const STORAGE_KEY = 'reviewer-settings'

// デフォルトのLLM設定
const DEFAULT_LLM_SETTINGS: LlmSettings = {
  provider: 'bedrock',
  maxTokens: 10000,
  models: [],
  selectedModel: undefined,
}

// デフォルトの設計書種別
const DEFAULT_SPEC_TYPES: SpecType[] = [
  { type: '基本設計書', note: '画面レイアウト、項目定義、イベント処理などを中心に記載されたドキュメント' },
  { type: '詳細設計書', note: '関数レベルのロジック、データ構造、アルゴリズムなどが詳細に記載されたドキュメント' },
  { type: 'API仕様書', note: 'エンドポイント、リクエストパラメータ、レスポンス形式が記載されたドキュメント' }
]

// デフォルトのシステムプロンプト
const DEFAULT_SYSTEM_PROMPTS: SystemPromptPreset[] = [
  {
    name: '標準レビュー',
    role: '設計書とソースコードの整合性をレビューする専門家',
    purpose: '設計書の記述とソースコードの実装が一致しているか、漏れや誤りがないかを確認する',
    format: 'マークダウン形式で、サマリー、突合結果、詳細の順に報告してください。',
    notes: '未実装の項目や、設計書にない独自の実装、名称の不一致などを重点的に確認してください。'
  }
]

const DEFAULT_SETTINGS: Settings = {
  llm: DEFAULT_LLM_SETTINGS,
  specTypes: DEFAULT_SPEC_TYPES,
  systemPrompts: DEFAULT_SYSTEM_PROMPTS,
}

interface UseSettingsReturn {
  settings: Settings
  updateLlmSettings: (llm: Partial<LlmSettings>) => void
  updateSpecTypes: (specTypes: SpecType[]) => void
  updateSystemPrompts: (prompts: SystemPromptPreset[]) => void
  loadFromConfig: (config: ReviewerConfig) => void
  saveToStorage: () => void
  clearStorage: () => void
  isModified: boolean
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isModified, setIsModified] = useState(false)

  // 初期読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<Settings>
        setSettings({
          llm: { ...DEFAULT_LLM_SETTINGS, ...parsed.llm },
          specTypes: parsed.specTypes || DEFAULT_SPEC_TYPES,
          systemPrompts: parsed.systemPrompts || DEFAULT_SYSTEM_PROMPTS,
        })
      } catch {
        // パース失敗時はデフォルト値を使用
      }
    }
  }, [])

  const updateLlmSettings = useCallback((llm: Partial<LlmSettings>) => {
    setSettings((prev) => ({
      ...prev,
      llm: { ...prev.llm, ...llm },
    }))
    setIsModified(true)
  }, [])

  const updateSpecTypes = useCallback((specTypes: SpecType[]) => {
    setSettings((prev) => ({ ...prev, specTypes }))
    setIsModified(true)
  }, [])

  const updateSystemPrompts = useCallback((prompts: SystemPromptPreset[]) => {
    setSettings((prev) => ({ ...prev, systemPrompts: prompts }))
    setIsModified(true)
  }, [])

  const loadFromConfig = useCallback((config: ReviewerConfig) => {
    setSettings((prev) => ({
      llm: config.llm ? { ...prev.llm, ...config.llm } : prev.llm,
      specTypes: config.specTypes || prev.specTypes,
      systemPrompts: config.systemPrompts || prev.systemPrompts,
    }))
    setIsModified(true)
  }, [])

  const saveToStorage = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setIsModified(false)
  }, [settings])

  const clearStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSettings(DEFAULT_SETTINGS)
    setIsModified(false)
  }, [])

  return {
    settings,
    updateLlmSettings,
    updateSpecTypes,
    updateSystemPrompts,
    loadFromConfig,
    saveToStorage,
    clearStorage,
    isModified,
  }
}

export { DEFAULT_SPEC_TYPES, DEFAULT_SYSTEM_PROMPTS, DEFAULT_LLM_SETTINGS }
