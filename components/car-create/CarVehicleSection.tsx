'use client'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void

interface Props {
  formData: {
    brand: string
    model: string
    subModel: string
    description: string
  }
  onChange: ChangeHandler
  availableModels: string[]
  availableSubModels: string[]
  allBrands: string[]
}

export function CarVehicleSection({ formData, onChange, availableModels, availableSubModels, allBrands }: Props) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select
            id="brand" name="brand" required
            value={formData.brand} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">Select a brand</option>
            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            id="model" name="model" required
            value={formData.model} onChange={onChange}
            disabled={!formData.brand}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a model</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {availableSubModels.length > 0 && (
          <div>
            <label htmlFor="subModel" className="block text-sm font-medium text-gray-700 mb-1">Sub-model (optional)</label>
            <select
              id="subModel" name="subModel"
              value={formData.subModel} onChange={onChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Not specified</option>
              {availableSubModels.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea
          id="description" name="description"
          value={formData.description} onChange={onChange}
          rows={3}
          placeholder="Describe your car's features, history, and condition..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>
    </>
  )
}
