import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from './color';
import { OSPresetFilter, RGBAdjustment, AdvancedFilterParams } from '../../../shared/schema';

// 3×3 matrices from the classic Coblis / Colorjack implementation (iOS-style)
const CVD_MATRICES: Record<OSPresetFilter, number[][]> = {
  grayscale: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0,   0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.700, 0.300, 0.0],
    [0.0,   0.300, 0.700],
  ],
  tritanopia: [
    [0.950, 0.050, 0.0],
    [0.0,   0.433, 0.567],
    [0.0,   0.475, 0.525],
  ],
};

function clamp255(x: number): number {
  return Math.max(0, Math.min(255, x));
}

function applyMatrix(
  r: number,
  g: number,
  b: number,
  mat: number[][]
): { r: number; g: number; b: number } {
  const r2 = mat[0][0] * r + mat[0][1] * g + mat[0][2] * b;
  const g2 = mat[1][0] * r + mat[1][1] * g + mat[1][2] * b;
  const b2 = mat[2][0] * r + mat[2][1] * g + mat[2][2] * b;
  return { r: clamp255(r2), g: clamp255(g2), b: clamp255(b2) };
}

/**
 * Apply iOS-style color-blind filter (OS preset filters)
 */
export function applyOSPresetFilter(
  colorHex: string,
  preset: OSPresetFilter,
  intensity = 1
): string {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return colorHex; // fallback

  const mat = CVD_MATRICES[preset];
  const filtered = applyMatrix(rgb.r, rgb.g, rgb.b, mat);

  const mix = (orig: number, f: number) => orig + (f - orig) * intensity;

  const r = Math.round(mix(rgb.r, filtered.r));
  const g = Math.round(mix(rgb.g, filtered.g));
  const b = Math.round(mix(rgb.b, filtered.b));

  return rgbToHex(r, g, b);
}

/**
 * Advanced research-grade colorblind filter using true confusion axes
 * with per-cone severity scaling (Brettel et al., 1997 inspired)
 */
export function applyAdvancedColorblindFilter(
  hex: string,
  params: AdvancedFilterParams
): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Normalize RGB to 0–1
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Return original hex for achromatic/near-achromatic colors (avoid false color shifts)
  const epsilon = 0.01; // Tolerance for near-grayscale detection
  if (Math.abs(r - g) < epsilon && Math.abs(g - b) < epsilon) {
    return hex;
  }

  const coneType = params.type; // Keep type as 'red' | 'green' | 'blue'
  // Normalize severity from 0-40 scale to 0-1 scale for matrix intensity
  const severity = Math.min(1, (params.severity ?? 0) / 40);

  // Confusion matrix per CVD type
  // Map cone type to confusion matrix
  let mat: number[][];

  switch (coneType) {
    case 'red': // L-cone deficiency = Protanopia
      mat = [
        [1 - 0.56667 * severity, 0.43333 * severity, 0],
        [0.55833 * severity, 1 - 0.55833 * severity, 0],
        [0, 0.24167 * severity, 1 - 0.24167 * severity],
      ];
      break;
    case 'green': // M-cone deficiency = Deuteranopia
      mat = [
        [1 - 0.625 * severity, 0.375 * severity, 0],
        [0.7 * severity, 1 - 0.7 * severity, 0],
        [0, 0.3 * severity, 1 - 0.3 * severity],
      ];
      break;
    case 'blue': // S-cone deficiency = Tritanopia
      mat = [
        [1 - 0.95 * severity, 0.05 * severity, 0],
        [0, 1 - 0.433 * severity, 0.433 * severity],
        [0, 0.475 * severity, 1 - 0.475 * severity],
      ];
      break;
    default:
      return hex; // fallback for normal vision
  }

  // Apply matrix
  const applyMat = (r: number, g: number, b: number, m: number[][]) => {
    const r2 = m[0][0] * r + m[0][1] * g + m[0][2] * b;
    const g2 = m[1][0] * r + m[1][1] * g + m[1][2] * b;
    const b2 = m[2][0] * r + m[2][1] * g + m[2][2] * b;
    return [r2, g2, b2];
  };

  let [rF, gF, bF] = applyMat(r, g, b, mat);
  
  // Clamp matrix output to valid range [0, 1]
  rF = Math.max(0, Math.min(1, rF));
  gF = Math.max(0, Math.min(1, gF));
  bF = Math.max(0, Math.min(1, bF));

  // Convert filtered RGB → HSL
  const max = Math.max(rF, gF, bF);
  const min = Math.min(rF, gF, bF);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;
  
  // Only compute saturation and hue if not grayscale
  if (max !== min) {
    s = l <= 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
    
    if (max === rF) h = (gF - bF) / (max - min);
    else if (max === gF) h = 2 + (bF - rF) / (max - min);
    else h = 4 + (rF - gF) / (max - min);
    h = (h * 60 + 360) % 360;
  }
  
  // Return original hex for achromatic colors (avoid false color shifts)
  if (s < 0.01) {
    return hex;
  }

  // Saturation boost
  const satBoost = params.saturationBoost?.[coneType] ?? 0;
  s = Math.min(1, s * (1 + satBoost * severity));

  // Luminance gain
  const lumGain = params.luminanceGain?.[coneType] ?? 0;
  const lNew = Math.min(1, l * (1 + lumGain * severity));

  // Convert HSL → RGB
  const hslToRgbInternal = (h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (h < 60) [r1, g1, b1] = [c, x, 0];
    else if (h < 120) [r1, g1, b1] = [x, c, 0];
    else if (h < 180) [r1, g1, b1] = [0, c, x];
    else if (h < 240) [r1, g1, b1] = [0, x, c];
    else if (h < 300) [r1, g1, b1] = [x, 0, c];
    else [r1, g1, b1] = [c, 0, x];
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  };

  const newRgb = hslToRgbInternal(h, s, lNew);

  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * DEPRECATED: Legacy custom adaptive filter
 */
export function applyCustomAdaptiveFilter(hex: string, adjustment: RGBAdjustment): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  if (hsl.s < 0.01) return hex;
  const avgOffset = (
    (adjustment.redHue - 0) +
    (adjustment.greenHue - 120) +
    (adjustment.blueHue - 240)
  ) / 3;
  const newHue = (hsl.h + avgOffset + 360) % 360;
  const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
  return rgbToHex(
    Math.round(Math.max(0, Math.min(255, newRgb.r))),
    Math.round(Math.max(0, Math.min(255, newRgb.g))),
    Math.round(Math.max(0, Math.min(255, newRgb.b)))
  );
}

/**
 * Get display name for filter type
 */
export function getFilterDisplayName(filterType: 'custom' | OSPresetFilter): string {
  switch (filterType) {
    case 'custom': return 'Custom Adaptive';
    case 'protanopia': return 'Protanopia Preset';
    case 'deuteranopia': return 'Deuteranopia Preset';
    case 'tritanopia': return 'Tritanopia Preset';
    case 'grayscale': return 'Grayscale Preset';
    default: return filterType;
  }
}

/**
 * Map detected CVD type to OS preset
 */
export function getRecommendedOSPreset(detectedType: string): OSPresetFilter {
  switch (detectedType.toLowerCase()) {
    case 'protan': return 'protanopia';
    case 'deutan': return 'deuteranopia';
    case 'tritan': return 'tritanopia';
    default: return 'grayscale';
  }
}

/**
 * Cone test scores for each CVD axis
 */
export interface ConeTestScores {
  protan: number;
  deutan: number;
  tritan: number;
}

/**
 * Recommended colorblind filter configuration
 */
export interface RecommendedFilter {
  type: 'protan' | 'deutan' | 'tritan';
  severity: number; // 0–1 normalized severity
}

/**
 * Determines the recommended colorblind filter for a user based on 
 * self-reported type and/or cone test scores.
 * 
 * @param userType - User-reported CVD type (optional). If provided, takes precedence.
 * @param coneTestScores - Numeric scores for each CVD axis (protan, deutan, tritan).
 *                        Higher scores indicate greater deficiency.
 * 
 * @returns Recommended filter configuration with type and severity (0–1)
 * 
 * @example
 * // User reports deuteranopia, scores confirm it
 * const filter = getRecommendedFilter('deutan', { protan: 10, deutan: 35, tritan: 8 });
 * // Returns: { type: 'deutan', severity: 0.875 }
 * 
 * @example
 * // No user type provided, pick highest score
 * const filter = getRecommendedFilter(undefined, { protan: 28, deutan: 12, tritan: 5 });
 * // Returns: { type: 'protan', severity: 0.7 }
 */
export function getRecommendedFilter(
  userType: 'protan' | 'deutan' | 'tritan' | undefined,
  coneTestScores: ConeTestScores
): RecommendedFilter {
  // Validate and normalize cone test scores (handle missing/invalid inputs)
  const scores = {
    protan: Math.max(0, Math.min(40, coneTestScores?.protan ?? 0)),
    deutan: Math.max(0, Math.min(40, coneTestScores?.deutan ?? 0)),
    tritan: Math.max(0, Math.min(40, coneTestScores?.tritan ?? 0)),
  };

  // Determine primary CVD type
  let primaryType: 'protan' | 'deutan' | 'tritan';

  if (userType) {
    // Rule 1: If userType is provided, use it as the primary type
    primaryType = userType;
  } else {
    // Rule 2: If userType is missing, pick the type with the highest score
    const maxScore = Math.max(scores.protan, scores.deutan, scores.tritan);
    
    if (scores.protan === maxScore) {
      primaryType = 'protan';
    } else if (scores.deutan === maxScore) {
      primaryType = 'deutan';
    } else {
      primaryType = 'tritan';
    }
  }

  // Calculate base severity for the primary type (normalize 0-40 scale to 0-1)
  let severity = scores[primaryType] / 40;

  // Rule 3: Handle blending when scores are close across multiple axes
  // If scores are within 0.1 normalized difference (4 points on 0-40 scale),
  // allow minor contributions from other axes to increase overall severity
  const CLOSE_THRESHOLD = 4; // Points difference considered "close"
  const primaryScore = scores[primaryType];
  
  // Check if other axes have close scores
  const otherAxes = (['protan', 'deutan', 'tritan'] as const).filter(
    axis => axis !== primaryType
  );
  
  let blendedContribution = 0;
  let closeAxesCount = 0;
  
  for (const axis of otherAxes) {
    const diff = Math.abs(primaryScore - scores[axis]);
    if (diff < CLOSE_THRESHOLD) {
      // This axis is close to primary - add a weighted contribution
      // Weight decreases as difference increases
      const weight = 1 - (diff / CLOSE_THRESHOLD);
      blendedContribution += (scores[axis] / 40) * weight * 0.15; // Max 15% contribution per axis
      closeAxesCount++;
    }
  }
  
  // Add blended contributions to severity (capped at 1.0)
  if (closeAxesCount > 0) {
    severity = Math.min(1.0, severity + blendedContribution);
  }

  // Ensure severity stays within valid range
  severity = Math.max(0, Math.min(1, severity));

  return {
    type: primaryType,
    severity,
  };
}
