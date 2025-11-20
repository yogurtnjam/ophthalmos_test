import { z } from "zod";

// Questionnaire Schema
export const questionnaireSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(1).max(120),
  cvdType: z.enum(["none", "protanopia", "deuteranopia", "tritanopia", "unknown"]),
  screenTimePerWeek: z.number().min(0).max(168), // hours per week
});

export type Questionnaire = z.infer<typeof questionnaireSchema>;

// Detailed Cone Metrics Schema (per cone type)
export const coneMetricsSchema = z.object({
  threshold: z.number(), // Contrast threshold percentage (0-100)
  stdError: z.number(), // Standard error percentage
  trials: z.number(), // Number of trials completed
  avgTime: z.number(), // Average response time in seconds
  logCS: z.number(), // Logarithm of contrast sensitivity
  score: z.number(), // Normalized score (0-200)
  category: z.enum(["Normal", "Possible", "Deficient"]), // Classification
});

export type ConeMetrics = z.infer<typeof coneMetricsSchema>;

// Cone Test Result Schema
export const coneTestResultSchema = z.object({
  L: coneMetricsSchema, // L-cone (red) detailed metrics
  M: coneMetricsSchema, // M-cone (green) detailed metrics
  S: coneMetricsSchema, // S-cone (blue) detailed metrics
  detectedType: z.enum(["protan", "deutan", "tritan", "normal"]),
});

export type ConeTestResult = z.infer<typeof coneTestResultSchema>;

// Advanced Colorblind Filter Parameters Schema
export const advancedFilterParamsSchema = z.object({
  type: z.enum(["red", "green", "blue"]), // Which cone type is deficient
  severity: z.number(), // Severity of deficiency (0-40 typically)
  hueShift: z.object({
    red: z.number(),
    green: z.number(),
    blue: z.number(),
  }),
  saturationBoost: z.record(z.number()), // e.g., { "red": 0.5 }
  luminanceGain: z.record(z.number()), // e.g., { "red": 0.15 }
  metadata: z.object({
    thresholds: z.object({
      red: z.number(),
      green: z.number(),
      blue: z.number(),
    }),
  }),
});

export type AdvancedFilterParams = z.infer<typeof advancedFilterParamsSchema>;

// Legacy RGB Hue Adjustments Schema (deprecated, kept for backwards compatibility)
export const rgbAdjustmentSchema = z.object({
  redHue: z.number().min(0).max(360),
  greenHue: z.number().min(0).max(360),
  blueHue: z.number().min(0).max(360),
});

export type RGBAdjustment = z.infer<typeof rgbAdjustmentSchema>;

// Task Performance Schema
export const taskPerformanceSchema = z.object({
  taskId: z.string(), // "tile-1", "tile-2", "color-match", "card-match"
  filterType: z.enum(["custom", "protanopia", "deuteranopia", "tritanopia", "grayscale"]),
  timeMs: z.number(),
  swipes: z.number(),
  clicks: z.number(),
  correct: z.boolean(),
  accuracy: z.number().min(0).max(1).optional(), // Actual accuracy ratio (0-1), e.g., 0.75 for 75%
  timestamp: z.string(),
});

export type TaskPerformance = z.infer<typeof taskPerformanceSchema>;

// Complete Session Data Schema
export const sessionDataSchema = z.object({
  questionnaire: questionnaireSchema,
  coneTestResult: coneTestResultSchema,
  rgbAdjustment: rgbAdjustmentSchema,
  advancedFilterParams: advancedFilterParamsSchema.optional(),
  taskPerformances: z.array(taskPerformanceSchema),
  createdAt: z.string(),
  // Mismatch tracking fields
  previousConeTestResult: coneTestResultSchema.optional(), // First test result for comparison
  retestRequested: z.boolean().optional(), // True if mismatch detected and retest requested
  useHybridFilter: z.boolean().optional(), // True if using OS preset + CCT confusion axis adjustment
});

export type SessionData = z.infer<typeof sessionDataSchema>;

// OS Preset Filter Types
export type OSPresetFilter = "protanopia" | "deuteranopia" | "tritanopia" | "grayscale";

// Filter application function types
export interface FilterConfig {
  type: "custom" | OSPresetFilter;
  rgbAdjustment?: RGBAdjustment;
}
