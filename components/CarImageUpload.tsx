'use client'

import { useState } from 'react'

interface CarImageUploadProps {
  uploadedImages: string[]
  onChange: (images: string[]) => void
  onError: (error: string) => void
}

export function CarImageUpload({ uploadedImages, onChange, onError }: CarImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    onError('')

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload image')
        }

        const data = await response.json()
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      onChange([...uploadedImages, ...urls])
    } catch (err) {
      onError('Failed to upload images. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    onChange(uploadedImages.filter((_, i) => i !== index))
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
          <div className="grid grid-cols-4 gap-2">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Car ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
