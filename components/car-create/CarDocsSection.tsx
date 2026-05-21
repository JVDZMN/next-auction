'use client'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void

interface Props {
  formData: {
    vin: string
    firstRegistration: string
    lastInspection: string
    lastInspectionKm: string
    nextInspection: string
    inspectionReportUrl: string
    specs: string
  }
  onChange: ChangeHandler
  onServiceHistoryChange: (urls: string[]) => void
}

export function CarDocsSection({ formData, onChange, onServiceHistoryChange }: Props) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN / Stelnummer (optional)</label>
          <input
            id="vin" name="vin" type="text"
            value={formData.vin} onChange={onChange}
            placeholder="17-character VIN" maxLength={17}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="firstRegistration" className="block text-sm font-medium text-gray-700 mb-1">First Registration (optional)</label>
          <input
            id="firstRegistration" name="firstRegistration" type="date"
            value={formData.firstRegistration} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="lastInspection" className="block text-sm font-medium text-gray-700 mb-1">Last Inspection Date (optional)</label>
          <input
            id="lastInspection" name="lastInspection" type="date"
            value={formData.lastInspection} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="lastInspectionKm" className="block text-sm font-medium text-gray-700 mb-1">KM at Last Inspection (optional)</label>
          <input
            id="lastInspectionKm" name="lastInspectionKm" type="number" min="0"
            value={formData.lastInspectionKm} onChange={onChange} placeholder="175000"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="nextInspection" className="block text-sm font-medium text-gray-700 mb-1">Next Inspection Date (optional)</label>
          <input
            id="nextInspection" name="nextInspection" type="date"
            value={formData.nextInspection} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="inspectionReportUrl" className="block text-sm font-medium text-gray-700 mb-1">Inspection Report URL (optional)</label>
          <input
            id="inspectionReportUrl" name="inspectionReportUrl" type="url"
            value={formData.inspectionReportUrl} onChange={onChange} placeholder="https://..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service History URLs (optional, one per line)</label>
        <textarea
          rows={2}
          placeholder="https://..."
          onChange={e => onServiceHistoryChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>

      <div>
        <label htmlFor="specs" className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
        <textarea
          id="specs" name="specs"
          value={formData.specs} onChange={onChange}
          rows={2}
          placeholder="Modifications, known issues, etc..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>
    </>
  )
}
