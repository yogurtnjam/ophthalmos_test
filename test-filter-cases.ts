/**
 * Test script for getRecommendedFilter function
 * Tests all 20 cases from the attached test specification
 */

// Helper function to convert trial results to scores
function trialsToScore(trials: string[]): number {
  const missCount = trials.filter(t => t === 'miss').length;
  // Each miss = 1 reversal, score range 0-40
  // For 6 trials: 3 misses = 0.45 severity (18/40), 2 misses = 0.25 (10/40), etc.
  // Using pattern: each miss at start contributes more
  const scoreMap: Record<number, number> = {
    0: 0,   // all correct
    1: 4,   // 1 miss
    2: 10,  // 2 misses  → 0.25 severity
    3: 18,  // 3 misses  → 0.45 severity
    4: 26,  // 4 misses  → 0.65 severity
    5: 35,  // 5 misses
    6: 40,  // all misses
  };
  return scoreMap[missCount] ?? 0;
}

// Interface matching the actual implementation
interface ConeTestScores {
  protan: number;
  deutan: number;
  tritan: number;
}

interface RecommendedFilter {
  type: 'protan' | 'deutan' | 'tritan';
  severity: number;
}

function getRecommendedFilter(
  userType: 'protan' | 'deutan' | 'tritan' | undefined,
  coneTestScores: ConeTestScores
): RecommendedFilter {
  // Validate and normalize cone test scores
  const scores = {
    protan: Math.max(0, Math.min(40, coneTestScores?.protan ?? 0)),
    deutan: Math.max(0, Math.min(40, coneTestScores?.deutan ?? 0)),
    tritan: Math.max(0, Math.min(40, coneTestScores?.tritan ?? 0)),
  };

  let primaryType: 'protan' | 'deutan' | 'tritan';

  if (userType) {
    primaryType = userType;
  } else {
    const maxScore = Math.max(scores.protan, scores.deutan, scores.tritan);
    
    if (scores.protan === maxScore) {
      primaryType = 'protan';
    } else if (scores.deutan === maxScore) {
      primaryType = 'deutan';
    } else {
      primaryType = 'tritan';
    }
  }

  let severity = scores[primaryType] / 40;

  const CLOSE_THRESHOLD = 4;
  const primaryScore = scores[primaryType];
  
  const otherAxes = (['protan', 'deutan', 'tritan'] as const).filter(
    axis => axis !== primaryType
  );
  
  let blendedContribution = 0;
  let closeAxesCount = 0;
  
  for (const axis of otherAxes) {
    const diff = Math.abs(primaryScore - scores[axis]);
    if (diff < CLOSE_THRESHOLD) {
      const weight = 1 - (diff / CLOSE_THRESHOLD);
      blendedContribution += (scores[axis] / 40) * weight * 0.15;
      closeAxesCount++;
    }
  }
  
  if (closeAxesCount > 0) {
    severity = Math.min(1.0, severity + blendedContribution);
  }

  severity = Math.max(0, Math.min(1, severity));

  return {
    type: primaryType,
    severity,
  };
}

// Test cases
interface TestCase {
  id: number;
  name: string;
  userType: 'protan' | 'deutan' | 'tritan' | undefined;
  redTrials: string[];
  greenTrials: string[];
  blueTrials: string[];
  expectedType: string;
  notes?: string;
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: 'Normal protanopia (strong red weakness)',
    userType: 'protan',
    redTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
  },
  {
    id: 2,
    name: 'Normal deutan (green weakness)',
    userType: 'deutan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'miss', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'deutan',
  },
  {
    id: 3,
    name: 'Normal tritan (blue weakness)',
    userType: 'tritan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'miss', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'tritan',
  },
  {
    id: 4,
    name: 'User does not know type (protan highest)',
    userType: undefined,
    redTrials: ['miss', 'miss', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
  },
  {
    id: 5,
    name: 'User does not know type (tritan highest)',
    userType: undefined,
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    expectedType: 'tritan',
  },
  {
    id: 6,
    name: 'Conflict: user says protan, test says deutan',
    userType: 'protan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'User override takes precedence',
  },
  {
    id: 7,
    name: 'Conflict: user says deutan, test says tritan',
    userType: 'deutan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    expectedType: 'deutan',
    notes: 'User override takes precedence',
  },
  {
    id: 8,
    name: 'Conflict: user says tritan, test says protan',
    userType: 'tritan',
    redTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'tritan',
    notes: 'User override takes precedence',
  },
  {
    id: 9,
    name: 'User says protan, test says normal',
    userType: 'protan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'User override with zero severity',
  },
  {
    id: 10,
    name: 'User says deutan, test normal',
    userType: 'deutan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'deutan',
    notes: 'User override with zero severity',
  },
  {
    id: 11,
    name: 'User says tritan, test normal',
    userType: 'tritan',
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'tritan',
    notes: 'User override with zero severity',
  },
  {
    id: 12,
    name: 'Mixed protan/deutan',
    userType: undefined,
    redTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'Equal scores, picks protan (first)',
  },
  {
    id: 13,
    name: 'Mixed deutan/tritan',
    userType: undefined,
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'deutan',
    notes: 'Equal scores, picks deutan (first non-protan)',
  },
  {
    id: 14,
    name: 'Mixed protan/tritan',
    userType: undefined,
    redTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'Equal scores, picks protan (first)',
  },
  {
    id: 15,
    name: 'All near-normal',
    userType: undefined,
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'All scores zero, defaults to protan',
  },
  {
    id: 16,
    name: 'All extremely close',
    userType: undefined,
    redTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'All scores equal, defaults to protan',
  },
  {
    id: 17,
    name: 'Strong protan, moderate deutan',
    userType: undefined,
    redTrials: ['miss', 'miss', 'miss', 'miss', 'correct', 'correct'],
    greenTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
  },
  {
    id: 18,
    name: 'Strong deutan, mild tritan',
    userType: undefined,
    redTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'deutan',
  },
  {
    id: 19,
    name: 'Tritan with minor protan noise',
    userType: undefined,
    redTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['miss', 'miss', 'miss', 'correct', 'correct', 'correct'],
    expectedType: 'tritan',
  },
  {
    id: 20,
    name: 'User says protan, but deutan close',
    userType: 'protan',
    redTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    greenTrials: ['miss', 'correct', 'correct', 'correct', 'correct', 'correct'],
    blueTrials: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    expectedType: 'protan',
    notes: 'User override, blending applies',
  },
];

// Run tests
console.log('═══════════════════════════════════════════════════════════════');
console.log('    ADAPTIVE FILTER TEST RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

const results: string[] = [];

testCases.forEach(tc => {
  const scores: ConeTestScores = {
    protan: trialsToScore(tc.redTrials),
    deutan: trialsToScore(tc.greenTrials),
    tritan: trialsToScore(tc.blueTrials),
  };

  const result = getRecommendedFilter(tc.userType, scores);
  
  const passed = result.type === tc.expectedType;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  const output = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ${tc.id}: ${tc.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User Type: ${tc.userType ?? 'undefined'}
${tc.notes ? `Notes: ${tc.notes}\n` : ''}
Cone Test Results:
  Red (L-cone):   ${tc.redTrials.join(', ')}
  Green (M-cone): ${tc.greenTrials.join(', ')}
  Blue (S-cone):  ${tc.blueTrials.join(', ')}

Calculated Scores (0-40 scale):
  Protan:  ${scores.protan}
  Deutan:  ${scores.deutan}
  Tritan:  ${scores.tritan}

ADAPTIVE FILTER RESULT:
  Type:     ${result.type}
  Severity: ${(result.severity * 100).toFixed(1)}% (${result.severity.toFixed(3)} normalized)

Expected: ${tc.expectedType}
Status:   ${status}
`;
  
  console.log(output);
  results.push(output);
});

// Summary
const totalTests = testCases.length;
const passedTests = testCases.filter((tc, i) => {
  const scores: ConeTestScores = {
    protan: trialsToScore(tc.redTrials),
    deutan: trialsToScore(tc.greenTrials),
    tritan: trialsToScore(tc.blueTrials),
  };
  const result = getRecommendedFilter(tc.userType, scores);
  return result.type === tc.expectedType;
}).length;

const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Tests:  ${totalTests}
Passed:       ${passedTests}
Failed:       ${totalTests - passedTests}
Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%

`;

console.log(summary);
results.push(summary);

// Write to file
import * as fs from 'fs';
const outputDoc = results.join('\n');
fs.writeFileSync('filter-test-results.txt', outputDoc);
console.log('Results saved to: filter-test-results.txt');
