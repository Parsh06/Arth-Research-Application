// src/schemas/user.schema.ts
import { z } from 'zod';

export const RoleEnum = z.enum([
  'user',
  'admin',
  'super_admin',
  'support',
  'finance',
  'research_admin'
]);

export const RiskProfileEnum = z.enum(['Low', 'Medium', 'High']);

export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  role: RoleEnum.default('user'),
  status: z.enum(['active', 'suspended', 'revoked']).default('active'),
  revocationReason: z.string().optional(),
  revokedAt: z.string().optional(),
  revokedBy: z.string().optional(),
  theme: z.enum(['dark', 'light']).default('dark'),
  emailVerified: z.boolean().default(false),
  profileVersion: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  lastLoginAt: z.string().optional()
});

export const UserPrivateSchema = z.object({
  phone: z.string().optional(),
  phoneVerified: z.boolean().default(false),
  country: z.string().default('India'),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    postalCode: z.string().optional()
  }).optional(),
  dob: z.string().optional(),
  communicationPreferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true)
  }).default({ email: true, sms: false, push: true }),
  updatedAt: z.string().optional()
});

export const UserComplianceSchema = z.object({
  kycStatus: z.enum(['pending', 'in_progress', 'verified', 'rejected']).default('pending'),
  panLast4: z.string().length(4).optional(),
  panToken: z.string().optional(),
  riskProfile: RiskProfileEnum.default('Medium'),
  investmentExperience: z.string().optional(),
  occupation: z.string().optional(),
  verifiedAt: z.string().optional(),
  verifiedBy: z.string().optional(),
  updatedAt: z.string().optional()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserPrivate = z.infer<typeof UserPrivateSchema>;
export type UserCompliance = z.infer<typeof UserComplianceSchema>;
