'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { CarImageUpload } from '@/components/CarImageUpload'
import { getAllBrands, getModelsByBrand, getSubModelsByBrandModel } from '@/lib/car-brands'

interface VehicleLookupResult {
  make: string | null
  model: string | null
  year: number | null
  fuelType: string | null
  hp: number | null
  transmission: string | null
  firstRegistration: string | null
  lastInspection: string | null
  nextInspection: string | null
  km: number | null
  vin: string | null
  licensePlate: string | null
  bodyType: string | null
  category: string | null
  variant: string | null
  engineSize: number | null
  seats: number | null
  weight: number | null
  use: string | null
  // Extra info fields (not stored in DB)
  color: string | null
  doors: number | null
  maxTowingWeight: number | null
  status: string | null
  coupling: boolean | null
}

export default function CreateCarPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableSubModels, setAvailableSubModels] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  // Vehicle lookup state
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupSuccess, setLookupSuccess] = useState(false)
  const [extraInfo, setExtraInfo] = useState<Partial<VehicleLookupResult> | null>(null)

  const brands = getAllBrands()

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    subModel: '',
    variant: '',
    bodyType: '',
    category: '',
    engineSize: '',
    seats: '',
    weight: '',
    licensePlate: '',
    use: '',
    description: '',
    specs: '',
    condition: 'excellent',
    km: '',
    lastInspectionKm: '',
    year: '',
    power: '',
    fuel: 'Benzin',
    gearType: '',
    firstRegistration: '',
    lastInspection: '',
    nextInspection: '',
    startingPrice: '',
    reservePrice: '',
    auctionEndDate: '',
    auctionStartDate: '',
    zipcode: '',
    city: '',
    vin: '',
    inspectionReportUrl: '',
    bidIncrement: '',
  })
  const [isDraft, setIsDraft] = useState(false)
  const [serviceHistoryUrls, setServiceHistoryUrls] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'brand') {
      setAvailableModels(getModelsByBrand(value))
      setAvailableSubModels([])
      setFormData(prev => ({ ...prev, brand: value, model: '', subModel: '' }))
    } else if (name === 'model') {
      setAvailableSubModels(getSubModelsByBrandModel(formData.brand, value))
      setFormData(prev => ({ ...prev, model: value, subModel: '' }))
    } else if (name === 'firstRegistration') {
      const extractedYear = value ? String(new Date(value).getFullYear()) : ''
      setFormData(prev => ({ ...prev, firstRegistration: value, year: extractedYear || prev.year }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleMotorApiLookup = async () => {
    const query = lookupQuery.trim()
    if (!query) return
    setLookupLoading(true)
    setLookupError(null)
    setLookupSuccess(false)
    setExtraInfo(null)

    try {
      const res = await fetch(`/api/motorapi?search=${encodeURIComponent(query)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Køretøj ikke fundet')
      }
      const v: VehicleLookupResult = await res.json()

      // Brand: case-insensitive match against known brands
      const matchedBrand = brands.find(b => b.toLowerCase() === (v.make ?? '').toLowerCase()) ?? ''

      // Model + submodel: load models for matched brand, try to split "A3 Sportback" → model + submodel
      let newModels: string[] = []
      let matchedModel = ''
      let matchedSubModel = ''
      let newSubModels: string[] = []

      if (matchedBrand) {
        newModels = getModelsByBrand(matchedBrand)
        const apiModelStr = (v.model ?? '').trim()

        // Try exact match first
        const exact = newModels.find(m => m.toLowerCase() === apiModelStr.toLowerCase())
        if (exact) {
          matchedModel = exact
          newSubModels = getSubModelsByBrandModel(matchedBrand, exact)
        } else {
          // Try "Model Submodel" split (e.g. "A3 Sportback")
          for (const m of newModels) {
            if (apiModelStr.toLowerCase().startsWith(m.toLowerCase() + ' ')) {
              const remainder = apiModelStr.slice(m.length).trim()
              const subs = getSubModelsByBrandModel(matchedBrand, m)
              const foundSub = subs.find(s => s.toLowerCase() === remainder.toLowerCase())
              if (foundSub) {
                matchedModel = m
                matchedSubModel = foundSub
                newSubModels = subs
                break
              }
            }
          }
          // Fallback: inject API model as custom option
          if (!matchedModel && apiModelStr) {
            newModels = [apiModelStr, ...newModels]
            matchedModel = apiModelStr
          }
        }
      }
      setAvailableModels(newModels)
      setAvailableSubModels(newSubModels)

      setFormData(prev => ({
        ...prev,
        ...(matchedBrand && { brand: matchedBrand }),
        ...(matchedModel && { model: matchedModel }),
        ...(matchedSubModel && { subModel: matchedSubModel }),
        ...(v.year && v.year > 0 && { year: String(v.year) }),
        ...(v.fuelType && { fuel: v.fuelType }),
        ...(v.hp != null && { power: String(v.hp) }),
        ...(v.vin && { vin: v.vin }),
        ...(v.transmission && { gearType: v.transmission }),
        ...(v.firstRegistration && { firstRegistration: v.firstRegistration }),
        ...(v.lastInspection && { lastInspection: v.lastInspection }),
        ...(v.nextInspection && { nextInspection: v.nextInspection }),
        ...(v.km != null && { lastInspectionKm: String(v.km) }),
        ...(v.bodyType && { bodyType: v.bodyType }),
        ...(v.category && { category: v.category }),
        ...(v.licensePlate && { licensePlate: v.licensePlate }),
        ...(v.engineSize != null && { engineSize: String(v.engineSize) }),
        ...(v.seats != null && { seats: String(v.seats) }),
        ...(v.weight != null && { weight: String(v.weight) }),
        ...(v.use && { use: v.use }),
        ...(v.variant && { variant: v.variant }),
      }))

      // Store remaining extra info for display only (not stored in DB)
      setExtraInfo({
        color: v.color,
        doors: v.doors,
        maxTowingWeight: v.maxTowingWeight,
        status: v.status,
        coupling: v.coupling,
      })

      setLookupSuccess(true)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Fejl ved opslag')
    } finally {
      setLookupLoading(false)
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
          lastInspectionKm: formData.lastInspectionKm ? parseInt(formData.lastInspectionKm) : null,
          year: parseInt(formData.year),
          power: parseInt(formData.power),
          startingPrice: parseFloat(formData.startingPrice),
          reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
          auctionEndDate: new Date(formData.auctionEndDate).toISOString(),
          auctionStartDate: formData.auctionStartDate ? new Date(formData.auctionStartDate).toISOString() : null,
          vin: formData.vin || null,
          inspectionReportUrl: formData.inspectionReportUrl || null,
          serviceHistoryUrls,
          bidIncrement: formData.bidIncrement ? parseFloat(formData.bidIncrement) : null,
          isDraft,
          gearType: formData.gearType || null,
          subModel: formData.subModel || null,
          variant: formData.variant || null,
          bodyType: formData.bodyType || null,
          category: formData.category || null,
          licensePlate: formData.licensePlate || null,
          use: formData.use || null,
          engineSize: formData.engineSize ? parseFloat(formData.engineSize) : null,
          seats: formData.seats ? parseInt(formData.seats) : null,
          weight: formData.weight ? parseInt(formData.weight) : null,
          firstRegistration: formData.firstRegistration ? new Date(formData.firstRegistration).toISOString() : null,
          lastInspection: formData.lastInspection ? new Date(formData.lastInspection).toISOString() : null,
          nextInspection: formData.nextInspection ? new Date(formData.nextInspection).toISOString() : null,
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

          {/* Vehicle lookup */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Hent køretøjsoplysninger automatisk
            </p>
            <p className="text-xs text-blue-700 mb-3">
              Indtast registreringsnummer (f.eks. AB12345) eller stelnummer (VIN)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={e => {
                  setLookupQuery(e.target.value.toUpperCase())
                  setLookupError(null)
                  setLookupSuccess(false)
                }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleMotorApiLookup())}
                placeholder="EL57808 eller VIN..."
                className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white uppercase"
              />
              <button
                type="button"
                onClick={handleMotorApiLookup}
                disabled={lookupLoading || !lookupQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {lookupLoading ? 'Henter...' : 'Hent oplysninger'}
              </button>
            </div>
            {lookupError && (
              <p className="mt-2 text-xs text-red-600">{lookupError}</p>
            )}
            {lookupSuccess && (
              <p className="mt-2 text-xs text-green-700 font-medium">
                ✓ Oplysninger hentet — du kan stadig redigere felterne nedenfor
              </p>
            )}
          </div>

          {/* Extra info panel (non-DB fields shown as read-only after lookup) */}
          {extraInfo && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Yderligere oplysninger fra opslaget
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700">
                {extraInfo.color && <div><span className="font-medium">Farve:</span> {extraInfo.color}</div>}
                {extraInfo.doors != null && <div><span className="font-medium">Døre:</span> {extraInfo.doors}</div>}
                {extraInfo.maxTowingWeight != null && <div><span className="font-medium">Max trailer:</span> {extraInfo.maxTowingWeight} kg</div>}
                {extraInfo.status && <div><span className="font-medium">Status:</span> {extraInfo.status}</div>}
                {extraInfo.coupling != null && <div><span className="font-medium">Trækkrog:</span> {extraInfo.coupling ? 'Ja' : 'Nej'}</div>}
              </div>
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
                    <option key={brand} value={brand}>{brand}</option>
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
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {availableSubModels.length > 0 && (
                <div>
                  <label htmlFor="subModel" className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-model (optional)
                  </label>
                  <select
                    id="subModel"
                    name="subModel"
                    value={formData.subModel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Not specified</option>
                    {availableSubModels.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}
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
                  Current KM
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
                <label htmlFor="gearType" className="block text-sm font-medium text-gray-700 mb-1">
                  Gear Type
                </label>
                <select
                  id="gearType"
                  name="gearType"
                  value={formData.gearType}
                  onChange={handleChange}
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
                <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Body Type (optional)
                </label>
                <input
                  id="bodyType"
                  name="bodyType"
                  type="text"
                  value={formData.bodyType}
                  onChange={handleChange}
                  placeholder="Hatchback"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Personbil"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="variant" className="block text-sm font-medium text-gray-700 mb-1">
                  Variant (optional)
                </label>
                <input
                  id="variant"
                  name="variant"
                  type="text"
                  value={formData.variant}
                  onChange={handleChange}
                  placeholder="1.4 TSI AUT."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Engine Size (L, optional)
                </label>
                <input
                  id="engineSize"
                  name="engineSize"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.engineSize}
                  onChange={handleChange}
                  placeholder="1.6"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">
                  Seats (optional)
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg, optional)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="1240"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate (optional)
                </label>
                <input
                  id="licensePlate"
                  name="licensePlate"
                  type="text"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  placeholder="AB12345"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="use" className="block text-sm font-medium text-gray-700 mb-1">
                  Use (optional)
                </label>
                <input
                  id="use"
                  name="use"
                  type="text"
                  value={formData.use}
                  onChange={handleChange}
                  placeholder="Privat personkørsel"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="auctionStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Auction Start Date (optional)
                </label>
                <input
                  id="auctionStartDate"
                  name="auctionStartDate"
                  type="datetime-local"
                  value={formData.auctionStartDate}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Bid Increment ($, optional)
                </label>
                <input
                  id="bidIncrement"
                  name="bidIncrement"
                  type="number"
                  value={formData.bidIncrement}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
                  VIN / Stelnummer (optional)
                </label>
                <input
                  id="vin"
                  name="vin"
                  type="text"
                  value={formData.vin}
                  onChange={handleChange}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="firstRegistration" className="block text-sm font-medium text-gray-700 mb-1">
                  First Registration (optional)
                </label>
                <input
                  id="firstRegistration"
                  name="firstRegistration"
                  type="date"
                  value={formData.firstRegistration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="lastInspection" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Inspection Date (optional)
                </label>
                <input
                  id="lastInspection"
                  name="lastInspection"
                  type="date"
                  value={formData.lastInspection}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="lastInspectionKm" className="block text-sm font-medium text-gray-700 mb-1">
                  KM at Last Inspection (optional)
                </label>
                <input
                  id="lastInspectionKm"
                  name="lastInspectionKm"
                  type="number"
                  min="0"
                  value={formData.lastInspectionKm}
                  onChange={handleChange}
                  placeholder="175000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="nextInspection" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Inspection Date (optional)
                </label>
                <input
                  id="nextInspection"
                  name="nextInspection"
                  type="date"
                  value={formData.nextInspection}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label htmlFor="inspectionReportUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Report URL (optional)
                </label>
                <input
                  id="inspectionReportUrl"
                  name="inspectionReportUrl"
                  type="url"
                  value={formData.inspectionReportUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service History URLs (optional, one per line)
              </label>
              <textarea
                rows={2}
                placeholder="https://..."
                onChange={(e) => setServiceHistoryUrls(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
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
                placeholder="Modifications, known issues, etc..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isDraft"
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isDraft" className="text-sm text-gray-700">
                Save as draft (not visible to buyers)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : isDraft ? 'Save Draft' : 'Create Auction'}
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
