'use client'

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
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            id="year" name="year" type="number" required
            value={formData.year} onChange={onChange}
            placeholder="2020" min="1900" max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="km" className="block text-sm font-medium text-gray-700 mb-1">Current KM</label>
          <input
            id="km" name="km" type="number" required
            value={formData.km} onChange={onChange}
            placeholder="50000" min="0"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="power" className="block text-sm font-medium text-gray-700 mb-1">Power (HP)</label>
          <input
            id="power" name="power" type="number" required
            value={formData.power} onChange={onChange}
            placeholder="150" min="0"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select
            id="condition" name="condition" required
            value={formData.condition} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fuel" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
          <select
            id="fuel" name="fuel" required
            value={formData.fuel} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="Benzin">Benzin</option>
            <option value="Diesel">Diesel</option>
            <option value="HybridBenzin">Hybrid Benzin</option>
            <option value="HybridDiesel">Hybrid Diesel</option>
            <option value="PluginHybrid">Plugin Hybrid</option>
            <option value="Electric">Electric</option>
          </select>
        </div>
        <div>
          <label htmlFor="gearType" className="block text-sm font-medium text-gray-700 mb-1">Gear Type</label>
          <select
            id="gearType" name="gearType"
            value={formData.gearType} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">Not specified</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-1">Body Type (optional)</label>
          <input
            id="bodyType" name="bodyType" type="text"
            value={formData.bodyType} onChange={onChange} placeholder="Hatchback"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
          <input
            id="category" name="category" type="text"
            value={formData.category} onChange={onChange} placeholder="Personbil"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="variant" className="block text-sm font-medium text-gray-700 mb-1">Variant (optional)</label>
          <input
            id="variant" name="variant" type="text"
            value={formData.variant} onChange={onChange} placeholder="1.4 TSI AUT."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700 mb-1">Engine Size (L, optional)</label>
          <input
            id="engineSize" name="engineSize" type="number" step="0.1" min="0"
            value={formData.engineSize} onChange={onChange} placeholder="1.6"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">Seats (optional)</label>
          <input
            id="seats" name="seats" type="number" min="1"
            value={formData.seats} onChange={onChange} placeholder="5"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg, optional)</label>
          <input
            id="weight" name="weight" type="number" min="0"
            value={formData.weight} onChange={onChange} placeholder="1240"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">License Plate (optional)</label>
          <input
            id="licensePlate" name="licensePlate" type="text"
            value={formData.licensePlate} onChange={onChange} placeholder="AB12345"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="use" className="block text-sm font-medium text-gray-700 mb-1">Use (optional)</label>
          <input
            id="use" name="use" type="text"
            value={formData.use} onChange={onChange} placeholder="Privat personkørsel"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>
    </>
  )
}
