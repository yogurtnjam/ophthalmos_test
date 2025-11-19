import { useLocation } from 'wouter';
import { useApp, generatePhaseColors } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Eye } from 'lucide-react';

export default function CVDResults() {
  const { state, nextStep, setState } = useApp();
  const [, setLocation] = useLocation();
  const { coneTestResult, advancedFilterParams } = state;

  if (!coneTestResult || !advancedFilterParams) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete Cone Test First</CardTitle>
            <CardDescription>You need to complete the cone contrast test before viewing your filter.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/cone-test')} data-testid="button-go-to-test">
              Go to Cone Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleContinue = () => {
    // Regenerate custom phase colors when starting custom tasks
    setState(s => ({
      ...s,
      customPhaseColors: generatePhaseColors(),
    }));
    nextStep();
    setLocation('/tasks');
  };

  const getCVDTypeLabel = (type: string) => {
    switch (type) {
      case 'protan':
        return 'Protanopia (Red/L-cone Deficiency)';
      case 'deutan':
        return 'Deuteranopia (Green/M-cone Deficiency)';
      case 'tritan':
        return 'Tritanopia (Blue/S-cone Deficiency)';
      case 'normal':
        return 'Normal Color Vision';
      default:
        return type;
    }
  };

  const getCVDDescription = (type: string) => {
    switch (type) {
      case 'protan':
        return 'Your test indicates reduced sensitivity to red wavelengths. We have created a custom color filter to enhance red discrimination.';
      case 'deutan':
        return 'Your test indicates reduced sensitivity to green wavelengths. We have created a custom color filter to enhance green discrimination.';
      case 'tritan':
        return 'Your test indicates reduced sensitivity to blue wavelengths. We have created a custom color filter to enhance blue-yellow discrimination.';
      case 'normal':
        return 'Your cone sensitivity appears normal across all wavelengths. A minimal adaptive filter has been generated for optimal viewing comfort.';
      default:
        return '';
    }
  };

  // Convert score (0-200) to a normalized 0-1 value for visualization
  const getNormalizedSensitivity = (score: number) => {
    return Math.max(0, Math.min(1, score / 150)); // 150+ is excellent, scale to 0-1
  };

  const getConeTypeLabel = (type: 'red' | 'green' | 'blue') => {
    switch (type) {
      case 'red':
        return 'L-cone (Red)';
      case 'green':
        return 'M-cone (Green)';
      case 'blue':
        return 'S-cone (Blue)';
    }
  };

  const getSeverityLabel = (severity: number) => {
    if (severity < 5) return 'Minimal';
    if (severity < 15) return 'Mild';
    if (severity < 25) return 'Moderate';
    return 'Severe';
  };

  const getSeverityColor = (severity: number) => {
    if (severity < 5) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (severity < 15) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (severity < 25) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getHueShiftExplanation = (baseHue: number, shift: number, cvdType: string) => {
    if (shift === 0) return 'No shift needed';
    
    // Determine color name based on hue angle (non-overlapping ranges)
    const getColorName = (hue: number) => {
      if (hue >= 345 || hue < 15) return 'Red';
      if (hue >= 15 && hue < 45) return 'Orange';
      if (hue >= 45 && hue < 75) return 'Yellow';
      if (hue >= 75 && hue < 155) return 'Green';
      if (hue >= 155 && hue < 195) return 'Cyan';
      if (hue >= 195 && hue < 255) return 'Blue';
      if (hue >= 255 && hue < 285) return 'Purple';
      if (hue >= 285 && hue < 315) return 'Magenta';
      return 'Pink';
    };
    
    const sourceName = getColorName(baseHue);
    
    // Determine target based on CVD confusion axis
    let targetDescription = '';
    
    if (cvdType === 'protan') {
      // Protanopia: Red-green confusion axis
      // Reds shift toward green/brown, Purples shift toward blue
      if (baseHue >= 345 || baseHue < 45) {
        targetDescription = 'green/brown'; // Reds and oranges
      } else if (baseHue >= 255 && baseHue < 315) {
        targetDescription = 'blue'; // Purples and magentas
      } else {
        targetDescription = 'along red-green axis';
      }
    } else if (cvdType === 'deutan') {
      // Deuteranopia: Red-green confusion axis (opposite direction)
      // Greens shift toward red/brown, Oranges/yellows affected
      if (baseHue >= 75 && baseHue < 155) {
        targetDescription = 'red/brown'; // Greens
      } else if (baseHue >= 15 && baseHue < 75) {
        targetDescription = 'red/brown'; // Oranges and yellows
      } else {
        targetDescription = 'along red-green axis';
      }
    } else if (cvdType === 'tritan') {
      // Tritanopia: Blue-yellow confusion axis
      // Blues shift toward green, Yellows shift toward pink/light gray
      if (baseHue >= 195 && baseHue < 255) {
        targetDescription = 'green'; // Blues
      } else if (baseHue >= 45 && baseHue < 75) {
        targetDescription = 'pink/light gray'; // Yellows
      } else {
        targetDescription = 'along blue-yellow axis';
      }
    } else {
      // Normal or unknown type - use calculated target
      const targetHue = (baseHue + shift + 360) % 360;
      targetDescription = getColorName(targetHue);
    }
    
    return `${sourceName} → ${targetDescription}`;
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Test Results Summary */}
        <Card data-testid="card-results-summary">
          <CardHeader>
            <CardTitle data-testid="text-cvd-type">{getCVDTypeLabel(coneTestResult.detectedType)}</CardTitle>
            <CardDescription data-testid="text-cvd-description">
              {getCVDDescription(coneTestResult.detectedType)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cone Sensitivity Overview */}
            <div className="grid gap-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">L-cone (Red) Sensitivity</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Score: {coneTestResult.L.score}</span>
                    <span>Threshold: {coneTestResult.L.threshold}%</span>
                    <span className="font-semibold">{coneTestResult.L.category}</span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded relative overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-gradient-to-r from-red-200 to-red-600"
                    style={{ width: `${getNormalizedSensitivity(coneTestResult.L.score) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">M-cone (Green) Sensitivity</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Score: {coneTestResult.M.score}</span>
                    <span>Threshold: {coneTestResult.M.threshold}%</span>
                    <span className="font-semibold">{coneTestResult.M.category}</span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded relative overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-gradient-to-r from-green-200 to-green-600"
                    style={{ width: `${getNormalizedSensitivity(coneTestResult.M.score) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">S-cone (Blue) Sensitivity</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Score: {coneTestResult.S.score}</span>
                    <span>Threshold: {coneTestResult.S.threshold}%</span>
                    <span className="font-semibold">{coneTestResult.S.category}</span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded relative overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-gradient-to-r from-blue-200 to-blue-600"
                    style={{ width: `${getNormalizedSensitivity(coneTestResult.S.score) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filter Parameters */}
        <Card data-testid="card-filter-parameters">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <CardTitle>Your Personalized Adaptive Filter</CardTitle>
            </div>
            <CardDescription>
              This filter has been automatically generated based on your cone test results. 
              It uses advanced algorithms that consider confusion lines, saturation boost, brightness increase, 
              and severity-based scaling to optimize color discrimination for your specific vision profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deficiency Type and Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Deficient Cone Type</div>
                <div className="text-lg font-semibold" data-testid="text-filter-cone-type">
                  {getConeTypeLabel(advancedFilterParams.type)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Deficiency Severity</div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(advancedFilterParams.severity)} data-testid="badge-severity">
                    {getSeverityLabel(advancedFilterParams.severity)}
                  </Badge>
                  <span className="text-sm text-muted-foreground" data-testid="text-severity-value">
                    {advancedFilterParams.severity.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hue Shifts (Confusion Line Correction) */}
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Hue Shifts (Confusion Line Correction)</div>
                <div className="text-xs text-muted-foreground">
                  Colors are rotated away from confusion lines to enhance discrimination
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 p-3 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Red (0°)</div>
                  <div className="text-lg font-mono" data-testid="text-hue-red">
                    {advancedFilterParams.hueShift.red > 0 ? '+' : ''}{advancedFilterParams.hueShift.red}°
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHueShiftExplanation(0, advancedFilterParams.hueShift.red, coneTestResult.detectedType)}
                  </div>
                </div>
                <div className="space-y-1 p-3 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Green (120°)</div>
                  <div className="text-lg font-mono" data-testid="text-hue-green">
                    {advancedFilterParams.hueShift.green > 0 ? '+' : ''}{advancedFilterParams.hueShift.green}°
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHueShiftExplanation(120, advancedFilterParams.hueShift.green, coneTestResult.detectedType)}
                  </div>
                </div>
                <div className="space-y-1 p-3 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Blue (240°)</div>
                  <div className="text-lg font-mono" data-testid="text-hue-blue">
                    {advancedFilterParams.hueShift.blue > 0 ? '+' : ''}{advancedFilterParams.hueShift.blue}°
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHueShiftExplanation(240, advancedFilterParams.hueShift.blue, coneTestResult.detectedType)}
                  </div>
                </div>
              </div>

              {/* Color Spectrum Visualization */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground text-center">
                  Color Spectrum (Hue Wheel 0° - 360°)
                </div>
                <div className="relative h-12 rounded-lg overflow-hidden" style={{
                  background: 'linear-gradient(to right, ' +
                    'hsl(0, 100%, 50%) 0%, ' +      // Red
                    'hsl(30, 100%, 50%) 8.33%, ' +  // Orange
                    'hsl(60, 100%, 50%) 16.67%, ' + // Yellow
                    'hsl(90, 100%, 50%) 25%, ' +    // Yellow-Green
                    'hsl(120, 100%, 50%) 33.33%, ' +// Green
                    'hsl(150, 100%, 50%) 41.67%, ' +// Green-Cyan
                    'hsl(180, 100%, 50%) 50%, ' +   // Cyan
                    'hsl(210, 100%, 50%) 58.33%, ' +// Cyan-Blue
                    'hsl(240, 100%, 50%) 66.67%, ' +// Blue
                    'hsl(270, 100%, 50%) 75%, ' +   // Blue-Purple
                    'hsl(300, 100%, 50%) 83.33%, ' +// Magenta
                    'hsl(330, 100%, 50%) 91.67%, ' +// Magenta-Red
                    'hsl(360, 100%, 50%) 100%' +    // Red
                  ')'
                }}>
                  {/* Markers for primary colors */}
                  <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-2 text-xs font-mono text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    <span>0° Red</span>
                    <span>120° Green</span>
                    <span>240° Blue</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1 text-xs text-center text-muted-foreground">
                  <div>30° Orange</div>
                  <div>60° Yellow</div>
                  <div>150° Cyan</div>
                  <div>180° Cyan</div>
                  <div>270° Purple</div>
                  <div>300° Magenta</div>
                </div>
              </div>
            </div>

            {/* Saturation Boost */}
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Saturation Boost</div>
                <div className="text-xs text-muted-foreground">
                  Enhances color vividness for weak cone channels
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(advancedFilterParams.saturationBoost).map(([cone, boost]) => (
                  <div key={cone} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-sm capitalize">{cone}</span>
                    <span className="text-sm font-mono" data-testid={`text-sat-${cone}`}>
                      +{(boost * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Luminance Gain */}
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Brightness Increase</div>
                <div className="text-xs text-muted-foreground">
                  Increases luminance for weak color channels
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(advancedFilterParams.luminanceGain).map(([cone, gain]) => (
                  <div key={cone} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-sm capitalize">{cone}</span>
                    <span className="text-sm font-mono" data-testid={`text-lum-${cone}`}>
                      +{(gain * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-center pb-8">
          <Button 
            onClick={handleContinue} 
            size="lg"
            data-testid="button-continue"
            className="gap-2"
          >
            Continue to Task Comparison
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
