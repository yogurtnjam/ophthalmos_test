import { ConeTestResult, AdvancedFilterParams } from '../../../shared/schema';

/**
 * Create a research-grade, personalized adaptive filter
 * using cone thresholds and confusion-axis modeling.
 * 
 * Based on cone contrast sensitivity thresholds from psychophysical testing.
 */
export function createAdvancedColorblindFilter(
  redThreshold: number,
  greenThreshold: number,
  blueThreshold: number
): AdvancedFilterParams {
  // 1. Compute deficiency relative to normal cone threshold (~7%)
  const norm = 7;
  const deficiency = {
    red: Math.max(0, redThreshold - norm),
    green: Math.max(0, greenThreshold - norm),
    blue: Math.max(0, blueThreshold - norm),
  };

  // 2. Determine color-blind type = cone with highest deficiency
  const cbType = Object.entries(deficiency).reduce((max, [key, value]) =>
    value > deficiency[max] ? key as 'red' | 'green' | 'blue' : max,
    'red' as 'red' | 'green' | 'blue'
  );
  const severity = deficiency[cbType]; // severity (0–40 typically)

  // 3. Convert severity → correction strength (continuous)
  // Angle: 0–25° max shift
  const hueAngle = Math.min(25, severity * 0.6);

  // Saturation boost: 0–0.8×
  const satBoost = Math.min(0.8, severity * 0.02);

  // Luminance boost: 0–25%
  const lumGain = Math.min(0.25, severity * 0.006);

  // 4. Confusion line hue-shifting rules
  // These follow known chromaticity confusion axes for each type.
  let redShift = 0;
  let greenShift = 0;
  let blueShift = 0;
  const saturationBoost: Record<string, number> = {};
  const luminanceGain: Record<string, number> = {};

  if (cbType === 'green') {
    // Deutan (M-cone weak)
    // Shift green away from red-green confusion line → toward yellow
    greenShift = +hueAngle;
    // Shift red slightly opposite direction to widen separation
    redShift = -hueAngle * 0.6;
    // Blue mostly unaffected
    blueShift = 0;

    saturationBoost.green = satBoost;
    luminanceGain.green = lumGain;
  } else if (cbType === 'red') {
    // Protan (L-cone weak)
    // Shift red toward magenta to break red-green confusion
    redShift = +hueAngle;
    greenShift = -hueAngle * 0.6;
    blueShift = 0;

    saturationBoost.red = satBoost;
    luminanceGain.red = lumGain;
  } else if (cbType === 'blue') {
    // Tritan (S-cone weak)
    // Shift blue away from blue-yellow confusion → toward cyan
    blueShift = +hueAngle;
    // Shift yellow (red+green mix) opposite direction
    redShift = -hueAngle * 0.3;
    greenShift = -hueAngle * 0.3;

    saturationBoost.blue = satBoost;
    luminanceGain.blue = lumGain;
  }

  // Package final filter
  return {
    type: cbType,
    severity,
    hueShift: {
      red: Number(redShift.toFixed(2)),
      green: Number(greenShift.toFixed(2)),
      blue: Number(blueShift.toFixed(2)),
    },
    saturationBoost,
    luminanceGain,
    metadata: {
      thresholds: {
        red: redThreshold,
        green: greenThreshold,
        blue: blueThreshold,
      },
    },
  };
}

/**
 * Convenience function to create filter parameters from cone test results
 */
export function createFilterFromConeTest(coneTestResult: ConeTestResult): AdvancedFilterParams {
  return createAdvancedColorblindFilter(
    coneTestResult.L.threshold,
    coneTestResult.M.threshold,
    coneTestResult.S.threshold
  );
}
