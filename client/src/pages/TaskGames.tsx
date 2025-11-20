import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { applyAdvancedColorblindFilter, applyOSPresetFilter, applyHybridFilter } from '../utils/filters';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/color';
import { TaskPerformance } from '../../../shared/schema';

type GameState = 'tile-game' | 'color-match' | 'card-match' | 'complete';

export default function TaskGames() {
  const { state, setState, addTaskPerformance, setFilterMode } = useApp();
  const [, setLocation] = useLocation();
  const { advancedFilterParams, selectedOSPreset, currentFilterMode, customPhaseColors, presetPhaseColors } = state;
  
  // Get colors for current phase
  const phaseColors = currentFilterMode === 'custom' ? customPhaseColors : presetPhaseColors;

  const [currentGame, setCurrentGame] = useState<GameState>('tile-game');
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [swipes, setSwipes] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [, forceUpdate] = useState(0);

  // Update timer display every 100ms while game is active
  useEffect(() => {
    if (!isGameActive) return;
    
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isGameActive]);

  // Apply filter to color based on current mode
  const applyFilter = (color: string): string => {
    // For normal vision users, don't apply any filters
    const isNormalVision = state.coneTestResult?.detectedType === 'normal';
    
    if (isNormalVision) {
      return color; // No filter for normal vision
    }
    
    // If using custom filter mode
    if (currentFilterMode === 'custom') {
      // Check if we should use hybrid filter (mismatch scenario after retest)
      if (state.useHybridFilter && state.questionnaire && state.coneTestResult) {
        // Map questionnaire type to our internal format
        const getQuestionnaireType = () => {
          switch (state.questionnaire?.cvdType) {
            case 'protanopia': return 'protan';
            case 'deuteranopia': return 'deutan';
            case 'tritanopia': return 'tritan';
            default: return null;
          }
        };
        
        const indicatedType = getQuestionnaireType();
        
        if (indicatedType) {
          // Use hybrid filter: OS preset for indicated type + CCT severity
          const cctScores = {
            protan: state.coneTestResult.L.score,
            deutan: state.coneTestResult.M.score,
            tritan: state.coneTestResult.S.score,
          };
          return applyHybridFilter(color, indicatedType, cctScores);
        }
      }
      
      // Normal custom filter
      if (advancedFilterParams) {
        return applyAdvancedColorblindFilter(color, advancedFilterParams);
      }
    } else {
      // OS preset filter
      return applyOSPresetFilter(color, currentFilterMode);
    }
    
    return color; // No filter if no params available
  };

  const handleGameStart = () => {
    setIsGameActive(true);
    // Reset timer for each game
    setStartTime(Date.now());
    setClicks(0);
    setSwipes(0);
  };

  const handleGameComplete = (result: boolean | { correct: boolean; accuracy: number }) => {
    const timeMs = Date.now() - startTime;
    
    // Support both boolean and object result formats
    const correct = typeof result === 'boolean' ? result : result.correct;
    const accuracy = typeof result === 'boolean' 
      ? (result ? 1 : 0) 
      : result.accuracy;
    
    const performance: TaskPerformance = {
      taskId: currentGame,
      filterType: currentFilterMode,
      timeMs,
      swipes,
      clicks,
      correct,
      accuracy,
      timestamp: new Date().toISOString(),
    };
    console.log('[TaskGames] Saving task performance:', { taskId: currentGame, filterType: currentFilterMode, timeMs, accuracy });
    addTaskPerformance(performance);
    setIsGameActive(false);

    // Move to next game
    if (currentGame === 'tile-game') {
      setCurrentGame('color-match');
    } else if (currentGame === 'color-match') {
      setCurrentGame('card-match');
    } else if (currentGame === 'card-match') {
      setCurrentGame('complete');
    }
  };

  const incrementClick = () => setClicks(c => c + 1);
  const incrementSwipe = () => setSwipes(s => s + 1);

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhaseComplete = () => {
    if (isProcessing) return; // Prevent double-click
    
    if (currentFilterMode === 'custom' && !state.hasCompletedCustomTasks) {
      // Completed custom filter tasks, switch to OS preset and reset gameplay
      setIsProcessing(true);
      setIsTransitioning(true);
      setState(s => ({ 
        ...s, 
        hasCompletedCustomTasks: true
      }));
      // Use setFilterMode to trigger preset color regeneration
      setFilterMode(selectedOSPreset);
      // Reset game state for OS preset phase
      setTimeout(() => {
        setCurrentGame('tile-game');
        setIsGameActive(false);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 100);
    } else {
      // Completed both custom and OS preset tasks, go to statistics
      setIsProcessing(true);
      setLocation('/statistics');
    }
  };

  if (currentGame === 'complete' && !isTransitioning) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Phase Complete!</h2>
        <p>All games finished with {currentFilterMode} filter.</p>
        <p className="small">
          {currentFilterMode === 'custom' && !state.hasCompletedCustomTasks
            ? `Next: You'll repeat the same tasks with ${selectedOSPreset} filter for comparison.`
            : 'Proceeding to statistics...'}
        </p>
        <div className="space"></div>
        <button className="btn" onClick={handlePhaseComplete} data-testid="button-continue">
          {currentFilterMode === 'custom' && !state.hasCompletedCustomTasks
            ? 'Start OS Preset Tasks'
            : 'View Statistics'}
        </button>
      </div>
    );
  }
  
  if (isTransitioning) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Switching to {selectedOSPreset} Filter...</h2>
        <p>Preparing tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {isGameActive && (
          <div className="flex" style={{ marginBottom: 24, padding: '12px 16px', background: '#f5f5f5', borderRadius: 10, border: '1px solid #e0e0e0' }}>
            <div className="badge" data-testid="badge-time">
              Time: {((Date.now() - startTime) / 1000).toFixed(1)}s
            </div>
            <div className="badge" data-testid="badge-clicks">
              Clicks: {clicks}
            </div>
            <div className="badge" data-testid="badge-swipes">
              Swipes: {swipes}
            </div>
          </div>
        )}

        <div className="game-container">
          {currentGame === 'tile-game' && (
            <TileGame
              key={`tile-${currentFilterMode}`}
              isActive={isGameActive}
              onStart={handleGameStart}
              onComplete={handleGameComplete}
              onClick={incrementClick}
              applyFilter={applyFilter}
              colorPool={phaseColors.tileColors}
            />
          )}

          {currentGame === 'color-match' && (
            <ColorScrollMatcher
              key={`color-${currentFilterMode}`}
              isActive={isGameActive}
              onStart={handleGameStart}
              onComplete={handleGameComplete}
              onClick={incrementClick}
              onSwipe={incrementSwipe}
              applyFilter={applyFilter}
              targetColor={phaseColors.colorMatchTarget}
            />
          )}

          {currentGame === 'card-match' && (
            <CardMatchingGame
              key={`card-${currentFilterMode}`}
              isActive={isGameActive}
              onStart={handleGameStart}
              onComplete={handleGameComplete}
              onClick={incrementClick}
              applyFilter={applyFilter}
              cardColors={phaseColors.cardColors}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Game 1: Tile Game (3 rounds)
function TileGame({
  isActive,
  onStart,
  onComplete,
  onClick,
  applyFilter,
  colorPool,
}: {
  isActive: boolean;
  onStart: () => void;
  onComplete: (result: boolean | { correct: boolean; accuracy: number }) => void;
  onClick: () => void;
  applyFilter: (color: string) => string;
  colorPool: string[];
}) {
  const MIN_ROUNDS = 3;
  const tiles = 16; // 4x4 grid
  const [round, setRound] = useState(0);
  const [oddIndex, setOddIndex] = useState(Math.floor(Math.random() * tiles));
  const [baseColor, setBaseColor] = useState(colorPool[0]);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const generateNewRound = () => {
    // Generate a completely new random color for each round
    const randomHue = Math.floor(Math.random() * 360);
    const randomSat = 60 + Math.random() * 30; // 60-90%
    const randomLight = 40 + Math.random() * 20; // 40-60%
    const { r, g, b } = hslToRgb(randomHue, randomSat, randomLight);
    const newColor = rgbToHex(r, g, b);
    setBaseColor(newColor);
    setOddIndex(Math.floor(Math.random() * tiles));
  };

  // Reset to round 0 and generate new colors when game becomes active
  useEffect(() => {
    if (isActive) {
      setRound(0);
      setCorrectAnswers(0);
      generateNewRound();
    }
  }, [isActive]);

  const { r, g, b } = hexToRgb(baseColor);
  const { h, s, l } = rgbToHsl(r, g, b);
  // Use a much larger hue shift (60-90°) and boost saturation/lightness for OS preset visibility
  const hueShift = 75; // Large enough to be distinct even after colorblind filters
  const newH = (h + hueShift) % 360;
  const newS = Math.min(100, s * 1.15); // Boost saturation by 15%
  const newL = Math.min(100, Math.max(0, l + (l < 50 ? 10 : -10))); // Adjust lightness
  const diffColor = hslToRgb(newH, newS, newL);
  const oddColor = rgbToHex(diffColor.r, diffColor.g, diffColor.b);

  const handleTileClick = (index: number) => {
    if (!isActive) return;
    onClick();
    const correct = index === oddIndex;
    
    // Track correct answers
    const newCorrectCount = correct ? correctAnswers + 1 : correctAnswers;
    setCorrectAnswers(newCorrectCount);
    
    // Increment round counter
    const nextRound = round + 1;
    setRound(nextRound);
    
    // Check if we've completed all rounds
    if (nextRound >= MIN_ROUNDS) {
      // Completed all 3 rounds - calculate accuracy as ratio
      const accuracyRatio = newCorrectCount / MIN_ROUNDS;
      // Pass both correct status and actual accuracy ratio
      onComplete({ 
        correct: accuracyRatio >= 0.5, 
        accuracy: accuracyRatio 
      });
    } else {
      // Generate new round for next attempt
      generateNewRound();
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h3 style={{ marginBottom: 12, fontSize: 22, fontWeight: 700 }}>Game 1: Find the Different Tile</h3>
        <p className="small" style={{ fontSize: 14, color: '#64748b' }}>
          Click on the tile that has a slightly different color. ({MIN_ROUNDS} rounds)
        </p>
      </div>

      {!isActive ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <button 
            className="btn-start-game" 
            onClick={onStart} 
            data-testid="button-start-tile-game"
          >
            Start Game 1
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <span className="small">Round {round + 1} of {MIN_ROUNDS}</span>
            {round > 0 && (
              <span className="small" style={{ marginLeft: 16 }}>
                Accuracy: {correctAnswers}/{round} ({Math.round((correctAnswers / round) * 100)}%)
              </span>
            )}
          </div>
          <div className="grid4">
            {Array.from({ length: tiles }).map((_, i) => (
              <button
                key={i}
                className="tile"
                style={{
                  background: applyFilter(i === oddIndex ? oddColor : baseColor),
                  cursor: 'pointer',
                  border: 'none',
                }}
                onClick={() => handleTileClick(i)}
                data-testid={`tile-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Game 2: Color Scroll Matcher
function ColorScrollMatcher({
  isActive,
  onStart,
  onComplete,
  onClick,
  onSwipe,
  applyFilter,
  targetColor,
}: {
  isActive: boolean;
  onStart: () => void;
  onComplete: (result: boolean | { correct: boolean; accuracy: number }) => void;
  onClick: () => void;
  onSwipe: () => void;
  applyFilter: (color: string) => string;
  targetColor: string;
}) {
  const numColors = 20;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate initial colors
  const generateColors = () => {
    const newTargetIndex = Math.floor(Math.random() * numColors);
    const cols = Array.from({ length: numColors }, (_, i) => {
      if (i === newTargetIndex) return targetColor;

      const h = Math.floor(Math.random() * 360);
      // convert HSL → RGB → HEX using your utilities
      const { r, g, b } = hslToRgb(h, 70, 50);
      return rgbToHex(r, g, b);
    });

    return { colors: cols, targetIndex: newTargetIndex };
  };

  const [gameState, setGameState] = useState(() => generateColors());

  // Regenerate colors when game becomes active
  useEffect(() => {
    if (isActive) {
      setGameState(generateColors());
    }
  }, [isActive]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isActive) return;

    const handleScroll = () => {
      onSwipe();
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isActive, onSwipe]);

  const handleColorClick = (index: number) => {
    if (!isActive) return;
    onClick();
    const correct = index === gameState.targetIndex;
    // Pass accuracy as 1 or 0 for single-attempt game
    onComplete({ 
      correct, 
      accuracy: correct ? 1 : 0 
    });
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h3 style={{ marginBottom: 12, fontSize: 22, fontWeight: 700 }}>Game 2: Color Match Scroller</h3>
        <p className="small" style={{ fontSize: 14, color: '#64748b' }}>
          Find and click the color that matches the target below.
        </p>
      </div>

      {!isActive ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 16,
                background: applyFilter(targetColor),
                border: '3px solid #333',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
              data-testid="target-color"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 32px' }}>
            <button 
              className="btn-start-game" 
              onClick={onStart} 
              data-testid="button-start-color-match"
            >
              Start Game 2
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              width: 80,
              height: 80,
              background: applyFilter(targetColor),
              borderRadius: 12,
              margin: '0 auto 16px',
              border: '3px solid #333',
            }}
            data-testid="target-color-active"
          />
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 12,
            }}
            data-testid="color-scroller">
            {gameState.colors.map((color, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => handleColorClick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleColorClick(i);
                  }
                }}
                style={{
                  minWidth: 80,
                  height: 80,
                  background: applyFilter(color),
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: '2px solid #ddd',
                }}
                data-testid={`color-option-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Game 3: Card Matching
function CardMatchingGame({
  isActive,
  onStart,
  onComplete,
  onClick,
  applyFilter,
  cardColors,
}: {
  isActive: boolean;
  onStart: () => void;
  onComplete: (result: boolean | { correct: boolean; accuracy: number }) => void;
  onClick: () => void;
  applyFilter: (color: string) => string;
  cardColors: string[];
}) {
  const [cards, setCards] = useState<string[]>([]);

  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  // Use refs to track actual values for completion calculation
  const correctMatchesRef = useRef(0);
  const totalAttemptsRef = useRef(0);

  // Generate and shuffle cards when game becomes active
  useEffect(() => {
    if (isActive && cards.length === 0) {
      const pairs = [...cardColors, ...cardColors];
      setCards(pairs.sort(() => Math.random() - 0.5));
      setSelected([]);
      setMatched([]);
      setIsChecking(false);
      setCorrectMatches(0);
      setTotalAttempts(0);
      correctMatchesRef.current = 0;
      totalAttemptsRef.current = 0;
    }
  }, [isActive, cards.length, cardColors]);

  // Reset cards when game becomes inactive
  useEffect(() => {
    if (!isActive && cards.length > 0) {
      setCards([]);
    }
  }, [isActive, cards.length]);

  const handleCardClick = (index: number) => {
    // Don't allow clicks if: not active, card already matched, or currently checking
    if (!isActive || matched.includes(index) || isChecking) return;
    
    // Don't select the same card twice
    if (selected.includes(index)) return;
    
    onClick();

    const newSelected = [...selected, index];
    setSelected(newSelected);

    // Check if we have two cards selected
    if (newSelected.length === 2) {
      setIsChecking(true);
      const [first, second] = newSelected;
      
      if (cards[first] === cards[second]) {
        // Match found - increment both correct and total
        const totalCards = cards.length;
        
        // Increment refs immediately for accurate tracking
        correctMatchesRef.current += 1;
        totalAttemptsRef.current += 1;
        
        setTimeout(() => {
          // Update states for display
          setCorrectMatches(correctMatchesRef.current);
          setTotalAttempts(totalAttemptsRef.current);
          
          setMatched(prevMatched => {
            const newMatched = [...prevMatched, first, second];
            
            // Check if all cards are matched
            if (newMatched.length === totalCards) {
              // Game complete! Use ref values for accurate calculation
              const finalCorrect = correctMatchesRef.current;
              const finalAttempts = totalAttemptsRef.current;
              const accuracyRatio = finalAttempts > 0 ? finalCorrect / finalAttempts : 0;
              
              console.log('[Card Matching] Game complete!', {
                totalCards,
                newMatchedLength: newMatched.length,
                finalCorrect,
                finalAttempts,
                accuracyRatio
              });
              
              // Call onComplete after a small delay to ensure state updates
              setTimeout(() => {
                console.log('[Card Matching] Calling onComplete with', {
                  correct: accuracyRatio >= 0.5,
                  accuracy: accuracyRatio
                });
                onComplete({ 
                  correct: accuracyRatio >= 0.5, 
                  accuracy: accuracyRatio 
                });
              }, 100);
            }
            
            return newMatched;
          });
          
          setSelected([]);
          setIsChecking(false);
        }, 600);
      } else {
        // No match - just increment attempts
        totalAttemptsRef.current += 1;
        
        setTimeout(() => {
          setTotalAttempts(totalAttemptsRef.current);
          setSelected([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h3 style={{ marginBottom: 12, fontSize: 22, fontWeight: 700 }}>Game 3: Card Matching</h3>
        <p className="small" style={{ fontSize: 14, color: '#64748b' }}>
          Click two cards to find matching color pairs. Matched cards will disappear.
        </p>
      </div>

      {!isActive ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <button 
            className="btn-start-game" 
            onClick={onStart} 
            data-testid="button-start-card-match"
          >
            Start Game 3
          </button>
        </div>
      ) : (
        <>
          {totalAttempts > 0 && (
            <div style={{ marginBottom: 12, textAlign: 'center' }}>
              <span className="small">
                Accuracy: {correctMatches}/{totalAttempts} ({Math.round((correctMatches / totalAttempts) * 100)}%)
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            {cards.map((color, i) => {
              const isMatched = matched.includes(i);
              const isSelected = selected.includes(i);
              
              return (
                <div
                  key={i}
                  onClick={() => handleCardClick(i)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 12,
                    cursor: isMatched ? 'default' : 'pointer',
                    background: applyFilter(color),
                    border: isSelected ? '4px solid #000' : '2px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    transition: 'all 0.3s',
                    opacity: isMatched ? 0 : 1,
                    visibility: isMatched ? 'hidden' : 'visible',
                    transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                  }}
                  data-testid={`card-${i}`}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
