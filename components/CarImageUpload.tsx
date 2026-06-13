'use client'

import { useState } from 'react'
import { useDict } from '@/lib/i18n/context'

export interface ImageMeta {
  url: string
  category: string
}

const CATEGORIES = [
  'exterior_front',
  'exterior_rear',
  'exterior_side',
  'interior',
  'dashboard',
  'engine',
  'trunk',
  'other',
] as const

interface CarImageUploadProps {
  uploadedImages: string[]
  imageMetas: ImageMeta[]
  onChange: (images: string[]) => void
  onMetaChange: (metas: ImageMeta[]) => void
  onError: (error: string) => void
}

export function CarImageUpload({ uploadedImages, imageMetas, onChange, onMetaChange, onError }: CarImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const td = useDict()
  const tc = td.cars.detail.photoCategories

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    onError('')

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!response.ok) throw new Error('Failed to upload image')
        const data = await response.json()
        return data.url as string
      })

      const urls = await Promise.all(uploadPromises)
      onChange([...uploadedImages, ...urls])
      onMetaChange([...imageMetas, ...urls.map(url => ({ url, category: '' }))])
    } catch {
      onError('Failed to upload images. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    onChange(uploadedImages.filter((_, i) => i !== index))
    onMetaChange(imageMetas.filter((_, i) => i !== index))
  }

  const setCategory = (index: number, category: string) => {
    onMetaChange(imageMetas.map((m, i) => i === index ? { ...m, category } : m))
  }

  return (
    <div>
      <label htmlFor="carImages" className="block text-sm font-medium text-gray-700 mb-1">
        Car Images
      </label>
      <div className="space-y-3">
        <input
          id="carImages"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          disabled={isUploading}
          aria-label="Upload car images"
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        {isUploading && (
          <p className="text-sm text-blue-600">Uploading images...</p>
        )}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <div className="relative h-24 rounded border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Car ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none"
                  >
                    ×
                  </button>
                </div>
                <select
                  value={imageMetas[index]?.category ?? ''}
                  onChange={e => setCategory(index, e.target.value)}
                  aria-label={`${tc.label} ${index + 1}`}
                  className="mt-1 w-full text-xs rounded border border-gray-200 bg-background px-1.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">{tc.label}</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{tc[cat]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
