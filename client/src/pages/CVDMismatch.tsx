import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CVDMismatch() {
  const { state, setState } = useApp();
  const [, setLocation] = useLocation();
  const { questionnaire, coneTestResult } = state;

  if (!coneTestResult || !questionnaire) {
    setLocation('/');
    return null;
  }

  // Map questionnaire types to our internal format
  const getQuestionnaireType = () => {
    switch (questionnaire.cvdType) {
      case 'protanopia':
        return 'protan';
      case 'deuteranopia':
        return 'deutan';
      case 'tritanopia':
        return 'tritan';
      default:
        return null;
    }
  };

  const indicatedType = getQuestionnaireType();
  const detectedType = coneTestResult.detectedType;

  const getCVDLabel = (type: string | null) => {
    if (!type) return 'Unknown';
    switch (type) {
      case 'protan':
        return 'Protanopia (Red Deficiency)';
      case 'deutan':
        return 'Deuteranopia (Green Deficiency)';
      case 'tritan':
        return 'Tritanopia (Blue Deficiency)';
      case 'normal':
        return 'Normal Color Vision';
      default:
        return type;
    }
  };

  const handleRetakeTest = () => {
    // Mark that we've requested a retest
    // Store the previous test result for comparison
    setState(s => ({
      ...s,
      previousConeTestResult: s.coneTestResult,
      retestRequested: true,
      // Clear current test result so they retake it
      coneTestResult: null,
      advancedFilterParams: null,
    }));
    setLocation('/cone-test');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-green-50 to-white">
      <Card className="max-w-2xl w-full shadow-lg" data-testid="card-mismatch">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">CVD Type Mismatch Detected</CardTitle>
          </div>
          <CardDescription className="text-base">
            There is a discrepancy between your self-reported color vision deficiency type and what the cone contrast test detected.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Your Indicated Type
              </div>
              <Badge className="text-sm px-3 py-1" data-testid="badge-indicated-type">
                {getCVDLabel(indicatedType)}
              </Badge>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                Test Detected Type
              </div>
              <Badge className="text-sm px-3 py-1" data-testid="badge-detected-type">
                {getCVDLabel(detectedType)}
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Why This Might Happen
            </h3>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <li className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>Environmental factors (lighting, screen calibration) may have affected test accuracy</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>Some individuals have mixed CVD types with varying cone deficiencies</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>Test fatigue or concentration lapses during the assessment</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Next Steps</h3>
            <p className="text-muted-foreground text-sm">
              We recommend retaking the cone contrast test to verify the results. Please ensure you're in a well-lit environment with a properly calibrated screen.
            </p>
            <p className="text-muted-foreground text-sm">
              If the second test still shows a mismatch, the system will use your indicated type as the base filter and apply adjustments based on your cone sensitivity measurements.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleRetakeTest}
              className="flex-1"
              data-testid="button-retake-test"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Cone Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
