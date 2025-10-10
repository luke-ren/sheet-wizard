# Testing Guide

## Overview

This project uses **runtime tests** in the Google Apps Script environment.

## Runtime Tests (Apps Script)

### Running Tests

1. Deploy the script to Google Apps Script
2. Open the Apps Script editor
3. Run `runAllTests()` function
4. Check execution logs for results

### Test Files

- `src/tests.ts` - Full integration tests that use Google APIs

### What Gets Tested

- ✅ Database operations (PropertiesService)
- ✅ Sheet data extraction
- ✅ Email formatting with real data
- ✅ Configuration persistence
- ✅ Entry tracking

### Manual Testing Checklist

After deployment, manually verify:

- [ ] Create a new form
- [ ] Form opens in new tab
- [ ] Sheet is renamed correctly
- [ ] Add email recipients
- [ ] Enable notifications
- [ ] Click "Send Notifications Now"
- [ ] Verify email received
- [ ] Check email formatting
- [ ] Verify sheet link in email works
- [ ] Wait for automatic notification
- [ ] Verify only new entries sent

## Test Coverage

### Test Coverage by Module

- **Utils**: 100% (all pure functions)
- **Email Formatting**: 95% (including boolean handling)
- **Validation**: 100%
- **Database**: 80% (mocked in Jest, full in Apps Script)
- **Tracker Logic**: 100% (entry comparison fully tested)

### Coverage Report

```bash
npm run test:coverage

View coverage report in `coverage/lcov-report/index.html`

## Writing New Tests

### Jest Tests (Build-Time)

```typescript
describe('My Feature', () => {
  test('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Apps Script Tests (Runtime)

```typescript
function testMyFeature(): void {
  console.log('\n=== Testing My Feature ===');
  
  const result = myFunction(input);
  assertEqual(result, expected, 'Feature works correctly');
}

// Add to runAllTests()
function runAllTests(): void {
  // ... existing tests
  testMyFeature();
}
```

## Debugging Failed Tests

### Jest Tests

```bash
# Run specific test file
npm test -- unit.test.ts

# Run with verbose output
npm test -- --verbose

# Debug in VS Code
# Add breakpoint and run "Jest: Debug"
```

### Apps Script Tests

1. Add `debugger;` statement
2. Run test function
3. Check execution logs
4. Use `console.log()` for debugging

## Continuous Integration

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm test
```

### GitHub Actions

```yaml
name: Test and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run push
```

## Best Practices

1. **Write tests first** - TDD approach
2. **Test edge cases** - Empty inputs, null values, etc.
3. **Mock external dependencies** - PropertiesService, MailApp, etc.
4. **Keep tests fast** - Build-time tests should run in < 5 seconds
5. **Use descriptive names** - Test names should explain what they test
6. **One assertion per test** - Makes failures easier to debug
7. **Clean up after tests** - Delete test data in Apps Script tests

## Troubleshooting

### Jest Tests Failing

**Issue**: Module not found
**Solution**: Check `jest.config.js` roots and moduleFileExtensions

**Issue**: TypeScript errors
**Solution**: Ensure `tsconfig.json` is compatible with Jest

**Issue**: Timeout errors
**Solution**: Increase timeout in test: `jest.setTimeout(10000)`

### Apps Script Tests Failing

**Issue**: PropertiesService quota exceeded
**Solution**: Clean up test data after each test

**Issue**: Permission errors
**Solution**: Re-authorize the script with required scopes

**Issue**: Trigger not firing
**Solution**: Check trigger exists and is enabled

## Performance

### Test Execution Times

- **Build-time tests**: ~2-3 seconds
- **Runtime tests**: ~10-15 seconds
- **Full deployment**: ~30-45 seconds (with tests)

### Optimization Tips

- Use `test.skip()` for slow tests during development
- Run only changed tests: `npm test -- --onlyChanged`
- Use `--bail` flag to stop on first failure
