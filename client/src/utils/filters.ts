import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from './color';
import { OSPresetFilter, RGBAdjustment, AdvancedFilterParams } from '../../../shared/schema';

// 3×3 matrices from the classic Coblis / Colorjack implementation (iOS-style)
// See: https://gist.github.com/Lokno/df7c3bfdc9ad32558bb7
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
 * 
 * @param colorHex   Input color as #rrggbb
 * @param preset     Which iOS-like filter to apply
 * @param intensity  0–1, how strong the filter is (like iOS slider). Default: 1 (full intensity)
 */
export function applyOSPresetFilter(
  colorHex: string,
  preset: OSPresetFilter,
  intensity = 1
): string {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return colorHex; // fall back if parsing fails

  const mat = CVD_MATRICES[preset];
  const filtered = applyMatrix(rgb.r, rgb.g, rgb.b, mat);

  // Blend original + filtered based on intensity,
  // so intensity=0 is original, 1 is full filter.
  const mix = (orig: number, f: number) => orig + (f - orig) * intensity;

  const r = Math.round(mix(rgb.r, filtered.r));
  const g = Math.round(mix(rgb.g, filtered.g));
  const b = Math.round(mix(rgb.b, filtered.b));

  return rgbToHex(r, g, b);
}

/**
 * Apply advanced colorblind filter based on cone test results
 * 
 * This research-grade filter uses:
 * - Hue shifts away from confusion lines
 * - Saturation boost for weak cones
 * - Luminance gain for weak channels
 * - Severity-based scaling
 */
export function applyAdvancedColorblindFilter(hex: string, filterParams: AdvancedFilterParams): string {
  const { r, g, b } = hexToRgb(hex);
  
  // Convert to HSL for manipulation
  const hsl = rgbToHsl(r, g, b);
  
  // Skip achromatic colors (grays)
  if (hsl.s < 0.01) {
    return hex;
  }
  
  // Determine which hue shift to apply based on the color's position in hue space
  // We apply different shifts to different hue ranges based on confusion line modeling
  let hueShiftAmount = 0;
  
  // Map hue to primary color region and apply corresponding shift
  if (hsl.h >= 0 && hsl.h < 60) {
    // Red-Yellow region
    hueShiftAmount = filterParams.hueShift.red;
  } else if (hsl.h >= 60 && hsl.h < 180) {
    // Yellow-Green-Cyan region
    hueShiftAmount = filterParams.hueShift.green;
  } else if (hsl.h >= 180 && hsl.h < 300) {
    // Cyan-Blue-Magenta region
    hueShiftAmount = filterParams.hueShift.blue;
  } else {
    // Magenta-Red region
    hueShiftAmount = filterParams.hueShift.red;
  }
  
  // Apply hue shift
  let newHue = (hsl.h + hueShiftAmount + 360) % 360;
  
  // Apply saturation boost for the deficient cone type
  let newSat = hsl.s;
  const satBoostKey = filterParams.type;
  if (filterParams.saturationBoost[satBoostKey] !== undefined) {
    newSat = Math.min(1, hsl.s * (1 + filterParams.saturationBoost[satBoostKey]));
  }
  
  // Apply luminance gain for the deficient cone type
  let newLum = hsl.l;
  const lumGainKey = filterParams.type;
  if (filterParams.luminanceGain[lumGainKey] !== undefined) {
    newLum = Math.min(1, hsl.l * (1 + filterParams.luminanceGain[lumGainKey]));
  }
  
  // Convert back to RGB
  const newRgb = hslToRgb(newHue, newSat, newLum);
  
  return rgbToHex(
    Math.round(Math.max(0, Math.min(255, newRgb.r))),
    Math.round(Math.max(0, Math.min(255, newRgb.g))),
    Math.round(Math.max(0, Math.min(255, newRgb.b)))
  );
}

// DEPRECATED: Legacy custom adaptive filter based on RGB hue adjustments
// Kept for backwards compatibility but no longer used
export function applyCustomAdaptiveFilter(hex: string, adjustment: RGBAdjustment): string {
  const { r, g, b } = hexToRgb(hex);
  
  // Convert the full color to HSL
  const hsl = rgbToHsl(r, g, b);
  
  // Avoid processing achromatic colors (grays) 
  if (hsl.s < 0.01) {
    return hex;
  }
  
  // Calculate average hue offset from default RGB hues
  // Default: Red=0°, Green=120°, Blue=240°
  // Adjustment represents user's preferred hue for each primary
  const avgOffset = (
    (adjustment.redHue - 0) +
    (adjustment.greenHue - 120) +
    (adjustment.blueHue - 240)
  ) / 3;
  
  // Apply global hue shift based on average offset
  // This provides a consistent transformation across all colors
  const newHue = (hsl.h + avgOffset + 360) % 360;
  
  // Convert back to RGB
  const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
  
  return rgbToHex(
    Math.round(Math.max(0, Math.min(255, newRgb.r))),
    Math.round(Math.max(0, Math.min(255, newRgb.g))),
    Math.round(Math.max(0, Math.min(255, newRgb.b)))
  );
}

// Get filter name for display
export function getFilterDisplayName(filterType: 'custom' | OSPresetFilter): string {
  switch (filterType) {
    case 'custom':
      return 'Custom Adaptive';
    case 'protanopia':
      return 'Protanopia Preset';
    case 'deuteranopia':
      return 'Deuteranopia Preset';
    case 'tritanopia':
      return 'Tritanopia Preset';
    case 'grayscale':
      return 'Grayscale Preset';
    default:
      return filterType;
  }
}

// Determine which OS preset to use based on detected CVD type
export function getRecommendedOSPreset(detectedType: string): OSPresetFilter {
  switch (detectedType.toLowerCase()) {
    case 'protan':
      return 'protanopia';
    case 'deutan':
      return 'deuteranopia';
    case 'tritan':
      return 'tritanopia';
    default:
      return 'grayscale';
  }
}
