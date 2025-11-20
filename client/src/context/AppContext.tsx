import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Questionnaire, ConeTestResult, RGBAdjustment, AdvancedFilterParams, TaskPerformance, OSPresetFilter } from '../../../shared/schema';
import { apiRequest } from '../lib/queryClient';
import { createFilterFromConeTest } from '../lib/advancedFilter';
import { hslToRgb, rgbToHex } from '../utils/color';

interface PhaseColors {
  tileColors: string[]; // Pool of colors for tile game
  colorMatchTarget: string; // Target color for color matcher
  cardColors: string[]; // Colors for card matching (6 unique colors)
}

interface AppState {
  // Current session ID
  sessionId: string | null;
  
  // Questionnaire data
  questionnaire: Questionnaire | null;
  
  // Cone test results
  coneTestResult: ConeTestResult | null;
  
  // Advanced filter parameters (automatically generated from cone test)
  advancedFilterParams: AdvancedFilterParams | null;
  
  // RGB adjustments (deprecated, kept for backwards compatibility)
  rgbAdjustment: RGBAdjustment;
  
  // Task performances
  taskPerformances: TaskPerformance[];
  
  // Current selected OS preset for comparison
  selectedOSPreset: OSPresetFilter;
  
  // Mismatch tracking fields
  previousConeTestResult: ConeTestResult | null;
  retestRequested: boolean;
  useHybridFilter: boolean;
  
  // Which filter mode is currently active (for task page)
  currentFilterMode: 'custom' | OSPresetFilter;
  
  // Has completed custom filter tasks
  hasCompletedCustomTasks: boolean;
  
  // Phase-specific randomized colors (different for custom vs preset)
  customPhaseColors: PhaseColors;
  presetPhaseColors: PhaseColors;
  
  // Navigation state
  currentStep: number; // 0: questionnaire, 1: cone test, 2: adjustment, 3: tasks-custom, 4: tasks-preset, 5: stats
}

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  updateQuestionnaire: (q: Questionnaire) => void;
  updateConeTestResult: (result: ConeTestResult) => void;
  updateRGBAdjustment: (adjustment: RGBAdjustment) => void;
  addTaskPerformance: (performance: TaskPerformance) => void;
  setSelectedOSPreset: (preset: OSPresetFilter) => void;
  setFilterMode: (mode: 'custom' | OSPresetFilter) => void;
  nextStep: () => void;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Generate random colors for a phase (exported for use in components)
export function generatePhaseColors(): PhaseColors {
  // Generate 6 random tile colors (highly diverse hues, saturation, and lightness)
  const tileColors = Array.from({ length: 6 }, () => {
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.random() * 55; // 40-95% saturation (wider range)
    const l = 35 + Math.random() * 30; // 35-65% lightness (wider range)
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  });

  // Generate random target color for color matcher (more variation)
  const targetHue = Math.floor(Math.random() * 360);
  const targetSat = 50 + Math.random() * 40; // 50-90% saturation
  const targetLight = 40 + Math.random() * 25; // 40-65% lightness
  const { r: tr, g: tg, b: tb } = hslToRgb(targetHue, targetSat, targetLight);
  const colorMatchTarget = rgbToHex(tr, tg, tb);

  // Generate 6 unique card colors (completely random distribution)
  const cardColors = Array.from({ length: 6 }, () => {
    const h = Math.floor(Math.random() * 360); // Fully random hues
    const s = 50 + Math.random() * 45; // 50-95% saturation
    const l = 38 + Math.random() * 27; // 38-65% lightness
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  });

  return { tileColors, colorMatchTarget, cardColors };
}

const defaultState: AppState = {
  sessionId: null,
  questionnaire: null,
  coneTestResult: null,
  advancedFilterParams: null,
  rgbAdjustment: {
    redHue: 0,
    greenHue: 120,
    blueHue: 240,
  },
  taskPerformances: [],
  selectedOSPreset: 'protanopia',
  previousConeTestResult: null,
  retestRequested: false,
  useHybridFilter: false,
  currentFilterMode: 'custom',
  hasCompletedCustomTasks: false,
  customPhaseColors: generatePhaseColors(),
  presetPhaseColors: generatePhaseColors(),
  currentStep: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('cvd-aui-state');
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('cvd-aui-state', JSON.stringify(state));
  }, [state]);

  const updateQuestionnaire = async (q: Questionnaire) => {
    try {
      // Clear localStorage before creating new session to prevent contamination
      localStorage.removeItem('cvd-aui-state');
      
      // Create new session with questionnaire data
      const response = await apiRequest('POST', '/api/sessions', q);
      const data = await response.json();
      const newSessionId = data.sessionId;
      
      // Reset all session-scoped state for new session
      const freshState = { 
        ...defaultState,
        questionnaire: q,
        sessionId: newSessionId,
        currentStep: 0
      };
      setState(freshState);
      // Persist clean state immediately
      localStorage.setItem('cvd-aui-state', JSON.stringify(freshState));
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
      // Clear localStorage and reset to defaults even if API fails
      localStorage.removeItem('cvd-aui-state');
      setState({ 
        ...defaultState,
        questionnaire: q 
      });
    }
  };

  const updateConeTestResult = async (result: ConeTestResult) => {
    const selectedPreset =
      result.detectedType === 'protan'
        ? 'protanopia'
        : result.detectedType === 'deutan'
        ? 'deuteranopia'
        : result.detectedType === 'tritan'
        ? 'tritanopia'
        : 'grayscale';

    // Automatically generate advanced filter parameters from cone test results
    const advancedFilterParams = createFilterFromConeTest(result);

    // Capture current sessionId before setState
    const currentSessionId = state.sessionId;

    setState(s => ({
      ...s,
      coneTestResult: result,
      advancedFilterParams,
      selectedOSPreset: selectedPreset,
    }));

    // Save to backend using captured sessionId
    if (currentSessionId) {
      try {
        await apiRequest('POST', `/api/sessions/${currentSessionId}/cone-test`, result);
        // Also save the advanced filter params
        await apiRequest('POST', `/api/sessions/${currentSessionId}/advanced-filter`, advancedFilterParams);
      } catch (error) {
        console.error('Failed to save cone test result:', error);
      }
    }
  };

  const updateRGBAdjustment = async (adjustment: RGBAdjustment) => {
    // Capture current sessionId before setState
    const currentSessionId = state.sessionId;

    setState(s => ({ ...s, rgbAdjustment: adjustment }));

    // Save to backend using captured sessionId
    if (currentSessionId) {
      try {
        await apiRequest('POST', `/api/sessions/${currentSessionId}/rgb-adjustment`, adjustment);
      } catch (error) {
        console.error('Failed to save RGB adjustment:', error);
      }
    }
  };

  const addTaskPerformance = async (performance: TaskPerformance) => {
    // Capture current sessionId before setState
    const currentSessionId = state.sessionId;

    setState(s => ({
      ...s,
      taskPerformances: [...s.taskPerformances, performance],
    }));

    // Save to backend using captured sessionId
    if (currentSessionId) {
      try {
        await apiRequest('POST', `/api/sessions/${currentSessionId}/tasks`, performance);
      } catch (error) {
        console.error('Failed to save task performance:', error);
      }
    }
  };

  const setSelectedOSPreset = (preset: OSPresetFilter) => {
    setState(s => ({ ...s, selectedOSPreset: preset }));
  };

  const setFilterMode = (mode: 'custom' | OSPresetFilter) => {
    setState(s => {
      // Regenerate colors when switching to OS preset phase
      if (mode !== 'custom' && s.currentFilterMode === 'custom') {
        return {
          ...s,
          currentFilterMode: mode,
          presetPhaseColors: generatePhaseColors(), // Fresh colors for preset phase
        };
      }
      return { ...s, currentFilterMode: mode };
    });
  };

  const nextStep = () => {
    setState(s => ({ ...s, currentStep: s.currentStep + 1 }));
  };

  const resetSession = () => {
    setState(defaultState);
    localStorage.removeItem('cvd-aui-state');
  };

  const value = useMemo(
    () => ({
      state,
      setState,
      updateQuestionnaire,
      updateConeTestResult,
      updateRGBAdjustment,
      addTaskPerformance,
      setSelectedOSPreset,
      setFilterMode,
      nextStep,
      resetSession,
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
