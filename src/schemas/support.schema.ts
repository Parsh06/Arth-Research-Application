import { z } from 'zod';

export const SupportMessageSchema = z.object({
  id: z.string().min(1),
  ticketId: z.string().min(1),
  senderId: z.string().min(1),
  senderRole: z.enum(['user', 'admin', 'support']),
  senderName: z.string().min(1),
  message: z.string().min(1),
  createdAt: z.union([z.string(), z.number()])
});

export type SupportMessage = z.infer<typeof SupportMessageSchema>;

export const SupportTicketSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().default('Investor'),
  subject: z.string().min(3),
  category: z.enum(['portfolio', 'billing', 'technical', 'advisory', 'general']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']).default('open'),
  lastMessageSnippet: z.string().default(''),
  createdAt: z.union([z.string(), z.number()]),
  updatedAt: z.union([z.string(), z.number()])
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;
