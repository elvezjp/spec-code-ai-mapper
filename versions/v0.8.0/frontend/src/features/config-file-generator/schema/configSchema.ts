import type { ConfigSchema } from '../types'

export const CONFIG_SCHEMA: ConfigSchema = {
  meta: {
    outputTitle: '設計書-Javaプログラム突合 AIレビュアー 設定ファイル',
    outputFileName: 'reviewer-config.md',
    version: 'v0.8.0',
  },
  sections: [
    {
      id: 'info',
      title: 'info',
      description: '設定ファイル情報',
      outputFormat: 'list',
      fields: [
        {
          id: 'version',
          label: 'version',
          type: 'fixed',
          value: 'v0.8.0',
        },
        {
          id: 'created_at',
          label: 'created_at',
          type: 'auto',
          generator: 'timestamp_iso8601',
        },
      ],
    },
    {
      id: 'llm',
      title: 'llm',
      description: 'LLMプロバイダー設定',
      outputFormat: 'list',
      conditional: {
        switchField: 'provider',
        cases: {
          anthropic: {
            fields: [
              { id: 'provider', type: 'fixed', value: 'anthropic' },
              { id: 'apiKey', label: 'API Key', type: 'password', required: true },
              { id: 'maxTokens', label: 'Max Tokens', type: 'number', default: 16384, required: true },
              {
                id: 'models',
                label: 'モデル',
                type: 'array',
                itemType: 'text',
                placeholder: 'claude-sonnet-4-5-20250929',
                defaults: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'],
              },
            ],
          },
          bedrock: {
            notes: [
              'モデルIDにはリージョンプレフィックス（例: us., apac., global.）が必要です。',
              'モデルによって設定可能な出力トークン上限が異なります（例: Nova系は10,000、Claude系は最大128,000）。',
              '設定可能な上限値を超えた出力トークン数を指定した場合、エラーが発生します。',
            ],
            fields: [
              { id: 'provider', type: 'fixed', value: 'bedrock' },
              { id: 'accessKeyId', label: 'Access Key ID', type: 'password', required: true },
              { id: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
              { id: 'region', label: 'Region', type: 'text', default: 'ap-northeast-1', required: true },
              { id: 'maxTokens', label: 'Max Tokens', type: 'number', default: 10000, required: true },
              {
                id: 'models',
                label: 'モデル',
                type: 'array',
                itemType: 'text',
                placeholder: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
                defaults: [
                  'global.anthropic.claude-haiku-4-5-20251001-v1:0',
                  'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                  'apac.amazon.nova-pro-v1:0',
                  'apac.amazon.nova-micro-v1:0',
                ],
              },
            ],
          },
          openai: {
            fields: [
              { id: 'provider', type: 'fixed', value: 'openai' },
              { id: 'apiKey', label: 'API Key', type: 'password', required: true },
              { id: 'maxTokens', label: 'Max Tokens', type: 'number', default: 16384, required: true },
              {
                id: 'models',
                label: 'モデル',
                type: 'array',
                itemType: 'text',
                placeholder: 'gpt-5.2',
                defaults: ['gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5.2-pro', 'gpt-5.1', 'gpt-4o', 'gpt-4o-mini'],
              },
            ],
          },
        },
      },
    },
    {
      id: 'specTypes',
      title: 'specTypes',
      description: '設計書種別',
      outputFormat: 'table',
      columns: [
        { id: 'type', label: '種別', type: 'text', width: '30%' },
        { id: 'note', label: '注意事項', type: 'text', width: '70%' },
      ],
      defaults: [
        { type: '設計書', note: '機能仕様が正しく実装されているかを確認してください' },
        { type: '要件定義書', note: '要件が漏れなく実装されているかを確認してください' },
        { type: '処理ロジック', note: '処理手順やアルゴリズムが正しく実装されているかを確認してください' },
        { type: '処理フロー', note: '処理の流れが正しく実装されているかを確認してください' },
        { type: 'コーディング規約', note: 'コードがこの規約に準拠しているかを確認してください' },
        { type: 'ネーミングルール', note: '命名規則に従っているかを確認してください' },
        { type: '製造ガイド', note: 'このガイドラインに従って実装されているかを確認してください' },
        { type: '設計ガイド', note: 'この設計方針に従って実装されているかを確認してください' },
        { type: '設計書とソースのマッピング', note: 'このマッピングに基づいて突合を行ってください' },
      ],
      editable: true,
      minRows: 0,
    },
    {
      id: 'systemPrompts',
      title: 'systemPrompts',
      description: 'システムプロンプトのプリセット定義',
      outputFormat: 'sections',
      itemKey: 'name',
      fields: [
        { id: 'name', label: 'プリセット名' },
        { id: 'role', label: '役割', rows: 2 },
        { id: 'purpose', label: '目的', rows: 6 },
        { id: 'format', label: 'フォーマット', rows: 4 },
        { id: 'notes', label: '注意事項', rows: 6 },
      ],
      defaults: [
        {
          name: '標準マッピングプリセット',
          role: '設計書とソースコードの構造を分析しマッピングする専門家です。',
          purpose: `設計書とコードの構造を分析し、関連する設計書セクションとコードシンボルをマッピングして、グループにまとめてください。
1つのグループには、同じ機能や責務に関わる複数の設計書セクションと複数のコードシンボルを含めます。

以下の2種類のデータが提供されます。

1. 設計書構造（1ファイル分）
  - INDEX.md: セクションの階層ツリーと概要（summary）
  - MAP.json: 各セクションのid・セクション名・階層レベル・パス・行範囲・文字数
2. コード構造（ファイル単位で複数ファイル分）
  - INDEX.md: クラス・メソッドの一覧と役割（role）・呼び出し関係（calls）
  - MAP.json: 各シンボルのid・シンボル名・種別（class/method）・ファイル名・行範囲`,
          format: `以下のJSON形式で出力してください:

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
\`\`\``,
          notes: `- 【重要】必ず指定されたJSON形式のみで応答してください。JSON以外のテキストは含めないでください。
- 【重要】出力するdoc_sections、code_symbolsのidは、設計書とコードのMAP.jsonに記載されたid値を正確にそのまま使用してください（例: MD1, MD2, CD1, CD2, ...）
- マッピングは多対多の場合もあります。1つの設計書セクションが複数グループに、1つのコードシンボルが複数グループに含まれる場合があります。
- 設計書構造は見出し単位でセクション分割されたものです。
- コード構造はクラスまたはメソッド単位のシンボルです。（例: "symbol: UserService#registerUser"、type: class/method）
- INDEX.mdにはセクションやシンボルの階層構造、概要（summary）、呼び出し関係（calls）などの補足情報が含まれます。
- 文字数が少ないセクションやシンボルは、単独では情報が乏しいため、関連する他の項目と合わせてグループ化を検討してください。`,
        },
      ],
      editable: true,
      minRows: 0,
    },
  ],
}
