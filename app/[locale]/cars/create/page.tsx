'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { CarImageUpload } from '@/components/CarImageUpload'
import { getAllBrands, getModelsByBrand, getSubModelsByBrandModel } from '@/lib/car-brands'
import { VehicleLookupPanel, VehicleLookupResult } from '@/components/car-create/VehicleLookupPanel'
import { CarAddressSection } from '@/components/car-create/CarAddressSection'
import { CarVehicleSection } from '@/components/car-create/CarVehicleSection'
import { CarSpecsSection } from '@/components/car-create/CarSpecsSection'
import { CarAuctionSection } from '@/components/car-create/CarAuctionSection'
import { CarDocsSection } from '@/components/car-create/CarDocsSection'
import { useLocale } from '@/lib/i18n/context'

const initialFormData = {
  brand: '', model: '', subModel: '', variant: '', bodyType: '', category: '',
  engineSize: '', seats: '', weight: '', licensePlate: '', use: '',
  description: '', specs: '', condition: 'excellent',
  km: '', lastInspectionKm: '', year: '', power: '', fuel: 'Benzin', gearType: '',
  firstRegistration: '', lastInspection: '', nextInspection: '',
  startingPrice: '', reservePrice: '', auctionEndDate: '', auctionStartDate: '',
  streetName: '', houseNumber: '', zipcode: '', city: '',
  vin: '', inspectionReportUrl: '', bidIncrement: '',
}

export default function CreateCarPage() {
  const router = useRouter()
  const locale = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [isDraft, setIsDraft] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [serviceHistoryUrls, setServiceHistoryUrls] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableSubModels, setAvailableSubModels] = useState<string[]>([])

  const brands = getAllBrands()

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

  const handleLookupResult = (v: VehicleLookupResult) => {
    const matchedBrand = brands.find(b => b.toLowerCase() === (v.make ?? '').toLowerCase()) ?? ''
    let newModels: string[] = []
    let matchedModel = ''
    let matchedSubModel = ''
    let newSubModels: string[] = []

    if (matchedBrand) {
      newModels = getModelsByBrand(matchedBrand)
      const apiModelStr = (v.model ?? '').trim()
      const exact = newModels.find(m => m.toLowerCase() === apiModelStr.toLowerCase())
      if (exact) {
        matchedModel = exact
        newSubModels = getSubModelsByBrandModel(matchedBrand, exact)
      } else {
        for (const m of newModels) {
          if (apiModelStr.toLowerCase().startsWith(m.toLowerCase() + ' ')) {
            const remainder = apiModelStr.slice(m.length).trim()
            const subs = getSubModelsByBrandModel(matchedBrand, m)
            const foundSub = subs.find(s => s.toLowerCase() === remainder.toLowerCase())
            if (foundSub) { matchedModel = m; matchedSubModel = foundSub; newSubModels = subs; break }
          }
        }
        if (!matchedModel && apiModelStr) { newModels = [apiModelStr, ...newModels]; matchedModel = apiModelStr }
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
          engineSize: formData.engineSize ? parseFloat(formData.engineSize) : null,
          seats: formData.seats ? parseInt(formData.seats) : null,
          weight: formData.weight ? parseInt(formData.weight) : null,
          bidIncrement: formData.bidIncrement ? parseFloat(formData.bidIncrement) : null,
          firstRegistration: formData.firstRegistration ? new Date(formData.firstRegistration).toISOString() : null,
          lastInspection: formData.lastInspection ? new Date(formData.lastInspection).toISOString() : null,
          nextInspection: formData.nextInspection ? new Date(formData.nextInspection).toISOString() : null,
          serviceHistoryUrls,
          isDraft,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create auction')
      }
      const car = await response.json()
      router.push(`/${locale}/cars/${car.id}`)
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
          )}

          <VehicleLookupPanel onResult={handleLookupResult} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <CarImageUpload uploadedImages={uploadedImages} onChange={setUploadedImages} onError={setError} />

            <CarAddressSection
              formData={formData}
              onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
              onAddressSelect={addr => setFormData(prev => ({ ...prev, ...addr }))}
            />

            <CarVehicleSection
              formData={formData}
              onChange={handleChange}
              availableModels={availableModels}
              availableSubModels={availableSubModels}
              allBrands={brands}
            />

            <CarSpecsSection formData={formData} onChange={handleChange} />

            <CarAuctionSection formData={formData} onChange={handleChange} />

            <CarDocsSection
              formData={formData}
              onChange={handleChange}
              onServiceHistoryChange={setServiceHistoryUrls}
            />

            <div className="flex items-center gap-2">
              <input
                id="isDraft" type="checkbox"
                checked={isDraft} onChange={e => setIsDraft(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isDraft" className="text-sm text-gray-700">Save as draft (not visible to buyers)</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : isDraft ? 'Save Draft' : 'Create Auction'}
              </button>
              <button
                type="button" onClick={() => router.back()}
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
