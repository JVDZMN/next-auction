'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { PageLayout } from '@/components/PageLayout'
import { CarImageUpload } from '@/components/CarImageUpload'
import { VehicleLookupPanel } from '@/components/car-create/VehicleLookupPanel'
import { CarAddressSection } from '@/components/car-create/CarAddressSection'
import { CarVehicleSection } from '@/components/car-create/CarVehicleSection'
import { CarSpecsSection } from '@/components/car-create/CarSpecsSection'
import { CarAuctionSection } from '@/components/car-create/CarAuctionSection'
import { CarDocsSection } from '@/components/car-create/CarDocsSection'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useCreateCarForm } from '@/hooks/useCreateCarForm'

const CarLocationPicker = dynamic(
  () => import('@/components/car-create/CarLocationPicker'),
  { ssr: false }
)

// ── Spring presets ─────────────────────────────────────────────────────────────
const cardSpring   = { type: 'spring', mass: 0.8, stiffness: 240, damping: 30 } as const
const sectionSpring = { type: 'spring', mass: 0.6, stiffness: 300, damping: 28 } as const
const buttonSpring  = { type: 'spring', mass: 0.4, stiffness: 420, damping: 22 } as const

// ── Stagger variants ───────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.065, delayChildren: 0.1 } },
}

const sectionItem = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: sectionSpring },
}

export default function CreateCarPage() {
  const router = useRouter()

  const {
    formData,
    setFormData,
    error,
    setError,
    isSubmitting,
    uploadedImages,
    setUploadedImages,
    dawaCoords,
    setDawaCoords,
    setLatitude,
    setLongitude,
    availableModels,
    availableSubModels,
    brands,
    isDraft,
    setIsDraft,
    setServiceHistoryUrls,
    buttonRowRef,
    handleChange,
    handleLookupResult,
    handleSubmit,
  } = useCreateCarForm()
  const { data: session } = useSession()
  const isPrivate = session?.user?.userType === 'PRIVATE'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageLayout maxWidth="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={cardSpring}
      >
        <Card>
          <CardHeader>
            <CardTitle>List Your Car for Auction</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {error && (
                <motion.div
                  key="global-error"
                  layout
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{    opacity: 0, height: 0,      marginBottom: 0  }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  className="overflow-hidden"
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {isPrivate && (
              <Alert className="mb-4" style={{ borderColor: 'var(--copper)', backgroundColor: 'rgba(196,125,58,0.06)' }}>
                <AlertDescription style={{ color: 'var(--text-body)' }}>
                  <strong>SKAT-regel:</strong> Du kan sælge op til 2 biler om året som privatperson.
                  Salg ud over denne grænse betragtes som erhvervsmæssigt af SKAT.
                </AlertDescription>
              </Alert>
            )}

            <VehicleLookupPanel onResult={handleLookupResult} />

            <form onSubmit={handleSubmit} className="mt-4">
              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={sectionItem}>
                  <CarImageUpload uploadedImages={uploadedImages} onChange={setUploadedImages} onError={setError} />
                </motion.div>

                <motion.div variants={sectionItem}>
                  <CarAddressSection
                    formData={formData}
                    onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                    onAddressSelect={addr => setFormData(prev => ({ ...prev, ...addr }))}
                    onCoordinates={(lat, lng) => {
                      setLatitude(lat)
                      setLongitude(lng)
                      setDawaCoords([lat, lng])
                    }}
                  />
                </motion.div>

                <motion.div variants={sectionItem}>
                  <CarLocationPicker
                    externalPosition={dawaCoords}
                    onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng) }}
                    onClear={() => { setLatitude(null); setLongitude(null); setDawaCoords(null) }}
                  />
                </motion.div>

                <motion.div variants={sectionItem}>
                  <CarVehicleSection
                    formData={formData}
                    onChange={handleChange}
                    availableModels={availableModels}
                    availableSubModels={availableSubModels}
                    allBrands={brands}
                  />
                </motion.div>

                <motion.div variants={sectionItem}>
                  <CarSpecsSection formData={formData} onChange={handleChange} />
                </motion.div>

                <motion.div variants={sectionItem}>
                  <CarAuctionSection formData={formData} onChange={handleChange} />
                </motion.div>

                <motion.div variants={sectionItem}>
                  <CarDocsSection
                    formData={formData}
                    onChange={handleChange}
                    onServiceHistoryChange={setServiceHistoryUrls}
                  />
                </motion.div>

                <motion.div variants={sectionItem} className="flex items-center gap-2">
                  <Checkbox id="isDraft" checked={isDraft} onCheckedChange={v => setIsDraft(!!v)} />
                  <Label htmlFor="isDraft" className="cursor-pointer text-sm">Save as draft (not visible to buyers)</Label>
                </motion.div>

                <motion.div variants={sectionItem}>
                  <div ref={buttonRowRef} className="flex gap-3 pt-2">
                    <motion.div
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.96 }}
                      transition={buttonSpring}
                    >
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? <><Spinner className="mr-2 h-4 w-4" />{isDraft ? 'Saving…' : 'Creating…'}</>
                          : isDraft ? 'Save Draft' : 'Create Auction'}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.96 }}
                      transition={buttonSpring}
                    >
                      <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </PageLayout>
  )
}
