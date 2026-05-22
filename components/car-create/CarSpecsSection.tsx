'use client'

import { MotionInput } from './MotionInput'
import { MotionSelect } from './MotionSelect'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void

interface Props {
  formData: {
    year: string
    km: string
    power: string
    condition: string
    fuel: string
    gearType: string
    bodyType: string
    category: string
    variant: string
    engineSize: string
    seats: string
    weight: string
    licensePlate: string
    use: string
  }
  onChange: ChangeHandler
}

export function CarSpecsSection({ formData, onChange }: Props) {
  const onInput  = onChange as React.ChangeEventHandler<HTMLInputElement>
  const onSelect = onChange as React.ChangeEventHandler<HTMLSelectElement>

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <MotionInput
            id="year" name="year" type="number" required
            value={formData.year} onChange={onInput}
            placeholder="2020" min="1900" max={new Date().getFullYear() + 1}
          />
        </div>
        <div>
          <label htmlFor="km" className="block text-sm font-medium text-gray-700 mb-1">Current KM</label>
          <MotionInput
            id="km" name="km" type="number" required
            value={formData.km} onChange={onInput}
            placeholder="50000" min="0"
          />
        </div>
        <div>
          <label htmlFor="power" className="block text-sm font-medium text-gray-700 mb-1">Power (HP)</label>
          <MotionInput
            id="power" name="power" type="number" required
            value={formData.power} onChange={onInput}
            placeholder="150" min="0"
          />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <MotionSelect id="condition" name="condition" required value={formData.condition} onChange={onSelect}>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </MotionSelect>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fuel" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
          <MotionSelect id="fuel" name="fuel" required value={formData.fuel} onChange={onSelect}>
            <option value="Benzin">Benzin</option>
            <option value="Diesel">Diesel</option>
            <option value="HybridBenzin">Hybrid Benzin</option>
            <option value="HybridDiesel">Hybrid Diesel</option>
            <option value="PluginHybrid">Plugin Hybrid</option>
            <option value="Electric">Electric</option>
          </MotionSelect>
        </div>
        <div>
          <label htmlFor="gearType" className="block text-sm font-medium text-gray-700 mb-1">Gear Type</label>
          <MotionSelect id="gearType" name="gearType" value={formData.gearType} onChange={onSelect}>
            <option value="">Not specified</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </MotionSelect>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-1">Body Type (optional)</label>
          <MotionInput
            id="bodyType" name="bodyType" type="text"
            value={formData.bodyType} onChange={onInput} placeholder="Hatchback"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
          <MotionInput
            id="category" name="category" type="text"
            value={formData.category} onChange={onInput} placeholder="Personbil"
          />
        </div>
        <div>
          <label htmlFor="variant" className="block text-sm font-medium text-gray-700 mb-1">Variant (optional)</label>
          <MotionInput
            id="variant" name="variant" type="text"
            value={formData.variant} onChange={onInput} placeholder="1.4 TSI AUT."
          />
        </div>
        <div>
          <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700 mb-1">Engine Size (L, optional)</label>
          <MotionInput
            id="engineSize" name="engineSize" type="number" step="0.1" min="0"
            value={formData.engineSize} onChange={onInput} placeholder="1.6"
          />
        </div>
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">Seats (optional)</label>
          <MotionInput
            id="seats" name="seats" type="number" min="1"
            value={formData.seats} onChange={onInput} placeholder="5"
          />
        </div>
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg, optional)</label>
          <MotionInput
            id="weight" name="weight" type="number" min="0"
            value={formData.weight} onChange={onInput} placeholder="1240"
          />
        </div>
        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">License Plate (optional)</label>
          <MotionInput
            id="licensePlate" name="licensePlate" type="text"
            value={formData.licensePlate} onChange={onInput} placeholder="AB12345"
          />
        </div>
        <div>
          <label htmlFor="use" className="block text-sm font-medium text-gray-700 mb-1">Use (optional)</label>
          <MotionInput
            id="use" name="use" type="text"
            value={formData.use} onChange={onInput} placeholder="Privat personkørsel"
          />
        </div>
      </div>
    </>
  )
}
