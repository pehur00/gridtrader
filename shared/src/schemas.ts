import { z } from 'zod';

// User Schemas
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const RegisterDataSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// Grid Strategy Schemas
export const GridParametersSchema = z.object({
  upperPrice: z.number().positive('Upper price must be positive'),
  lowerPrice: z.number().positive('Lower price must be positive'),
  gridCount: z.number().int().min(2, 'Grid count must be at least 2').max(100, 'Grid count cannot exceed 100'),
  totalInvestment: z.number().positive('Investment amount must be positive'),
  spacing: z.enum(['uniform', 'geometric']),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive'])
});

export const GridGeneratorFormSchema = z.object({
  tradingPair: z.string().regex(/^[A-Z]+\/[A-Z]+$/, 'Invalid trading pair format (e.g., BTC/USDT)'),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentAmount: z.number().positive('Investment amount must be positive'),
  duration: z.number().int().positive().optional()
});

// Exchange Schemas
export const ExchangeSettingsFormSchema = z.object({
  apiKey: z.string().min(10, 'API key must be at least 10 characters'),
  secret: z.string().min(10, 'Secret must be at least 10 characters'),
  exchangeName: z.string().min(1, 'Exchange name is required')
});

// API Response Schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

// Validation Utilities
export const validateLogin = (data: unknown) => LoginCredentialsSchema.safeParse(data);
export const validateRegister = (data: unknown) => RegisterDataSchema.safeParse(data);
export const validateGridParameters = (data: unknown) => GridParametersSchema.safeParse(data);
export const validateGridGeneratorForm = (data: unknown) => GridGeneratorFormSchema.safeParse(data);
export const validateExchangeSettings = (data: unknown) => ExchangeSettingsFormSchema.safeParse(data);

// Type inference from schemas
export type LoginCredentialsInput = z.infer<typeof LoginCredentialsSchema>;
export type RegisterDataInput = z.infer<typeof RegisterDataSchema>;
export type GridParametersInput = z.infer<typeof GridParametersSchema>;
export type GridGeneratorFormInput = z.infer<typeof GridGeneratorFormSchema>;
export type ExchangeSettingsInput = z.infer<typeof ExchangeSettingsFormSchema>;