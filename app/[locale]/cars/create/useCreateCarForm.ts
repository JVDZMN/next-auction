'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAnimate } from 'framer-motion'
import { CreateCarSchema } from '@/lib/zod'
import { getAllBrands, getModelsByBrand, getSubModelsByBrandModel } from '@/lib/car-brands'
import { VehicleLookupResult } from '@/components/car-create/VehicleLookupPanel'
import { useLocale } from '@/lib/i18n/context'
import { createCar } from '@/app/actions/cars'

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

export function useCreateCarForm() {
  const router = useRouter()
  const locale = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [dawaCoords, setDawaCoords] = useState<[number, number] | null>(null)
  const [isDraft, setIsDraft] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [_serviceHistoryUrls, setServiceHistoryUrls] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableSubModels, setAvailableSubModels] = useState<string[]>([])

  const [buttonRowRef, animateButtonRow] = useAnimate()
  const brands = getAllBrands()

  const shakeButtons = () =>
    void animateButtonRow(buttonRowRef.current, { x: [0, -8, 8, -6, 6, -2, 0] }, { duration: 0.4 })

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
      // 1. Validate the form data with Zod
      const validation = CreateCarSchema.safeParse(formData)
      
      if (!validation.success) {
        // Format Zod errors into a readable string
        const errorMsg = validation.error.issues[0]?.message || 'Validation failed'
        setError(errorMsg)
        shakeButtons()
        setIsSubmitting(false)
        return
      }

      // 2. Proceed with submission if validation passes
      const result = await createCar({
        ...formData,
        images: uploadedImages,
        km: validation.data.km,
        year: validation.data.year,
        power: validation.data.power,
        startingPrice: validation.data.startingPrice,
        auctionEndDate: new Date(formData.auctionEndDate).toISOString(),
        isDraft,
        latitude,
        longitude,
      })

      if ('error' in result) {
        setError(result.error)
        shakeButtons()
      } else {
        router.push(`/${locale}/cars/${result.carId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      shakeButtons()
    } finally {
      setIsSubmitting(false)
    }
  }

  return { formData, setFormData, error, setError, isSubmitting, uploadedImages, setUploadedImages, dawaCoords, setDawaCoords, setLatitude, setLongitude, availableModels, availableSubModels, brands, isDraft, setIsDraft, setServiceHistoryUrls, buttonRowRef, handleChange, handleLookupResult, handleSubmit }
}