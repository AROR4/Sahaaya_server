#!/usr/bin/env node

/**
 * Regression Test Runner
 * 
 * This script runs regression tests and saves results for comparison.
 * Use this before and after adding new features to ensure nothing breaks.
 * 
 * Usage:
 *   node scripts/runRegressionTests.js [--save-baseline] [--compare]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../test-results');
const BASELINE_FILE = path.join(RESULTS_DIR, 'baseline-results.json');
const CURRENT_RESULTS_FILE = path.join(RESULTS_DIR, 'current-results.json');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const saveBaseline = args.includes('--save-baseline');
const compare = args.includes('--compare');

/**
 * Run Jest tests and capture output
 */
function runTests() {
  console.log('🧪 Running regression tests...\n');
  
  try {
    const output = execSync('npm test -- --testPathPatterns=regression.test.js --json', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    // Extract JSON from output (npm may add extra output)
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in output');
  } catch (error) {
    // Jest returns non-zero exit code even when tests pass, so we need to parse the output
    try {
      const output = error.stdout || error.stderr || error.message || '';
      // Try to extract JSON from stdout, stderr, or message
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If no JSON found, try running jest directly
      console.log('⚠️  Could not parse npm output, trying jest directly...\n');
      const jestOutput = execSync('npx jest --runInBand --testPathPatterns=regression.test.js --json', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      const jestJsonMatch = jestOutput.match(/\{[\s\S]*\}/);
      if (jestJsonMatch) {
        return JSON.parse(jestJsonMatch[0]);
      }
      throw error;
    } catch (parseError) {
      console.error('❌ Failed to parse test results:', parseError.message);
      console.error('Raw output:', error.stdout || error.stderr || error.message);
      throw error;
    }
  }
}

/**
 * Format test results for saving
 */
function formatResults(jestResults) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      numPassedTests: jestResults.numPassedTests || 0,
      numFailedTests: jestResults.numFailedTests || 0,
      numTotalTests: jestResults.numTotalTests || 0,
      numPassedTestSuites: jestResults.numPassedTestSuites || 0,
      numFailedTestSuites: jestResults.numFailedTestSuites || 0,
      numTotalTestSuites: jestResults.numTotalTestSuites || 0,
      success: jestResults.success || false
    },
    testResults: jestResults.testResults?.map(testResult => ({
      name: testResult.name,
      status: testResult.status,
      message: testResult.message,
      numPassingTests: testResult.numPassingTests,
      numFailingTests: testResult.numFailingTests
    })) || []
  };
}

/**
 * Save results to file
 */
function saveResults(results, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`✅ Results saved to: ${filePath}`);
}

/**
 * Compare baseline with current results
 */
function compareResults() {
  if (!fs.existsSync(BASELINE_FILE)) {
    console.log('⚠️  No baseline results found. Run with --save-baseline first.');
    return false;
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
  const current = JSON.parse(fs.readFileSync(CURRENT_RESULTS_FILE, 'utf-8'));

  console.log('\n📊 COMPARISON RESULTS\n');
  console.log('═'.repeat(60));
  console.log('BASELINE (Before Changes)');
  console.log('─'.repeat(60));
  console.log(`Timestamp: ${baseline.timestamp}`);
  console.log(`Tests Passed: ${baseline.summary.numPassedTests}/${baseline.summary.numTotalTests}`);
  console.log(`Test Suites Passed: ${baseline.summary.numPassedTestSuites}/${baseline.summary.numTotalTestSuites}`);
  console.log(`Status: ${baseline.summary.success ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\nCURRENT (After Changes)');
  console.log('─'.repeat(60));
  console.log(`Timestamp: ${current.timestamp}`);
  console.log(`Tests Passed: ${current.summary.numPassedTests}/${current.summary.numTotalTests}`);
  console.log(`Test Suites Passed: ${current.summary.numPassedTestSuites}/${current.summary.numTotalTestSuites}`);
  console.log(`Status: ${current.summary.success ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\nCOMPARISON');
  console.log('─'.repeat(60));

  const testsChanged = current.summary.numPassedTests !== baseline.summary.numPassedTests;
  const suitesChanged = current.summary.numPassedTestSuites !== baseline.summary.numPassedTestSuites;
  const statusChanged = current.summary.success !== baseline.summary.success;

  if (!testsChanged && !suitesChanged && !statusChanged) {
    console.log('✅ REGRESSION TEST PASSED');
    console.log('   All test results match the baseline. No regressions detected.');
    return true;
  } else {
    console.log('❌ REGRESSION TEST FAILED');
    
    if (statusChanged) {
      console.log(`   Overall status changed: ${baseline.summary.success ? 'PASS' : 'FAIL'} → ${current.summary.success ? 'PASS' : 'FAIL'}`);
    }
    
    if (testsChanged) {
      const diff = current.summary.numPassedTests - baseline.summary.numPassedTests;
      console.log(`   Tests changed: ${baseline.summary.numPassedTests} → ${current.summary.numPassedTests} (${diff > 0 ? '+' : ''}${diff})`);
    }
    
    if (suitesChanged) {
      const diff = current.summary.numPassedTestSuites - baseline.summary.numPassedTestSuites;
      console.log(`   Test suites changed: ${baseline.summary.numPassedTestSuites} → ${current.summary.numPassedTestSuites} (${diff > 0 ? '+' : ''}${diff})`);
    }

    // Show failed tests
    if (current.summary.numFailedTests > 0) {
      console.log('\n❌ Failed Tests:');
      current.testResults.forEach(testResult => {
        if (testResult.numFailingTests > 0) {
          console.log(`   - ${testResult.name}: ${testResult.numFailingTests} failing`);
        }
      });
    }

    return false;
  }
}

/**
 * Print test summary
 */
function printSummary(results) {
  console.log('\n📊 TEST SUMMARY\n');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${results.summary.numTotalTests}`);
  console.log(`Passed: ${results.summary.numPassedTests} ✅`);
  console.log(`Failed: ${results.summary.numFailedTests} ${results.summary.numFailedTests > 0 ? '❌' : ''}`);
  console.log(`Test Suites: ${results.summary.numPassedTestSuites}/${results.summary.numTotalTestSuites} passed`);
  console.log(`Overall Status: ${results.summary.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═'.repeat(60));
}

// Main execution
async function main() {
  console.log('🔴 REGRESSION TEST RUNNER\n');

  // Run tests
  const jestResults = runTests();
  const formattedResults = formatResults(jestResults);

  // Print summary
  printSummary(formattedResults);

  // Save current results
  saveResults(formattedResults, CURRENT_RESULTS_FILE);

  // Save baseline if requested
  if (saveBaseline) {
    saveResults(formattedResults, BASELINE_FILE);
    console.log('\n✅ Baseline results saved. Use this as reference for future comparisons.');
  }

  // Compare if requested
  if (compare) {
    const passed = compareResults();
    process.exit(passed ? 0 : 1);
  } else if (saveBaseline) {
    console.log('\n💡 Tip: After making changes, run: npm run regression:compare');
  } else {
    console.log('\n💡 Tips:');
    console.log('   - Save baseline: npm run regression:baseline');
    console.log('   - Compare results: npm run regression:compare');
  }

  // Exit with appropriate code
  process.exit(formattedResults.summary.success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Error running regression tests:', error);
  process.exit(1);
});

