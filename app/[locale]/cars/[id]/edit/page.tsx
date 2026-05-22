'use client'

import { use, useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingPage, PageLayout } from '@/components/PageLayout'
import { CarImageUpload } from '@/components/CarImageUpload'
import { getAllBrands, getModelsByBrand, getSubModelsByBrandModel } from '@/lib/car-brands'
import { CarAddressSection } from '@/components/car-create/CarAddressSection'
import { CarVehicleSection } from '@/components/car-create/CarVehicleSection'
import { CarSpecsSection } from '@/components/car-create/CarSpecsSection'
import { CarAuctionSection } from '@/components/car-create/CarAuctionSection'
import { CarDocsSection } from '@/components/car-create/CarDocsSection'
import { useLocale } from '@/lib/i18n/context'
import type { Car } from '@/types/car'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function toDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function carToFormData(car: Car) {
  return {
    brand: car.brand ?? '',
    model: car.model ?? '',
    subModel: car.subModel ?? '',
    variant: car.variant ?? '',
    bodyType: car.bodyType ?? '',
    category: car.category ?? '',
    engineSize: car.engineSize != null ? String(car.engineSize) : '',
    seats: car.seats != null ? String(car.seats) : '',
    weight: car.weight != null ? String(car.weight) : '',
    licensePlate: car.licensePlate ?? '',
    use: car.use ?? '',
    description: car.description ?? '',
    specs: car.specs ?? '',
    condition: car.condition ?? 'excellent',
    km: String(car.km ?? ''),
    lastInspectionKm: car.lastInspectionKm != null ? String(car.lastInspectionKm) : '',
    year: String(car.year ?? ''),
    power: String(car.power ?? ''),
    fuel: car.fuel ?? 'Benzin',
    gearType: car.gearType ?? '',
    firstRegistration: toDateInput(car.firstRegistration),
    lastInspection: toDateInput(car.lastInspection),
    nextInspection: toDateInput(car.nextInspection),
    startingPrice: String(car.startingPrice ?? ''),
    reservePrice: car.reservePrice != null ? String(car.reservePrice) : '',
    auctionEndDate: toDateTimeInput(car.auctionEndDate),
    auctionStartDate: toDateTimeInput(car.auctionStartDate),
    streetName: car.streetName ?? '',
    houseNumber: car.houseNumber ?? '',
    zipcode: car.zipcode ?? '',
    city: car.city ?? '',
    vin: car.vin ?? '',
    inspectionReportUrl: car.inspectionReportUrl ?? '',
    bidIncrement: car.bidIncrement != null ? String(car.bidIncrement) : '',
  }
}

export default function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const locale = useLocale()
  const { id } = use(params)

  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(carToFormData({} as Car))
  const [isDraft, setIsDraft] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [serviceHistoryUrls, setServiceHistoryUrls] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableSubModels, setAvailableSubModels] = useState<string[]>([])

  const brands = getAllBrands()

  useEffect(() => {
    fetch(`/api/cars/${id}`)
      .then(r => r.json())
      .then((data: Car) => {
        setCar(data)
        setFormData(carToFormData(data))
        setIsDraft(data.isDraft)
        setUploadedImages(data.images ?? [])
        setServiceHistoryUrls(data.serviceHistoryUrls ?? [])
        setAvailableModels(getModelsByBrand(data.brand))
        setAvailableSubModels(getSubModelsByBrandModel(data.brand, data.model))
        setLoading(false)
      })
      .catch(() => { setError('Failed to load car'); setLoading(false) })
  }, [id])

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'PATCH',
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
      if (response.status === 409) { setError('This listing has received bids and can no longer be edited.'); return }
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update listing')
      }
      router.push(`/${locale}/cars/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <LoadingPage maxWidth="max-w-3xl" />

  const hasBids = car && car.bids.length > 0

  return (
    <PageLayout maxWidth="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Listing</CardTitle>
        </CardHeader>
        <CardContent>
          {hasBids ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription>
                <p className="font-semibold text-amber-800">This listing has received bids and can no longer be edited.</p>
                <p className="text-sm text-amber-700 mt-1">To make changes, cancel the auction and create a new listing.</p>
                <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => router.push(`/${locale}/cars/${id}`)}>
                  Back to listing
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                  <Checkbox id="isDraft" checked={isDraft} onCheckedChange={v => setIsDraft(!!v)} />
                  <Label htmlFor="isDraft" className="cursor-pointer text-sm">Save as draft (not visible to buyers)</Label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Saving…</> : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/cars/${id}`)}>Cancel</Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}
