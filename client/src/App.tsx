import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from './context/AppContext';
import { Button } from '@/components/ui/button';
import Questionnaire from './pages/Questionnaire';
import ConeTest from './pages/ConeTest';
import CVDResults from './pages/CVDResults';
import CVDMismatch from './pages/CVDMismatch';
import TaskGames from './pages/TaskGames';
import Statistics from './pages/Statistics';
import './styles.css';

function Router() {
  const { setFilterMode, state } = useApp();
  const [location, setLocation] = useLocation();

  const handleCustomPresetClick = () => {
    setFilterMode('custom');
    setLocation('/tasks');
  };

  const handleOSPresetClick = () => {
    setFilterMode(state.selectedOSPreset);
    setLocation('/tasks');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-200 px-4 py-3 sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}>
        <div className="container mx-auto flex gap-2 flex-wrap items-center">
          <span className="font-bold text-xl mr-4 text-white">OPHTHALMOS</span>
          <Link href="/">
            <Button
              variant={location === '/' ? 'default' : 'outline'}
              size="sm"
              data-testid="link-questionnaire"
            >
              Questionnaire
            </Button>
          </Link>
          <Link href="/cone-test">
            <Button
              variant={location === '/cone-test' ? 'default' : 'outline'}
              size="sm"
              data-testid="link-cone-test"
            >
              Cone Test
            </Button>
          </Link>
          <Button
            variant={location === '/tasks' && state.currentFilterMode === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={handleCustomPresetClick}
            data-testid="link-custom-preset"
          >
            Custom Preset Tasks
          </Button>
          <Button
            variant={location === '/tasks' && state.currentFilterMode !== 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={handleOSPresetClick}
            data-testid="link-os-preset"
          >
            OS Preset Tasks
          </Button>
          <Link href="/statistics">
            <Button
              variant={location === '/statistics' ? 'default' : 'outline'}
              size="sm"
              data-testid="link-results"
            >
              Results
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <Switch>
        <Route path="/" component={Questionnaire} />
        <Route path="/cone-test" component={ConeTest} />
        <Route path="/cvd-results" component={CVDResults} />
        <Route path="/cvd-mismatch" component={CVDMismatch} />
        <Route path="/tasks" component={TaskGames} />
        <Route path="/statistics" component={Statistics} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Router />
        </AppProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
