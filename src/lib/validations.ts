/**
 * Tharwah Capital - Zod Validation Schemas
 * مخططات التحقق باستخدام Zod
 */
import { z } from 'zod';

// Common
export const idSchema = z.string().min(1).max(50);
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح').max(254);
export const phoneSchema = z.string().min(8).max(20).regex(/^\+?[0-9\s\-()]+$/);
export const urlSchema = z.string().url().optional();

// Client
export const clientStatusSchema = z.enum(['active', 'pending', 'suspended']);
export const clientTierSchema = z.enum(['Regular', 'Silver', 'Gold', 'Platinum', 'VIP']);

export const createClientSchema = z.object({
  name: z.string().min(2, 'الاسم قصير جداً').max(100),
  nameEn: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  nationalId: z.string().min(5).max(20).optional(),
  country: z.string().min(2).max(50),
  city: z.string().min(2).max(50),
  tier: clientTierSchema,
  riskProfile: z.string().min(2).max(50),
  initialBalance: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: idSchema,
  status: clientStatusSchema.optional(),
});

// Portfolio
export const portfolioSchema = z.object({
  clientId: idSchema,
  name: z.string().min(2).max(100),
  nameEn: z.string().min(2).max(100),
  strategy: z.string().min(2).max(500),
  risk: z.string().min(2).max(50),
  value: z.number().min(0),
  currency: z.string().length(3).default('SAR'),
});

// Transaction
export const transactionTypeSchema = z.enum(['deposit', 'withdraw', 'buy', 'sell', 'transfer', 'dividend', 'withdrawal']);
export const transactionStatusSchema = z.enum(['completed', 'pending', 'rejected', 'failed', 'cancelled']);

export const createTransactionSchema = z.object({
  clientId: idSchema,
  type: transactionTypeSchema,
  amount: z.number().positive('المبلغ يجب أن يكون موجباً').max(100000000),
  currency: z.string().length(3).default('SAR'),
  method: z.string().min(2).max(100),
  note: z.string().max(500).optional(),
});

export const updateTransactionSchema = z.object({
  id: idSchema,
  status: transactionStatusSchema,
});

// Auth
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة').max(128),
  rememberMe: z.boolean().optional(),
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const subAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(8).max(128).optional(),
  passwordHash: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'يجب اختيار صلاحية واحدة على الأقل'),
  status: z.enum(['active', 'suspended']).default('active'),
});

// CMS
export const heroContentSchema = z.object({
  badge: z.string().min(2).max(100),
  badgeEn: z.string().min(2).max(100),
  title: z.string().min(10).max(200),
  titleEn: z.string().min(10).max(200),
  subtitle: z.string().min(20).max(500),
  subtitleEn: z.string().min(20).max(500),
  ctaPrimary: z.string().min(2).max(50),
  ctaPrimaryEn: z.string().min(2).max(50),
  ctaSecondary: z.string().min(2).max(50),
  ctaSecondaryEn: z.string().min(2).max(50),
});

export const serviceItemSchema = z.object({
  id: z.string(),
  icon: z.string().max(10),
  title: z.string().min(2).max(100),
  titleEn: z.string().min(2).max(100),
  desc: z.string().min(10).max(500),
  descEn: z.string().min(10).max(500),
  active: z.boolean(),
});

export const marketItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  nameEn: z.string().min(2).max(100),
  symbol: z.string().min(1).max(20),
  price: z.string().min(1).max(50),
  change: z.number(),
  category: z.string().min(2).max(50),
  categoryEn: z.string().min(2).max(50),
  visible: z.boolean(),
});

export const faqItemSchema = z.object({
  question: z.string().min(5).max(200),
  questionEn: z.string().min(5).max(200),
  answer: z.string().min(10).max(1000),
  answerEn: z.string().min(10).max(1000),
  category: z.string().min(2).max(50),
  published: z.boolean(),
  order: z.number().int().min(0),
});

// Contact / Support
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
});

export const supportTicketSchema = z.object({
  clientId: idSchema,
  subject: z.string().min(5).max(200),
  text: z.string().min(10).max(2000),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
});

// Settings
export const platformSettingsSchema = z.object({
  siteName: z.string().min(2).max(100),
  siteNameEn: z.string().min(2).max(100),
  supportPhone: phoneSchema,
  supportEmail: emailSchema,
  defaultCurrency: z.string().length(3),
  defaultLanguage: z.enum(['ar', 'en']),
  maintenanceMode: z.boolean(),
  registrationOpen: z.boolean(),
  twoFactorRequired: z.boolean(),
  sessionTimeout: z.number().int().min(1).max(24),
  weeklyDigest: z.boolean(),
  instantAlerts: z.boolean(),
});

// Helpers
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
