import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from './context/AppContext';
import Questionnaire from './pages/Questionnaire';
import ConeTest from './pages/ConeTest';
import CVDResults from './pages/CVDResults';
import TaskGames from './pages/TaskGames';
import Statistics from './pages/Statistics';
import './styles.css';

function Router() {
  const { setFilterMode, state } = useApp();
  const [, setLocation] = useLocation();

  const handleCustomPresetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFilterMode('custom');
    setLocation('/tasks');
  };

  const handleOSPresetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFilterMode(state.selectedOSPreset);
    setLocation('/tasks');
  };

  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="brand" data-testid="link-brand">
          OPHTHALMOS
        </Link>
        <nav className="nav">
          <Link to="/" data-testid="link-questionnaire">Questionnaire</Link>
          <Link to="/cone-test" data-testid="link-cone-test">Cone Test</Link>
          <a href="/tasks" onClick={handleCustomPresetClick} data-testid="link-custom-preset">Custom Preset Tasks</a>
          <a href="/tasks" onClick={handleOSPresetClick} data-testid="link-os-preset">OS Preset Tasks</a>
          <Link to="/statistics" data-testid="link-results">Results</Link>
        </nav>
      </header>

      <Switch>
        <Route path="/" component={Questionnaire} />
        <Route path="/cone-test" component={ConeTest} />
        <Route path="/cvd-results" component={CVDResults} />
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
