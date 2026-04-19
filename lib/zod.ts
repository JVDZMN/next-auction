import { z } from 'zod';

export const CarCreateSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  description: z.string().optional(),
  specs: z.string().optional().nullable(),
  condition: z.string().min(1),
  km: z.union([z.string(), z.number()]),
  year: z.union([z.string(), z.number()]),
  power: z.union([z.string(), z.number()]),
  fuel: z.string().min(1),
  images: z.array(z.string()).optional(),
  startingPrice: z.union([z.string(), z.number()]),
  reservePrice: z.union([z.string(), z.number()]).optional().nullable(),
  auctionEndDate: z.string(),
  auctionStartDate: z.string().optional().nullable(),
  zipcode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  inspectionReportUrl: z.string().optional().nullable(),
  serviceHistoryUrls: z.array(z.string()).optional(),
  bidIncrement: z.union([z.string(), z.number()]).optional().nullable(),
  isDraft: z.boolean().optional(),
});

export const ProxyBidSchema = z.object({
  carId: z.string().min(1),
  maxAmount: z.number().positive(),
});

export const SavedSearchSchema = z.object({
  label: z.string().optional(),
  brand: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  minYear: z.number().int().optional(),
  fuel: z.string().optional(),
  notifyNewListing: z.boolean().optional(),
});

export const BidCreateSchema = z.object({
  carId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).refine(val => Number(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
});

export const MessageCreateSchema = z.object({
  carId: z.string().min(1, 'Car ID is required'),
  receiverId: z.string().min(1, 'Receiver is required'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
  replyToMessageId: z.string().optional(),
});

export const ChatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
});
