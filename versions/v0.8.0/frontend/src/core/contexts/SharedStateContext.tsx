import React, { createContext, useContext, useState, ReactNode } from 'react'
import type {
    DesignFile,
    CodeFile,
    SplitSettings,
    SplitPreviewResult,
    MatchedGroup,
    LlmConfig,
    SystemPromptValues
} from '@/features/reviewer/types'
import { DEFAULT_SYSTEM_PROMPTS, DEFAULT_LLM_SETTINGS } from '../hooks/useSettings'

interface SharedState {
    // Files
    specFiles: DesignFile[]
    setSpecFiles: React.Dispatch<React.SetStateAction<DesignFile[]>>
    specMarkdown: string | null
    setSpecMarkdown: React.Dispatch<React.SetStateAction<string | null>>

    codeFiles: CodeFile[]
    setCodeFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>
    codeWithLineNumbers: string | null
    setCodeWithLineNumbers: React.Dispatch<React.SetStateAction<string | null>>

    // Split & Mapping
    splitSettings: SplitSettings
    setSplitSettings: React.Dispatch<React.SetStateAction<SplitSettings>>
    splitPreviewResult: SplitPreviewResult | null
    setSplitPreviewResult: React.Dispatch<React.SetStateAction<SplitPreviewResult | null>>
    mappingResult: MatchedGroup[] | null
    setMappingResult: React.Dispatch<React.SetStateAction<MatchedGroup[] | null>>

    // Config
    llmConfig: LlmConfig
    setLlmConfig: React.Dispatch<React.SetStateAction<LlmConfig>>
    currentPromptValues: SystemPromptValues
    setCurrentPromptValues: React.Dispatch<React.SetStateAction<SystemPromptValues>>
}

const SharedStateContext = createContext<SharedState | undefined>(undefined)

export function SharedStateProvider({ children }: { children: ReactNode }) {
    const [specFiles, setSpecFiles] = useState<DesignFile[]>([])
    const [specMarkdown, setSpecMarkdown] = useState<string | null>(null)
    const [codeFiles, setCodeFiles] = useState<CodeFile[]>([])
    const [codeWithLineNumbers, setCodeWithLineNumbers] = useState<string | null>(null)

    const [splitSettings, setSplitSettings] = useState<SplitSettings>({
        documentMode: 'batch',
        documentMaxDepth: 2,
        codeMode: 'batch',
    })
    const [splitPreviewResult, setSplitPreviewResult] = useState<SplitPreviewResult | null>(null)
    const [mappingResult, setMappingResult] = useState<MatchedGroup[] | null>(null)

    const [llmConfig, setLlmConfig] = useState<LlmConfig>(DEFAULT_LLM_SETTINGS)
    const [currentPromptValues, setCurrentPromptValues] = useState<SystemPromptValues>(DEFAULT_SYSTEM_PROMPTS)

    return (
        <SharedStateContext.Provider
            value={{
                specFiles,
                setSpecFiles,
                specMarkdown,
                setSpecMarkdown,
                codeFiles,
                setCodeFiles,
                codeWithLineNumbers,
                setCodeWithLineNumbers,
                splitSettings,
                setSplitSettings,
                splitPreviewResult,
                setSplitPreviewResult,
                mappingResult,
                setMappingResult,
                llmConfig,
                setLlmConfig,
                currentPromptValues,
                setCurrentPromptValues,
            }}
        >
            {children}
        </SharedStateContext.Provider>
    )
}

export function useSharedState() {
    const context = useContext(SharedStateContext)
    if (context === undefined) {
        throw new Error('useSharedState must be used within a SharedStateProvider')
    }
    return context
}
