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
  zipcode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
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
