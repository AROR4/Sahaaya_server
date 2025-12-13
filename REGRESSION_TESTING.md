# 🔴 Regression Testing Guide

## Purpose

Regression testing ensures that newly added features don't break existing functionalities. This is critical when adding new modules like "NGO Acknowledgement Module" - we need to confirm that User Login, Create Campaign, Donate, and Join Campaign still work properly.

## How to Perform Regression Testing

### Step 1: Before Adding New Feature

1. **Run existing regression tests** to establish a baseline:
   ```bash
   npm run regression:baseline
   ```
   
   This will:
   - Run all regression tests
   - Save results as `test-results/baseline-results.json`
   - Display test summary

2. **Verify all tests pass** ✅
   - If any tests fail, fix them before proceeding
   - The baseline represents the "known good" state

### Step 2: Add the New Feature

Add your new feature (e.g., "Generate Acknowledgement" module):

```bash
# Make your changes
# Add new routes, controllers, models, etc.
```

### Step 3: Re-run All Tests

Run the regression tests again:

```bash
npm run regression:run
```

This will:
- Run all regression tests
- Save current results to `test-results/current-results.json`
- Display test summary

### Step 4: Compare Results

Compare the current results with the baseline:

```bash
npm run regression:compare
```

This will:
- Compare baseline vs current results
- Show detailed comparison
- Indicate if regression test passed or failed

### Expected Output

#### ✅ Regression Test Passed
```
✅ REGRESSION TEST PASSED
   All test results match the baseline. No regressions detected.
```

#### ❌ Regression Test Failed
```
❌ REGRESSION TEST FAILED
   Tests changed: 25 → 23 (-2)
   Test suites changed: 5 → 4 (-1)
   
❌ Failed Tests:
   - 1️⃣ User Authentication (Login): 1 failing
   - 2️⃣ Create Campaign: 1 failing
```

## Test Coverage

The regression test suite covers these core functionalities:

### 1️⃣ User Authentication (Login)
- ✅ Login with correct credentials
- ✅ Handle non-existent user
- ✅ Handle incorrect password
- ✅ Handle missing credentials

### 2️⃣ Create Campaign
- ✅ Create campaign with valid data
- ✅ Require authentication
- ✅ Validate required fields

### 3️⃣ Donate to Campaign
- ✅ Donate to approved campaign
- ✅ Validate donation amount
- ✅ Require authentication
- ✅ Handle non-existent campaign
- ✅ Prevent donation to pending campaigns

### 4️⃣ Join Campaign
- ✅ Join approved campaign
- ✅ Prevent duplicate joins
- ✅ Require authentication
- ✅ Handle non-existent campaign
- ✅ Prevent joining pending campaigns

### 5️⃣ Get Campaigns
- ✅ Get all campaigns (public)
- ✅ Get single campaign by ID
- ✅ Handle non-existent campaign

## Quick Reference

| Command | Purpose |
|--------|---------|
| `npm run regression:baseline` | Save baseline results before changes |
| `npm run regression:run` | Run regression tests |
| `npm run regression:compare` | Compare current results with baseline |
| `npm test:regression` | Run regression tests (Jest only) |

## Workflow Example

```bash
# 1. Before adding new feature
npm run regression:baseline

# 2. Add your new feature
# ... make code changes ...

# 3. Run tests
npm run regression:run

# 4. Compare results
npm run regression:compare
```

## Test Results Location

- **Baseline**: `backend/test-results/baseline-results.json`
- **Current**: `backend/test-results/current-results.json`

These files contain:
- Timestamp
- Test summary (passed/failed counts)
- Individual test results
- Overall status

## Troubleshooting

### Tests fail after adding new feature

1. **Check if your changes broke existing functionality**
   - Review the failed test cases
   - Check error messages in test output

2. **Verify database state**
   - Tests use a separate test database
   - Ensure test database is accessible

3. **Check for breaking changes**
   - Did you modify existing API endpoints?
   - Did you change authentication logic?
   - Did you modify data models?

### Baseline not found

If you see "No baseline results found":
```bash
npm run regression:baseline
```

### Tests are slow

- Tests run sequentially (`--runInBand`) to avoid database conflicts
- This is intentional for integration tests
- Consider running specific test suites during development

## Best Practices

1. **Always run baseline before major changes**
   - Before adding new features
   - Before refactoring
   - Before merging branches

2. **Run regression tests frequently**
   - After each significant change
   - Before committing code
   - Before deploying

3. **Fix failing tests immediately**
   - Don't ignore test failures
   - Understand why tests failed
   - Fix the root cause

4. **Update baseline when appropriate**
   - When adding new regression tests
   - When fixing bugs that were previously untested
   - After major refactoring (if tests are updated)

## Adding New Regression Tests

When adding new core functionality, add tests to `backend/tests/regression.test.js`:

```javascript
describe('6️⃣ New Feature', () => {
  it('✅ should work correctly', async () => {
    // Test implementation
  });
});
```

Then update the baseline:
```bash
npm run regression:baseline
```

## Integration with CI/CD

You can integrate regression testing into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Regression Tests
  run: |
    npm run regression:baseline
    npm run regression:run
    npm run regression:compare
```

---

**Remember**: Regression testing is your safety net. Use it to catch breaking changes before they reach production! 🛡️

