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
    <div className="min-h-screen bg-white">
      {/* Gradient Header with Wave */}
      <div className="relative bg-gradient-to-r from-blue-600 via-teal-500 to-green-400 pb-32">
        <div className="container mx-auto px-4 pt-12 pb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              CVD Type Mismatch Detected
            </h1>
          </div>
          <p className="text-white/90 text-lg max-w-3xl">
            There is a discrepancy between your self-reported color vision deficiency type and what the cone contrast test detected.
          </p>
        </div>
        
        {/* Wave Shape */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
          </svg>
        </div>
      </div>

      {/* Content Card */}
      <div className="container mx-auto px-4 -mt-24 pb-12">
        <Card className="max-w-2xl mx-auto shadow-lg" data-testid="card-mismatch">
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
