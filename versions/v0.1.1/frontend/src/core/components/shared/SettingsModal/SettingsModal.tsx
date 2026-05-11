import type { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { Modal } from '../../ui/Modal'
import { ProgramInfoSection } from './ProgramInfoSection'
import { ConfigFileSection } from './ConfigFileSection'
import { LlmSettingsSection, type TestConnectionResult } from './LlmSettingsSection'
import type { AppInfo, LlmSettings } from '../../../types'

interface SettingsModalSections {
  programInfo?: boolean
  configFile?: boolean
  llmSettings?: boolean
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  appInfo: AppInfo
  sections?: SettingsModalSections
  // 設定ファイルセクション用
  onConfigFileLoad?: (content: string, filename: string) => void
  onSaveToStorage?: () => void
  onClearStorage?: () => void
  loadedConfigFilename?: string
  configLoadStatus?: {
    llm?: string
    specTypes?: string
    prompts?: string
  }
  configFileGeneratorUrl?: string
  isConfigSavedToBrowser?: boolean
  isConfigModified?: boolean
  // LLM設定セクション用
  llmSettings?: LlmSettings
  onModelChange?: (model: string) => void
  onTestConnection?: () => Promise<TestConnectionResult>
  isSystemFallback?: boolean
  // 拡張セクション
  extensionSections?: ReactNode[]
}

const defaultSections: SettingsModalSections = {
  programInfo: true,
  configFile: true,
  llmSettings: true,
}

export function SettingsModal({
  isOpen,
  onClose,
  appInfo,
  sections = defaultSections,
  onConfigFileLoad,
  onSaveToStorage,
  onClearStorage,
  loadedConfigFilename,
  configLoadStatus,
  configFileGeneratorUrl,
  isConfigSavedToBrowser,
  isConfigModified,
  llmSettings,
  onModelChange,
  onTestConnection,
  isSystemFallback,
  extensionSections,
}: SettingsModalProps) {
  const mergedSections = { ...defaultSections, ...sections }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<span className="flex items-center gap-2"><Settings className="w-5 h-5" /> 設定</span>}>
      {/* プログラム情報 */}
      {mergedSections.programInfo && <ProgramInfoSection appInfo={appInfo} />}

      {/* 設定ファイル */}
      {mergedSections.configFile &&
        onConfigFileLoad &&
        onSaveToStorage &&
        onClearStorage && (
          <ConfigFileSection
            onFileLoad={onConfigFileLoad}
            onSaveToBrowser={onSaveToStorage}
            onClearSaved={onClearStorage}
            loadedFilename={loadedConfigFilename}
            loadStatus={configLoadStatus}
            generatorUrl={configFileGeneratorUrl}
            isSavedToBrowser={isConfigSavedToBrowser}
            isModified={isConfigModified}
          />
        )}

      {/* LLM設定 */}
      {mergedSections.llmSettings &&
        onModelChange &&
        onTestConnection && (
          <LlmSettingsSection
            settings={llmSettings}
            onModelChange={onModelChange}
            onTestConnection={onTestConnection}
            isSystemFallback={isSystemFallback}
          />
        )}


      {/* 拡張セクション */}
      {extensionSections?.map((section, index) => (
        <div key={index}>{section}</div>
      ))}
    </Modal>
  )
}
