import { z } from 'zod'

// ── Client-side validation (subset used in the create-car form hook) ──────────
export const CreateCarSchema = z.object({
  brand:          z.string().min(1, 'Brand is required'),
  model:          z.string().min(1, 'Model is required'),
  km:             z.coerce.number().int().min(0, 'Kilometers must be 0 or more'),
  year:           z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  power:          z.coerce.number().int().min(1, 'Power (HP) must be at least 1'),
  startingPrice:  z.coerce.number().positive('Starting price must be positive'),
  reservePrice:   z.coerce.number().optional().nullable(),
  auctionEndDate: z.string().refine(
    val => { const d = new Date(val); return !isNaN(d.getTime()) && d > new Date() },
    { message: 'Auction must end in the future' }
  ),
  auctionStartDate: z.string().optional().nullable(),
  vin:          z.string().min(10, 'VIN must be at least 10 characters').optional().or(z.literal('')),
  licensePlate: z.string().optional(),
  streetName:   z.string().min(1, 'Street is required'),
  city:         z.string().min(1, 'City is required'),
  zipcode:      z.string().min(1, 'Zipcode is required'),
  description:  z.string().min(10, 'Description should be at least 10 characters'),
})

// ── Full server-side schema (used by createCar action and API routes) ─────────
export const CarCreateSchema = z.object({
  brand:        z.string().min(1),
  model:        z.string().min(1),
  subModel:     z.string().optional().nullable(),
  variant:      z.string().optional().nullable(),
  bodyType:     z.string().optional().nullable(),
  category:     z.string().optional().nullable(),
  gearType:     z.string().optional().nullable(),
  engineSize:   z.union([z.string(), z.number()]).optional().nullable(),
  seats:        z.union([z.string(), z.number()]).optional().nullable(),
  weight:       z.union([z.string(), z.number()]).optional().nullable(),
  licensePlate: z.string().optional().nullable(),
  use:          z.string().optional().nullable(),
  firstRegistration: z.string().optional().nullable(),
  lastInspection:    z.string().optional().nullable(),
  nextInspection:    z.string().optional().nullable(),
  description:  z.string().optional(),
  specs:        z.string().optional().nullable(),
  condition:    z.string().min(1),
  km:           z.union([z.string(), z.number()]),
  lastInspectionKm: z.union([z.string(), z.number()]).optional().nullable(),
  year:         z.union([z.string(), z.number()]),
  power:        z.union([z.string(), z.number()]),
  fuel:         z.string().min(1),
  images:       z.array(z.string()).optional(),
  startingPrice:  z.union([z.string(), z.number()]),
  reservePrice:   z.union([z.string(), z.number()]).optional().nullable(),
  auctionEndDate: z.string(),
  auctionStartDate: z.string().optional().nullable(),
  streetName:   z.string().optional().nullable(),
  houseNumber:  z.string().optional().nullable(),
  zipcode:      z.string().optional().nullable(),
  city:         z.string().optional().nullable(),
  vin:          z.string().optional().nullable(),
  inspectionReportUrl:  z.string().optional().nullable(),
  serviceHistoryUrls:   z.array(z.string()).optional(),
  bidIncrement: z.union([z.string(), z.number()]).optional().nullable(),
  isDraft:      z.boolean().optional(),
  latitude:     z.number().min(-90).max(90).optional().nullable(),
  longitude:    z.number().min(-180).max(180).optional().nullable(),
})

// ── Bid schemas ───────────────────────────────────────────────────────────────
export const BidCreateSchema = z.object({
  carId:  z.string().min(1),
  amount: z.union([z.string(), z.number()]),
})

export const ProxyBidSchema = z.object({
  carId:     z.string().min(1),
  maxAmount: z.number().positive(),
})

// ── Saved search ──────────────────────────────────────────────────────────────
export const SavedSearchSchema = z.object({
  label:            z.string().optional().nullable(),
  brand:            z.string().optional().nullable(),
  maxPrice:         z.number().optional().nullable(),
  minYear:          z.number().int().optional().nullable(),
  fuel:             z.string().optional().nullable(),
  notifyNewListing: z.boolean().optional(),
})

// ── Chat message ──────────────────────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})
