'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { CarImageUpload } from '@/components/CarImageUpload'
import { getAllBrands, getModelsByBrand } from '@/lib/car-brands'

export default function CreateCarPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const brands = getAllBrands()

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    description: '',
    specs: '',
    condition: 'excellent',
    km: '',
    year: '',
    power: '',
    fuel: 'Benzin',
    euroStandard: '',
    startingPrice: '',
    reservePrice: '',
    auctionEndDate: '',
    addressLine: '',
    zipcode: '',
    city: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // When brand changes, update available models and reset model selection
    if (name === 'brand') {
      const models = getModelsByBrand(value)
      setAvailableModels(models)
      setFormData(prev => ({ ...prev, model: '' }))
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: uploadedImages,
          km: parseInt(formData.km),
          year: parseInt(formData.year),
          power: parseInt(formData.power),
          startingPrice: parseFloat(formData.startingPrice),
          reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
          euroStandard: formData.euroStandard || null,
          auctionEndDate: new Date(formData.auctionEndDate).toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create auction')
      }

      const car = await response.json()
      router.push(`/cars/${car.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">List Your Car for Auction</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <CarImageUpload
              uploadedImages={uploadedImages}
              onChange={setUploadedImages}
              onError={setError}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">
                  Address (Street & House No.)
                </label>
                <input
                  id="addressLine"
                  name="addressLine"
                  type="text"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="123 Main St, Apt 4B"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code (4 digits)
                </label>
                <input
                  id="zipcode"
                  name="zipcode"
                  type="text"
                  value={formData.zipcode}
                  onChange={handleChange}
                  placeholder="1234"
                  pattern="\d{4}"
                  maxLength={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Copenhagen"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  id="brand"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  disabled={!formData.brand}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a model</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe your car's features, history, and condition..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="km" className="block text-sm font-medium text-gray-700 mb-1">
                  KM
                </label>
                <input
                  id="km"
                  name="km"
                  type="number"
                  required
                  value={formData.km}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="power" className="block text-sm font-medium text-gray-700 mb-1">
                  Power (HP)
                </label>
                <input
                  id="power"
                  name="power"
                  type="number"
                  required
                  value={formData.power}
                  onChange={handleChange}
                  placeholder="150"
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select 
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleChange}
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
                <label htmlFor="fuel" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select 
                  id="fuel"
                  name="fuel"
                  required
                  value={formData.fuel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="Benzin">Benzin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="PluginHybrid">Plugin Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div>
                <label htmlFor="euroStandard" className="block text-sm font-medium text-gray-700 mb-1">
                  Euro Standard
                </label>
                <select 
                  id="euroStandard"
                  name="euroStandard"
                  value={formData.euroStandard}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Not specified</option>
                  <option value="euro6">Euro 6</option>
                  <option value="euro5">Euro 5</option>
                  <option value="euro4">Euro 4</option>
                  <option value="euro3">Euro 3</option>
                  <option value="euro2">Euro 2</option>
                  <option value="euro1">Euro 1</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Price ($)
                </label>
                <input
                  id="startingPrice"
                  name="startingPrice"
                  type="number"
                  required
                  value={formData.startingPrice}
                  onChange={handleChange}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Reserve Price ($)
                </label>
                <input
                  id="reservePrice"
                  name="reservePrice"
                  type="number"
                  value={formData.reservePrice}
                  onChange={handleChange}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="auctionEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Auction End Date
                </label>
                <input
                  id="auctionEndDate"
                  name="auctionEndDate"
                  type="datetime-local"
                  required
                  value={formData.auctionEndDate}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="specs" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                id="specs"
                name="specs"
                value={formData.specs}
                onChange={handleChange}
                rows={2}
                placeholder="VIN, service history, modifications, etc..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Auction'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
