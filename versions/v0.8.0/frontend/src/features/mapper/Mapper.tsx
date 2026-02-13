import { useState, useCallback } from 'react'
import { Layout, Header, Card, Button, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@core/index'
import { Download, RefreshCw, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSharedState } from '@/core/contexts/SharedStateContext'
import { executeStructureMatching } from '@/features/reviewer/services/api'
import type { MatchedGroup } from '../reviewer/types'

export function Mapper() {
    const {
        specMarkdown,
        specFiles,
        codeFiles,
        codeWithLineNumbers,
        splitPreviewResult,
        mappingResult,
        setMappingResult,
        llmConfig,
        currentPromptValues
    } = useSharedState()
    const [isMapping, setIsMapping] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleMapping = useCallback(async () => {
        if (!splitPreviewResult || !specMarkdown) {
            setError('設計書とコードを変換し、分割プレビューを先に実行してください。')
            return
        }

        setIsMapping(true)
        setError(null)

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
                setError(response.error || 'マッピングに失敗しました。')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました。')
        } finally {
            setIsMapping(false)
        }
    }, [splitPreviewResult, specMarkdown, codeFiles, currentPromptValues, llmConfig, setMappingResult])

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

    return (
        <Layout>
            <Header
                title="AI Mapper"
                subtitle="設計書とプログラムの紐付けツール"
                rightContent={
                    <div className="flex gap-2">
                        <Link to="/">
                            <Button variant="secondary" size="sm">Reviewerに戻る</Button>
                        </Link>
                    </div>
                }
            />

            {error && (
                <Card className="mb-6 bg-red-50 border-red-200">
                    <p className="text-red-600 text-sm">{error}</p>
                </Card>
            )}

            <Card className="mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-500" />
                        Traceability Matrix
                    </h2>
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleMapping}
                            disabled={isMapping || !specMarkdown || !codeWithLineNumbers}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isMapping ? 'animate-spin' : ''}`} />
                            再マッチング
                        </Button>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleExportMarkdown}
                            disabled={!mappingResult}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Markdown出力
                        </Button>
                    </div>
                </div>

                {mappingResult ? (
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
                ) : (
                    <div className="py-20 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="mb-4">マッピングデータがありません。</p>
                        <p className="text-sm">Reviewerページで分割プレビューを実行した後、マッピングを開始してください。</p>
                    </div>
                )}
            </Card>
        </Layout>
    )
}
