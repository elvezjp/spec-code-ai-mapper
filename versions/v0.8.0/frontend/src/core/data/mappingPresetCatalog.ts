import type { PresetPrompt } from '@core/types'

export interface MappingPreset {
  id: string
  name: string
  description: string
  systemPrompt: PresetPrompt
}

export const DEFAULT_MAPPING_PRESET_ID = 'standard'

// 共通の出力形式（JSON）
const COMMON_OUTPUT_FORMAT = `以下のJSON形式で出力してください:

\`\`\`json
{
  "groups": [
    {
      "id": "group1",
      "name": "グループの表示名",
      "doc_sections": [
        {
          "id": "MAP.jsonのid値をそのまま使用（例: MD1）",
          "title": "MAP.jsonのtitle値",
          "path": "MAP.jsonのpath値"
        }
      ],
      "code_symbols": [
        {
          "id": "MAP.jsonのid値をそのまま使用（例: CD1）",
          "filename": "MAP.jsonのoriginal_file値",
          "symbol": "MAP.jsonのsymbol値"
        }
      ],
      "reason": "グループ化の理由"
    }
  ]
}
\`\`\``

// 共通の注意事項（ベース）
const BASE_NOTES = [
  '- 必ず指定されたJSON形式のみで応答してください',
  '- 設計書の複数セクションと、複数のコード部分が、1つのグループに対応する場合もあります。',
  '- 同じ設計書セクション、コード部分が、複数のグループに対応する場合もあります。',
  '- 文字数の少ないセクション、コードシンボルは、情報が含まれていない可能性があります。他の部分と合わせてグループ化を検討してください。',
  '- 【重要】出力するdoc_sectionsのidは、設計書MAP.jsonに記載されたid値を正確にそのまま使用してください（例: MD1, MD2, ...）',
  '- 【重要】出力するcode_symbolsのidは、コードMAP.jsonに記載されたid値を正確にそのまま使用してください（例: CD1, CD2, ...）',
].join('\n')

// 共通の目的（ベース）
const BASE_PURPOSE = '設計書の構造（セクション一覧）とコードの構造（シンボル一覧）を比較し、'
  + '関連性の高い設計書セクションとコードシンボルをグループにまとめてください。'

export const MAPPING_PRESET_CATALOG: MappingPreset[] = [
  {
    id: 'standard',
    name: '標準 (LLM)',
    description: 'AIが文脈を分析して柔軟に関連付けます。',
    systemPrompt: {
      role: '設計書とソースコードの構造を分析する専門家',
      purpose: BASE_PURPOSE,
      format: COMMON_OUTPUT_FORMAT,
      notes: BASE_NOTES,
    },
  },
  {
    id: 'strict',
    name: '厳密 (ID重視)',
    description: 'IDやシンボル名の一致を優先します。トレーサビリティが明確な場合に適しています。',
    systemPrompt: {
      role: '設計書とソースコードの構造を分析する専門家',
      purpose: BASE_PURPOSE + '\n\n'
        + '【重要】厳密モード: IDやシンボル名の一致を最優先してください。'
        + '設計書の「セクションID」やコードの「型/名前」を厳密にマッチングさせ、'
        + '推測によるマッピングを最小限に抑えてください。',
      format: COMMON_OUTPUT_FORMAT,
      notes: BASE_NOTES + '\n'
        + '- 【厳密モード】セクションIDやシンボル名が直接対応する場合を最優先してマッチングしてください。\n'
        + '- 【厳密モード】推測によるマッピングは最小限に抑え、明確な対応関係がある場合のみグループ化してください。',
    },
  },
  {
    id: 'detailed',
    name: '詳細 (内容参照)',
    description: 'セクションの内容も一部参照して精度を高めます（トークン消費量が増えます）。',
    systemPrompt: {
      role: '設計書とソースコードの構造を分析し、意味的な関連性も考慮する専門家',
      purpose: BASE_PURPOSE + '\n\n'
        + '【重要】詳細モード: 構造だけでなく、提供されたMAP情報の概要テキストも参照して、'
        + '意味的に関連の深いセクションとシンボルを網羅的にグループ化してください。',
      format: COMMON_OUTPUT_FORMAT,
      notes: BASE_NOTES + '\n'
        + '- 【詳細モード】INDEX.mdに記載された概要テキストも参照して、意味的に関連の深いセクションとシンボルを網羅的にグループ化してください。\n'
        + '- 【詳細モード】構造的な対応だけでなく、機能的・意味的な関連性も考慮してください。',
    },
  },
]
