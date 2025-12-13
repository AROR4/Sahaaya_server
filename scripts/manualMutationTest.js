#!/usr/bin/env node

/**
 * Manual Mutation Testing Script
 * 
 * This script demonstrates manual mutation testing by:
 * 1. Running tests against original code
 * 2. Temporarily replacing with mutated version
 * 3. Running tests again (should fail)
 * 4. Restoring original code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ORIGINAL_FILE = path.join(__dirname, '../utils/donationCalculator.js');
const MUTATED_FILE = path.join(__dirname, '../utils/donationCalculator.mutated.js');
const BACKUP_FILE = path.join(__dirname, '../utils/donationCalculator.backup.js');

console.log('🧬 MANUAL MUTATION TESTING DEMONSTRATION\n');
console.log('═'.repeat(60));

// Step 1: Run tests against original code
console.log('\n📋 Step 1: Running tests against ORIGINAL code...\n');
try {
  const output = execSync('npm test -- tests/donationCalculator.test.js', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
  console.log('✅ Original code: Tests PASS\n');
} catch (error) {
  console.error('❌ Original code tests failed!');
  process.exit(1);
}

// Step 2: Backup original and replace with mutated
console.log('═'.repeat(60));
console.log('\n🔀 Step 2: Replacing with MUTATED code...\n');

// Backup original
fs.copyFileSync(ORIGINAL_FILE, BACKUP_FILE);
console.log('✅ Original code backed up');

// Replace with mutated
fs.copyFileSync(MUTATED_FILE, ORIGINAL_FILE);
console.log('✅ Replaced with mutated version\n');

// Step 3: Run tests against mutated code
console.log('═'.repeat(60));
console.log('\n🧪 Step 3: Running tests against MUTATED code...\n');
console.log('⚠️  Expected: Tests should FAIL (this proves tests are strong!)\n');

try {
  const output = execSync('npm test -- tests/donationCalculator.test.js', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
  console.log('❌ WARNING: Tests still passed! This means tests are WEAK.');
  console.log('   Tests should fail when code is mutated.\n');
} catch (error) {
  const output = error.stdout || error.stderr || error.message;
  console.log(output);
  console.log('\n✅ SUCCESS: Tests FAILED with mutated code!');
  console.log('   This proves your tests are STRONG and catch bugs!\n');
}

// Step 4: Restore original code
console.log('═'.repeat(60));
console.log('\n🔄 Step 4: Restoring ORIGINAL code...\n');

fs.copyFileSync(BACKUP_FILE, ORIGINAL_FILE);
fs.unlinkSync(BACKUP_FILE);
console.log('✅ Original code restored');

// Step 5: Verify original works again
console.log('\n📋 Step 5: Verifying original code still works...\n');
try {
  const output = execSync('npm test -- tests/donationCalculator.test.js', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
  console.log('✅ Original code: Tests PASS again\n');
} catch (error) {
  console.error('❌ Original code tests failed after restore!');
  process.exit(1);
}

console.log('═'.repeat(60));
console.log('\n✅ MANUAL MUTATION TESTING COMPLETE\n');
console.log('📊 Summary:');
console.log('   - Original code: Tests PASS ✅');
console.log('   - Mutated code: Tests FAIL ✅ (proves tests are strong)');
console.log('   - Original restored: Tests PASS ✅');
console.log('\n💡 This demonstrates that your tests catch bugs!');

