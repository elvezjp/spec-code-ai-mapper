import { MAPPING_PRESET_CATALOG } from '@core/data/mappingPresetCatalog'

interface MappingPolicySectionProps {
  currentPolicy: string
  onPolicyChange: (policy: string) => void
}

export function MappingPolicySection({
  currentPolicy,
  onPolicyChange,
}: MappingPolicySectionProps) {
  const currentPreset = MAPPING_PRESET_CATALOG.find(p => p.id === currentPolicy)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800">マッピング方式</h2>
      <p className="text-xs text-gray-400 mt-2 mb-4">
        設計書とプログラムのマッピング方式を選択します。選択に応じてシステムプロンプトが変更されます。
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          {MAPPING_PRESET_CATALOG.map((preset) => (
            <label key={preset.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mappingPolicy"
                checked={currentPolicy === preset.id}
                onChange={() => onPolicyChange(preset.id)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">{preset.name}</span>
            </label>
          ))}
        </div>
        {currentPreset && (
          <p className="text-xs text-gray-400">
            {currentPreset.description}
          </p>
        )}
      </div>
    </div>
  )
}
