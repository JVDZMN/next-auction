'use client'

import { MotionSelect } from './MotionSelect'
import { MotionTextarea } from './MotionTextarea'

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
  const onSelect   = onChange as React.ChangeEventHandler<HTMLSelectElement>
  const onTextarea = onChange as React.ChangeEventHandler<HTMLTextAreaElement>

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <MotionSelect id="brand" name="brand" required value={formData.brand} onChange={onSelect}>
            <option value="">Select a brand</option>
            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </MotionSelect>
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <MotionSelect
            id="model" name="model" required
            value={formData.model} onChange={onSelect}
            disabled={!formData.brand}
            className="disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a model</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </MotionSelect>
        </div>

        {availableSubModels.length > 0 && (
          <div>
            <label htmlFor="subModel" className="block text-sm font-medium text-gray-700 mb-1">Sub-model (optional)</label>
            <MotionSelect id="subModel" name="subModel" value={formData.subModel} onChange={onSelect}>
              <option value="">Not specified</option>
              {availableSubModels.map(s => <option key={s} value={s}>{s}</option>)}
            </MotionSelect>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <MotionTextarea
          id="description" name="description"
          value={formData.description} onChange={onTextarea}
          rows={3}
          placeholder="Describe your car's features, history, and condition..."
        />
      </div>
    </>
  )
}
