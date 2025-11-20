/**
 * PROPER TEST - Imports the actual deployed function
 */

import { getRecommendedFilter } from './client/src/utils/filters';

interface TestCase {
  id: number;
  name: string;
  userType: 'protan' | 'deutan' | 'tritan' | undefined;
  scores: { protan: number; deutan: number; tritan: number };
  expectedType: string;
  notes?: string;
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: 'User says deutan, test shows high protan',
    userType: 'deutan',
    scores: { protan: 30, deutan: 5, tritan: 2 },
    expectedType: 'deutan',
    notes: 'Should use deutan type with deutan severity (5/40 = 12.5%)',
  },
  {
    id: 2,
    name: 'User says protan, test shows high deutan',
    userType: 'protan',
    scores: { protan: 8, deutan: 28, tritan: 4 },
    expectedType: 'protan',
    notes: 'Should use protan type with protan severity (8/40 = 20%)',
  },
  {
    id: 3,
    name: 'No user type, test shows clear protan',
    userType: undefined,
    scores: { protan: 32, deutan: 6, tritan: 4 },
    expectedType: 'protan',
    notes: 'Should pick highest (protan at 32/40 = 80%)',
  },
];

console.log('Testing ACTUAL deployed function from filters.ts\n');
console.log('═'.repeat(70));

testCases.forEach(tc => {
  const result = getRecommendedFilter(tc.userType, tc.scores);
  const passed = result.type === tc.expectedType;
  
  console.log(`\nTest ${tc.id}: ${tc.name}`);
  console.log(`Input: userType=${tc.userType}, scores=`, tc.scores);
  console.log(`Expected: ${tc.expectedType}`);
  console.log(`Got: ${result.type} at ${(result.severity * 100).toFixed(1)}% severity`);
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (tc.notes) console.log(`Notes: ${tc.notes}`);
  console.log('─'.repeat(70));
});
