'use client'

import { MotionInput } from './MotionInput'
import { MotionTextarea } from './MotionTextarea'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void

interface Props {
  formData: {
    vin: string
    firstRegistration: string
    lastInspection: string
    lastInspectionKm: string
    nextInspection: string
    inspectionReportUrl: string
    videoUrl: string
    specs: string
  }
  onChange: ChangeHandler
  onServiceHistoryChange: (urls: string[]) => void
}

export function CarDocsSection({ formData, onChange, onServiceHistoryChange }: Props) {
  const onInput    = onChange as React.ChangeEventHandler<HTMLInputElement>
  const onTextarea = onChange as React.ChangeEventHandler<HTMLTextAreaElement>

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN / Stelnummer (optional)</label>
          <MotionInput
            id="vin" name="vin" type="text"
            value={formData.vin} onChange={onInput}
            placeholder="17-character VIN" maxLength={17}
          />
        </div>
        <div>
          <label htmlFor="firstRegistration" className="block text-sm font-medium text-gray-700 mb-1">First Registration (optional)</label>
          <MotionInput
            id="firstRegistration" name="firstRegistration" type="date"
            value={formData.firstRegistration} onChange={onInput}
          />
        </div>
        <div>
          <label htmlFor="lastInspection" className="block text-sm font-medium text-gray-700 mb-1">Last Inspection Date (optional)</label>
          <MotionInput
            id="lastInspection" name="lastInspection" type="date"
            value={formData.lastInspection} onChange={onInput}
          />
        </div>
        <div>
          <label htmlFor="lastInspectionKm" className="block text-sm font-medium text-gray-700 mb-1">KM at Last Inspection (optional)</label>
          <MotionInput
            id="lastInspectionKm" name="lastInspectionKm" type="number" min="0"
            value={formData.lastInspectionKm} onChange={onInput} placeholder="175000"
          />
        </div>
        <div>
          <label htmlFor="nextInspection" className="block text-sm font-medium text-gray-700 mb-1">Next Inspection Date (optional)</label>
          <MotionInput
            id="nextInspection" name="nextInspection" type="date"
            value={formData.nextInspection} onChange={onInput}
          />
        </div>
        <div>
          <label htmlFor="inspectionReportUrl" className="block text-sm font-medium text-gray-700 mb-1">Inspection Report URL (optional)</label>
          <MotionInput
            id="inspectionReportUrl" name="inspectionReportUrl" type="url"
            value={formData.inspectionReportUrl} onChange={onInput} placeholder="https://..."
          />
        </div>
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">Video URL (YouTube / Vimeo, optional)</label>
          <MotionInput
            id="videoUrl" name="videoUrl" type="url"
            value={formData.videoUrl} onChange={onInput} placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service History URLs (optional, one per line)</label>
        <MotionTextarea
          rows={2}
          placeholder="https://..."
          onChange={e => onServiceHistoryChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
        />
      </div>

      <div>
        <label htmlFor="specs" className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
        <MotionTextarea
          id="specs" name="specs"
          value={formData.specs} onChange={onTextarea}
          rows={2}
          placeholder="Modifications, known issues, etc..."
        />
      </div>
    </>
  )
}
