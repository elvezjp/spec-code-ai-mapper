import { useCallback } from 'react'

interface UseZipExportReturn {
  downloadSpecMarkdown: (markdown: string) => void
  downloadCodeWithLineNumbers: (code: string) => void
}

export function useZipExport(): UseZipExportReturn {
  const downloadSpecMarkdown = useCallback((markdown: string) => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spec-markdown.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadCodeWithLineNumbers = useCallback((code: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'code-numbered.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    downloadSpecMarkdown,
    downloadCodeWithLineNumbers,
  }
}
