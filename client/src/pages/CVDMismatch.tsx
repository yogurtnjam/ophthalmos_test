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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg" data-testid="card-mismatch">
          <CardContent className="space-y-6 pt-6">
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
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Please retake the test in good lighting. If results still differ, we'll use your indicated type with custom adjustments.
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
    </div>
  );
}
