import { RotateCcw } from 'lucide-react'

interface MappingExecutingScreenProps {
  isExecuting: boolean
  error: string | null
  onBack: () => void
  onRetry: () => void
}

export function MappingExecutingScreen({
  isExecuting,
  error,
  onBack,
  onRetry,
}: MappingExecutingScreenProps) {
  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">マッピング実行中</h1>
          <button onClick={onBack} className="text-blue-500 hover:text-blue-700">
            &larr; 戻る
          </button>
        </div>
      </div>

      {/* Progress / Error */}
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        {isExecuting && !error && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">AIがマッピングを実行中...</p>
            <p className="text-gray-400 mt-2">
              設計書とコードの対応関係を分析しています
            </p>
            <p className="text-gray-400 text-xs mt-4">
              ※ 5分以上かかる場合はタイムアウトする可能性があります
            </p>
          </>
        )}

        {error && (
          <>
            <p className="text-red-600 text-lg mb-2">エラーが発生しました</p>
            <p className="text-sm text-red-500 mb-6">{error}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition"
            >
              <RotateCcw className="w-4 h-4" />
              リトライ
            </button>
          </>
        )}
      </div>
    </>
  )
}
