# 🚀 Regression Testing Quick Start

## Quick Workflow

### Before Adding New Features

```bash
# 1. Save baseline (run this first!)
npm run regression:baseline
```

### After Adding New Features

```bash
# 2. Run tests
npm run regression:run

# 3. Compare with baseline
npm run regression:compare
```

## Example: Adding "NGO Acknowledgement Module"

```bash
# Step 1: Before adding feature
npm run regression:baseline
# ✅ Baseline saved! All tests passed.

# Step 2: Add your new feature
# ... make code changes ...

# Step 3: Run tests again
npm run regression:run
# ✅ Tests completed. Results saved.

# Step 4: Compare results
npm run regression:compare
# ✅ REGRESSION TEST PASSED
#    All test results match the baseline. No regressions detected.
```

## What Gets Tested?

✅ **User Login** - Authentication works  
✅ **Create Campaign** - Campaign creation works  
✅ **Donate** - Donation functionality works  
✅ **Join Campaign** - Joining campaigns works  
✅ **Get Campaigns** - Campaign retrieval works  

## Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run regression:baseline` | Save baseline results (run before changes) |
| `npm run regression:run` | Run regression tests |
| `npm run regression:compare` | Compare current vs baseline |

## Expected Output

### ✅ Pass
```
✅ REGRESSION TEST PASSED
   All test results match the baseline. No regressions detected.
```

### ❌ Fail
```
❌ REGRESSION TEST FAILED
   Tests changed: 25 → 23 (-2)
   Test suites changed: 5 → 4 (-1)
```

## Files Created

- `test-results/baseline-results.json` - Baseline test results
- `test-results/current-results.json` - Current test results

## Need More Details?

See [REGRESSION_TESTING.md](./REGRESSION_TESTING.md) for complete documentation.

