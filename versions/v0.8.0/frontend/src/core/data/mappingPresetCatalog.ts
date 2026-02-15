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
  '- 【重要】必ず指定されたJSON形式のみで応答してください。JSON以外のテキストは含めないでください。',
  '- 【重要】出力するdoc_sections、code_symbolsのidは、設計書とコードのMAP.jsonに記載されたid値を正確にそのまま使用してください（例: MD1, MD2, CD1, CD2, ...）',
  '- マッピングは多対多の場合もあります。1つの設計書セクションが複数グループに、1つのコードシンボルが複数グループに含まれる場合があります。',
  '- 設計書構造は見出し単位でセクション分割されたものです。',
  '- コード構造はクラスまたはメソッド単位のシンボルです。（例: "symbol: UserService#registerUser"、type: class/method）',
  '- INDEX.mdにはセクションやシンボルの階層構造、概要（summary）、呼び出し関係（calls）などの補足情報が含まれます。',
  '- 文字数が少ないセクションやシンボルは、単独では情報が乏しいため、関連する他の項目と合わせてグループ化を検討してください。',
].join('\n')

// 共通の役割
const BASE_ROLE = '設計書とソースコードの構造を分析しマッピングする専門家です。'

// 共通の目的（ベース）
const BASE_PURPOSE = '設計書とコードの構造を分析し、関連する設計書セクションとコードシンボルをマッピングして、グループにまとめてください。\n'
  + '1つのグループには、同じ機能や責務に関わる複数の設計書セクションと複数のコードシンボルを含めます。\n\n'
  + '以下の2種類のデータが提供されます。\n\n'
  + '1. 設計書構造（1ファイル分）\n'
  + '  - INDEX.md: セクションの階層ツリーと概要（summary）\n'
  + '  - MAP.json: 各セクションのid・セクション名・階層レベル・パス・行範囲・文字数\n'
  + '2. コード構造（ファイル単位で複数ファイル分）\n'
  + '  - INDEX.md: クラス・メソッドの一覧と役割（role）・呼び出し関係（calls）\n'
  + '  - MAP.json: 各シンボルのid・シンボル名・種別（class/method）・ファイル名・行範囲\n'

export const MAPPING_PRESET_CATALOG: MappingPreset[] = [
  {
    id: 'standard',
    name: '標準 (LLM)',
    description: 'AIが文脈を分析して柔軟に関連付けます。',
    systemPrompt: {
      role: BASE_ROLE,
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
      role: BASE_ROLE,
      purpose: BASE_PURPOSE + '\n\n'
        + '【重要】設計書やコード内に元々記載されているID・名称の一致を最優先してください。\n'
        + '例えば、設計書のセクションタイトルや概要（summary）に言及されているクラス名・メソッド名・項番と、'
        + 'コードのシンボル名（クラス名、メソッド名）が直接対応する場合を優先してマッチングしてください。\n'
        + '推測によるマッピングは最小限に抑えてください。',
      format: COMMON_OUTPUT_FORMAT,
      notes: BASE_NOTES + '\n'
        + '- 設計書内に記載されたクラス名・メソッド名・項番等と、コードのシンボル名が直接一致する場合を最優先してください。\n'
        + '- 名称の一致が見られない場合は、推測によるマッピングを最小限に抑え、明確な対応関係がある場合のみグループ化してください。\n'
        + '- MD1, CD1等のIDはツールが自動付与した連番であり、設計書やコードの内容とは無関係です。マッチングの根拠にしないでください。',
    },
  },
  {
    id: 'detailed',
    name: '詳細 (内容参照)',
    description: 'セクションの内容も一部参照して精度を高めます（トークン消費量が増えます）。',
    systemPrompt: {
      role: BASE_ROLE,
      purpose: BASE_PURPOSE + '\n\n'
        + '【重要】構造だけでなく、INDEX.mdに記載された概要テキスト（summary、role）も参照して、'
        + '意味的に関連の深いセクションとシンボルを網羅的にグループ化してください。',
      format: COMMON_OUTPUT_FORMAT,
      notes: BASE_NOTES + '\n'
        + '- INDEX.mdの概要（summary）やシンボルの役割（role）を積極的に参照し、意味的に関連の深いセクションとシンボルを網羅的にグループ化してください。\n'
        + '- 構造的な対応だけでなく、機能的・意味的な関連性も考慮してください。',
    },
  },
]
