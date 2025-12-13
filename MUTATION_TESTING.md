# 🧬 Mutation Testing Guide

## Purpose

Mutation testing checks how **strong** your test cases are by introducing small "mutations" (intentional code errors) and seeing if your test cases catch them.

If your tests **fail** when mutations are introduced → Your tests are **strong** ✅  
If your tests **still pass** when mutations are introduced → Your tests are **weak** ❌

## Example: Donation Calculator

### Original Function

```javascript
function calculateDonationAfterFee(amount, platformFeePercent = 10) {
  if (amount <= 0) {
    throw new Error('Donation amount must be greater than 0');
  }
  
  const feeAmount = (amount * platformFeePercent) / 100;
  return amount - feeAmount; // ✅ Correct: Subtract fee from amount
}
```

### Mutated Function (Intentional Bug)

```javascript
function calculateDonationAfterFee(amount, platformFeePercent = 10) {
  if (amount <= 0) {
    throw new Error('Donation amount must be greater than 0');
  }
  
  const feeAmount = (amount * platformFeePercent) / 100;
  return amount + feeAmount; // ❌ MUTATION: Changed - to +
}
```

### Test Case

```javascript
it('should calculate donation after 10% platform fee', () => {
  const result = calculateDonationAfterFee(100, 10);
  expect(result).toBe(90); // Expected: 90
});
```

### Result

- **Original code**: Test passes ✅ (returns 90)
- **Mutated code**: Test **fails** ✅ (returns 110, not 90)

**Conclusion**: The test is **strong** because it catches the mutation!

## Tools

### Option A: Stryker Mutator (Automated)

Stryker Mutator automatically introduces mutations and runs your tests to see if they catch them.

#### Installation

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
```

#### Configuration

Stryker configuration is in `stryker.conf.json`:

```json
{
  "testRunner": "jest",
  "mutate": [
    "utils/**/*.js",
    "!utils/**/*.test.js"
  ],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

#### Run Mutation Testing

```bash
npm run test:mutation
```

#### Understanding Results

Stryker will generate a report showing:

- **Mutation Score**: Percentage of mutations killed by tests
  - Example: `Mutation Score: 85% (17/20 mutants killed)`
  
- **Surviving Mutants**: Mutations that didn't cause test failures
  - These indicate weak test coverage
  
- **Killed Mutants**: Mutations that caused test failures
  - These indicate strong test coverage

#### Example Output

```
Mutation Score: 85.00% (17/20 mutants killed)

Killed:
  - ArithmeticOperator: amount - feeAmount → amount + feeAmount
  - ArithmeticOperator: participantCount / targetParticipants → participantCount * targetParticipants

Survived:
  - ConditionalExpression: Changed comparison operator
  - LogicalOperator: Changed && to ||
```

### Option B: Manual Mutation Testing

If you can't use Stryker, you can manually introduce mutations:

#### Step 1: Create Mutated Version

Create a copy of your function with intentional bugs:

```javascript
// Original
return amount - feeAmount;

// Mutated
return amount + feeAmount; // ❌ Bug
```

#### Step 2: Run Tests

```bash
npm test
```

#### Step 3: Verify Tests Fail

If tests fail → Tests are strong ✅  
If tests pass → Tests are weak ❌ (need more test cases)

#### Example: Manual Mutation Test

See `utils/donationCalculator.mutated.js` for examples of mutations.

Run tests against mutated code:

```bash
# Temporarily replace the original with mutated version
cp utils/donationCalculator.mutated.js utils/donationCalculator.js
npm test tests/donationCalculator.test.js
# Tests should FAIL
# Restore original
git checkout utils/donationCalculator.js
```

## Mutation Types

Common mutations that Stryker introduces:

### 1. Arithmetic Operators
```javascript
// Original
return a + b;

// Mutations
return a - b;  // Changed + to -
return a * b;  // Changed + to *
return a / b;  // Changed + to /
```

### 2. Relational Operators
```javascript
// Original
if (amount > 0) { }

// Mutations
if (amount < 0) { }   // Changed > to <
if (amount >= 0) { }  // Changed > to >=
if (amount <= 0) { }  // Changed > to <=
```

### 3. Logical Operators
```javascript
// Original
if (a && b) { }

// Mutations
if (a || b) { }  // Changed && to ||
if (!a && b) { } // Added negation
```

### 4. Conditional Expressions
```javascript
// Original
return x > 0 ? a : b;

// Mutations
return x > 0 ? b : a;  // Swapped branches
return x < 0 ? a : b;  // Changed condition
```

### 5. Literal Values
```javascript
// Original
const fee = 10;

// Mutations
const fee = 0;   // Changed to 0
const fee = -1;  // Changed to negative
const fee = 1;   // Changed to 1
```

## Interpreting Results

### High Mutation Score (80%+)
✅ **Strong test suite**
- Most mutations are caught by tests
- Tests are comprehensive
- Code is well-tested

### Medium Mutation Score (60-80%)
⚠️ **Moderate test suite**
- Some mutations survive
- Need more edge case tests
- Some logic paths not fully tested

### Low Mutation Score (<60%)
❌ **Weak test suite**
- Many mutations survive
- Tests don't catch bugs well
- Need significant test improvements

## Best Practices

1. **Aim for 80%+ mutation score**
   - High confidence in test quality
   - Most bugs will be caught

2. **Focus on surviving mutants**
   - These indicate weak test coverage
   - Add tests to kill surviving mutants

3. **Test edge cases**
   - Zero values
   - Negative values
   - Boundary conditions
   - Error cases

4. **Test business logic thoroughly**
   - Calculation functions
   - Validation logic
   - Conditional branches

5. **Run mutation testing regularly**
   - After adding new features
   - Before major releases
   - When refactoring code

## Example: Donation Calculator Mutation Testing

### Test Coverage

Our `donationCalculator.test.js` has 19 test cases covering:
- ✅ Normal calculations
- ✅ Edge cases (zero, negative)
- ✅ Error handling
- ✅ Boundary conditions

### Expected Mutation Score

With comprehensive tests, we expect:
- **High mutation score** (80%+)
- Most arithmetic mutations killed
- Most conditional mutations killed

### Running Mutation Tests

```bash
# Run Stryker mutation testing
npm run test:mutation

# Or manually test with mutated version
# (See utils/donationCalculator.mutated.js)
```

## Integration with CI/CD

Add mutation testing to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Mutation Testing
  run: |
    npm run test:mutation
    # Fail if mutation score < 80%
```

## Summary

Mutation testing helps you:
- ✅ Verify test quality
- ✅ Find weak test coverage
- ✅ Improve test strength
- ✅ Catch bugs before production

**Remember**: Strong tests = High mutation score = Better code quality! 🛡️

