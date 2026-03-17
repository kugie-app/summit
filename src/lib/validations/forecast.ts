import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const forecastStreamTypeEnum = z.enum(['revenue', 'expense']);
export type ForecastStreamType = z.infer<typeof forecastStreamTypeEnum>;

export const forecastScopeTypeEnum = z.enum(['global', 'stream', 'item']);
export type ForecastScopeType = z.infer<typeof forecastScopeTypeEnum>;

// ── Forecast ───────────────────────────────────────────────────────────────

const yearMonthRegex = /^\d{4}-\d{2}$/;

export const forecastSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  startDate: z.string().regex(yearMonthRegex, 'Start date must be YYYY-MM'),
  endDate: z.string().regex(yearMonthRegex, 'End date must be YYYY-MM'),
  currency: z.string().default('IDR'),
});

export type ForecastFormValues = z.infer<typeof forecastSchema>;

// ── Streams ────────────────────────────────────────────────────────────────

export const forecastStreamSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: forecastStreamTypeEnum,
  order: z.number().int().default(0),
});

export type ForecastStreamFormValues = z.infer<typeof forecastStreamSchema>;

// ── Items ──────────────────────────────────────────────────────────────────

export const forecastItemSchema = z.object({
  streamId: z.number().int().positive(),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  order: z.number().int().default(0),
  incomeCategoryId: z.number().int().positive().optional().nullable(),
  expenseCategoryId: z.number().int().positive().optional().nullable(),
});

export type ForecastItemFormValues = z.infer<typeof forecastItemSchema>;

// ── Period Values ──────────────────────────────────────────────────────────

export const forecastPeriodValueSchema = z.object({
  itemId: z.number().int().positive(),
  period: z.string().regex(yearMonthRegex, 'Period must be YYYY-MM'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal'),
});

export type ForecastPeriodValueFormValues = z.infer<typeof forecastPeriodValueSchema>;

export const forecastBulkPeriodValuesSchema = z.object({
  values: z.array(forecastPeriodValueSchema).min(1),
});

export type ForecastBulkPeriodValues = z.infer<typeof forecastBulkPeriodValuesSchema>;

// ── Variables ──────────────────────────────────────────────────────────────

export const forecastVariableSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.string().regex(/^-?\d+(\.\d{1,4})?$/, 'Value must be a valid decimal'),
  description: z.string().optional().nullable(),
});

export type ForecastVariableFormValues = z.infer<typeof forecastVariableSchema>;

// ── Growth Rules ───────────────────────────────────────────────────────────

export const forecastGrowthRuleSchema = z.object({
  scopeType: forecastScopeTypeEnum,
  scopeId: z.number().int().positive().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  growthRate: z.string().regex(/^-?\d+(\.\d{1,4})?$/, 'Growth rate must be a valid decimal'),
});

export type ForecastGrowthRuleFormValues = z.infer<typeof forecastGrowthRuleSchema>;

// ── Seasonality Weights ────────────────────────────────────────────────────

export const forecastSeasonalityWeightSchema = z.object({
  scopeType: forecastScopeTypeEnum,
  scopeId: z.number().int().positive().optional().nullable(),
  month: z.number().int().min(1).max(12),
  weight: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Weight must be a valid decimal'),
});

export type ForecastSeasonalityWeightFormValues = z.infer<typeof forecastSeasonalityWeightSchema>;

// ── Assumptions (combined) ─────────────────────────────────────────────────

export const forecastAssumptionsSchema = z.object({
  variables: z.array(forecastVariableSchema).optional(),
  growthRules: z.array(forecastGrowthRuleSchema).optional(),
  seasonalityWeights: z.array(forecastSeasonalityWeightSchema).optional(),
});

export type ForecastAssumptionsFormValues = z.infer<typeof forecastAssumptionsSchema>;

// ── CSV Import ─────────────────────────────────────────────────────────────

export const forecastCsvRowSchema = z.object({
  stream: z.string().min(1),
  item: z.string().min(1),
  category: z.string().optional(),
  periods: z.record(z.string().regex(yearMonthRegex), z.string()),
});

export type ForecastCsvRow = z.infer<typeof forecastCsvRowSchema>;
