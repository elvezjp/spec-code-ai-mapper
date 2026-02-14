import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useZipExport } from '@features/reviewer/hooks/useZipExport'

// DOM APIのモック
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
const mockClick = vi.fn()

// 元のcreateElementを保存
const originalCreateElement = document.createElement.bind(document)

beforeEach(() => {
  vi.clearAllMocks()

  // URL APIのモック
  global.URL.createObjectURL = mockCreateObjectURL
  global.URL.revokeObjectURL = mockRevokeObjectURL

  // document.createElementのモック（aタグのみ）
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
        setAttribute: vi.fn(),
        style: {},
      } as unknown as HTMLAnchorElement
    }
    // それ以外は元の実装を使用
    return originalCreateElement(tagName)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useZipExport', () => {
  describe('downloadSpecMarkdown', () => {
    it('設計書マークダウンをダウンロードできる', () => {
      const { result } = renderHook(() => useZipExport())

      result.current.downloadSpecMarkdown('# Spec Markdown')

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  describe('downloadCodeWithLineNumbers', () => {
    it('行番号付きコードをダウンロードできる', () => {
      const { result } = renderHook(() => useZipExport())

      result.current.downloadCodeWithLineNumbers('1: function main() {}')

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })
})
