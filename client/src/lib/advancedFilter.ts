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
 * Uses self-reported CVD type as base, with CCT scores for severity measurement
 */
export function createFilterFromConeTest(
  coneTestResult: ConeTestResult,
  selfReportedType?: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none' | 'unknown' | null
): AdvancedFilterParams {
  // Map self-reported type to cone type
  const getSelfReportedConeType = (): 'red' | 'green' | 'blue' | null => {
    switch (selfReportedType) {
      case 'protanopia': return 'red';
      case 'deuteranopia': return 'green';
      case 'tritanopia': return 'blue';
      case 'none': return null;
      case 'unknown': return null;
      default: return null;
    }
  };

  const selfReportedCone = getSelfReportedConeType();

  // If user has self-reported a specific CVD type, use it as the base
  if (selfReportedCone) {
    return createAdvancedColorblindFilterWithType(
      coneTestResult.L.threshold,
      coneTestResult.M.threshold,
      coneTestResult.S.threshold,
      selfReportedCone
    );
  }

  // Fallback: No self-report, use detected type from CCT
  return createAdvancedColorblindFilter(
    coneTestResult.L.threshold,
    coneTestResult.M.threshold,
    coneTestResult.S.threshold
  );
}

/**
 * Create advanced filter with explicit CVD type (self-reported)
 * Uses CCT thresholds only for severity measurement on the specified axis
 */
function createAdvancedColorblindFilterWithType(
  redThreshold: number,
  greenThreshold: number,
  blueThreshold: number,
  coneType: 'red' | 'green' | 'blue'
): AdvancedFilterParams {
  // 1. Compute deficiency relative to normal cone threshold (~7%)
  const norm = 7;
  const deficiency = {
    red: Math.max(0, redThreshold - norm),
    green: Math.max(0, greenThreshold - norm),
    blue: Math.max(0, blueThreshold - norm),
  };

  // 2. Use the specified cone type (self-reported)
  const severity = deficiency[coneType]; // severity from CCT for that specific axis

  // 3. Convert severity → correction strength (continuous)
  const hueAngle = Math.min(25, severity * 0.6);
  const satBoost = Math.min(0.8, severity * 0.02);
  const lumGain = Math.min(0.25, severity * 0.006);

  // 4. Confusion line hue-shifting rules
  let redShift = 0;
  let greenShift = 0;
  let blueShift = 0;
  const saturationBoost: Record<string, number> = {};
  const luminanceGain: Record<string, number> = {};

  if (coneType === 'green') {
    // Deutan (M-cone weak)
    greenShift = +hueAngle;
    redShift = -hueAngle * 0.6;
    blueShift = 0;
    saturationBoost.green = satBoost;
    luminanceGain.green = lumGain;
  } else if (coneType === 'red') {
    // Protan (L-cone weak)
    redShift = +hueAngle;
    greenShift = -hueAngle * 0.6;
    blueShift = 0;
    saturationBoost.red = satBoost;
    luminanceGain.red = lumGain;
  } else if (coneType === 'blue') {
    // Tritan (S-cone weak)
    blueShift = +hueAngle;
    redShift = -hueAngle * 0.3;
    greenShift = -hueAngle * 0.3;
    saturationBoost.blue = satBoost;
    luminanceGain.blue = lumGain;
  }

  // Package final filter
  return {
    type: coneType,
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
