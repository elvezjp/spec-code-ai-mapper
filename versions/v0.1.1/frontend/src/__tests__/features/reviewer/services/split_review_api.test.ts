/**
 * Split Review API (v0.8.0) の単体テスト
 *
 * テストケース:
 * - UT-SRVA-001: executeStructureMatching() - 正常系（基本的なマッチング）
 * - UT-SRVA-002: executeStructureMatching() - 正常系（複数グループ）
 * - UT-SRVA-003: executeStructureMatching() - エラー（JSON解析失敗）
 * - UT-SRVA-004: executeStructureMatching() - LLM設定あり
 * - UT-SRVA-005: executeStructureMatching() - ネットワークエラー
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  executeStructureMatching,
} from '@features/reviewer/services/api'

// fetchのモック
global.fetch = vi.fn()

describe('executeStructureMatching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('UT-SRVA-001: 正常系（基本的なマッチング）', async () => {
    const mockResponse = {
      success: true,
      groups: [
        {
          groupId: 'group1',
          groupName: 'ユーザー管理',
          docSections: [
            { id: 'MD1', title: 'ユーザー管理機能', path: 'ユーザー管理機能' },
          ],
          codeSymbols: [
            { id: 'CD1', filename: 'user_service.py', symbol: 'UserService' },
          ],
          reason: 'ユーザー管理に関連する設計とコード',
          estimatedTokens: 500,
        },
      ],
      totalGroups: 1,
      tokensUsed: { input: 1000, output: 200 },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    const result = await executeStructureMatching({
      document: {
        indexMd: '# INDEX\n- MD1: ユーザー管理機能',
        mapJson: { sections: [] },
      },
      codeFiles: [
        {
          filename: 'user_service.py',
          indexMd: '# CODE INDEX\n- CD1: UserService',
          mapJson: { symbols: [] },
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.totalGroups).toBe(1)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].groupId).toBe('group1')
    expect(result.groups[0].groupName).toBe('ユーザー管理')
    expect(result.groups[0].docSections).toHaveLength(1)
    expect(result.groups[0].codeSymbols).toHaveLength(1)
    expect(result.tokensUsed?.input).toBe(1000)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/review/structure-matching',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('UT-SRVA-002: 正常系（複数グループ）', async () => {
    const mockResponse = {
      success: true,
      groups: [
        {
          groupId: 'group1',
          groupName: 'ユーザー管理',
          docSections: [{ id: 'MD1', title: 'ユーザー管理', path: 'ユーザー管理' }],
          codeSymbols: [{ id: 'CD1', filename: 'user.py', symbol: 'User' }],
          reason: 'ユーザー管理',
          estimatedTokens: 300,
        },
        {
          groupId: 'group2',
          groupName: '認証機能',
          docSections: [{ id: 'MD2', title: '認証', path: '認証' }],
          codeSymbols: [{ id: 'CD2', filename: 'auth.py', symbol: 'Auth' }],
          reason: '認証機能',
          estimatedTokens: 400,
        },
      ],
      totalGroups: 2,
      tokensUsed: { input: 1500, output: 300 },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    const result = await executeStructureMatching({
      document: {
        indexMd: '# INDEX',
        mapJson: { sections: [] },
      },
      codeFiles: [],
    })

    expect(result.success).toBe(true)
    expect(result.totalGroups).toBe(2)
    expect(result.groups).toHaveLength(2)
    expect(result.groups[0].groupName).toBe('ユーザー管理')
    expect(result.groups[1].groupName).toBe('認証機能')
  })

  it('UT-SRVA-003: エラー（JSON解析失敗）', async () => {
    const mockResponse = {
      success: false,
      groups: [],
      totalGroups: 0,
      error: 'AIの応答をJSONとして解析できませんでした: Unexpected token',
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    const result = await executeStructureMatching({
      document: {
        indexMd: '# INDEX',
        mapJson: { sections: [] },
      },
      codeFiles: [],
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('JSON')
  })

  it('UT-SRVA-004: LLM設定あり', async () => {
    const mockResponse = {
      success: true,
      groups: [],
      totalGroups: 0,
      tokensUsed: { input: 500, output: 100 },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    await executeStructureMatching({
      document: {
        indexMd: '# INDEX',
        mapJson: { sections: [] },
      },
      codeFiles: [],
      llmConfig: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 16384,
        apiKey: 'test-api-key',
      },
    })

    const callArgs = (global.fetch as any).mock.calls[0]
    const requestBody = JSON.parse(callArgs[1].body)

    expect(requestBody.llmConfig).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 16384,
      apiKey: 'test-api-key',
    })
  })

  it('UT-SRVA-005: ネットワークエラー', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    await expect(
      executeStructureMatching({
        document: {
          indexMd: '# INDEX',
          mapJson: { sections: [] },
        },
        codeFiles: [],
      })
    ).rejects.toThrow('Network error')
  })
})
