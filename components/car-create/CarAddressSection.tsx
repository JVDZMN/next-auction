'use client'

import { DawaAddressInput } from '@/components/DawaAddressInput'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void

interface AddressData {
  streetName: string
  houseNumber: string
  zipcode: string
  city: string
}

interface Props {
  formData: AddressData
  onChange: ChangeHandler
  onAddressSelect: (addr: AddressData) => void
}

export function CarAddressSection({ formData, onChange, onAddressSelect }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Search</label>
        <DawaAddressInput
          onSelect={addr => onAddressSelect({
            streetName: addr.streetName,
            houseNumber: addr.houseNumber,
            zipcode: addr.zipCode,
            city: addr.city,
          })}
        />
        <p className="mt-1 text-xs text-gray-400">Select from dropdown to autofill the fields below</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
          <input
            id="streetName" name="streetName" type="text"
            value={formData.streetName} onChange={onChange} placeholder="Vesterbrogade"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">No.</label>
          <input
            id="houseNumber" name="houseNumber" type="text"
            value={formData.houseNumber} onChange={onChange} placeholder="12"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
          <input
            id="zipcode" name="zipcode" type="text"
            value={formData.zipcode} onChange={onChange} placeholder="1234" maxLength={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            id="city" name="city" type="text"
            value={formData.city} onChange={onChange} placeholder="Copenhagen"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>
    </div>
  )
}
