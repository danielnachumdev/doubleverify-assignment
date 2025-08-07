# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, coverage requirements, and available testing tools for the ATM System project.

## Test Structure

```
tests/
├── integration/           # End-to-end integration tests
│   └── atm-system.integration.test.ts
├── middleware/           # Middleware unit tests
│   ├── ErrorHandlingMiddleware.test.ts
│   └── ValidationMiddleware.test.ts
├── models/              # Model unit tests
│   └── Account.test.ts
├── routes/              # Route integration tests
│   ├── balance.test.ts
│   ├── deposit.test.ts
│   └── withdraw.test.ts
├── services/            # Service unit tests
│   ├── AccountService.test.ts
│   └── DataStore.test.ts
└── utils/               # Test utilities
    └── testHelpers.ts
```

## Test Categories

### 1. Unit Tests
- **Models**: Test data validation and business logic
- **Services**: Test core business operations (AccountService, DataStore)
- **Middleware**: Test validation and error handling logic

### 2. Integration Tests
- **Routes**: Test API endpoints with full request/response cycles
- **System**: Test complete workflows and multi-component interactions

### 3. End-to-End Tests
- **Complete ATM workflows**: Balance inquiry → Withdrawal → Deposit cycles
- **Multi-account operations**: Concurrent and sequential operations
- **Error scenarios**: Invalid inputs, insufficient funds, system failures
- **Edge cases**: Precision handling, rapid operations, high load

## Coverage Requirements

### Global Thresholds
- **Statements**: 90% minimum
- **Branches**: 85% minimum  
- **Functions**: 90% minimum
- **Lines**: 90% minimum

### Per-Directory Thresholds
- **Services**: 95% (statements, functions, lines), 90% (branches)
- **Models**: 100% (all metrics)

## Available Test Scripts

### Basic Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test categories
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
```

### Coverage Testing
```bash
# Run tests with coverage report
npm run test:coverage

# Run coverage with watch mode
npm run test:coverage:watch

# Generate HTML coverage report and open it
npm run test:coverage:html

# Run coverage analysis with detailed insights
npm run test:coverage:analyze

# Generate comprehensive test report
npm run test:report
```

## Coverage Analysis Tools

### 1. Coverage Analysis Script
The `npm run test:coverage:analyze` command provides:
- Overall coverage statistics
- File-by-file breakdown
- Identification of files needing improvement
- Specific recommendations for improvement
- Next steps guidance

### 2. Test Report Generator
The `npm run test:report` command generates:
- JSON report with detailed metrics
- HTML report with visual coverage indicators
- Recommendations based on coverage analysis
- Historical tracking capabilities

### 3. HTML Coverage Reports
Generated in the `coverage/` directory:
- **index.html**: Main coverage dashboard
- **File-specific reports**: Detailed line-by-line coverage
- **Interactive navigation**: Click through to see uncovered code

## Current Coverage Status

As of the latest run:

| Metric     | Coverage | Target | Status |
|------------|----------|--------|--------|
| Statements | 95%      | 90%    | ✅ Pass |
| Branches   | 85%      | 85%    | ✅ Pass |
| Functions  | 91%      | 90%    | ✅ Pass |
| Lines      | 96%      | 90%    | ✅ Pass |

### Files Needing Improvement
1. **ValidationMiddleware.ts**: 84% statements, 73% branches, 71% functions
2. **ErrorHandlingMiddleware.ts**: 95% statements, 76% branches, 90% functions

## Test Utilities

### TestHelpers
Located in `tests/utils/testHelpers.ts`, provides:
- **Test account constants**: Predefined account numbers for testing
- **DataStore setup/cleanup**: Consistent test environment
- **Balance helpers**: Expected balance calculations
- **Mock data generation**: Consistent test data

### Example Usage
```typescript
import { TestHelpers } from '../utils/testHelpers';

describe('Account Operations', () => {
  let dataStore: DataStore;

  beforeEach(() => {
    dataStore = TestHelpers.setupDataStore();
  });

  afterEach(() => {
    TestHelpers.cleanupDataStore(dataStore);
  });

  it('should handle valid account operations', () => {
    const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
    const expectedBalance = TestHelpers.getExpectedBalance(accountNumber);
    // Test implementation...
  });
});
```

## Integration Test Scenarios

### Complete ATM Workflows
- Balance inquiry → Withdrawal → Deposit → Balance check
- Multiple withdrawals until insufficient funds
- Account depletion and replenishment cycles

### Multi-Account Operations
- Concurrent operations on different accounts
- Sequential operations maintaining account isolation
- High-load scenarios with multiple simultaneous requests

### Error Handling Integration
- Mixed valid/invalid operations
- Data consistency during error scenarios
- System resilience under stress

### Edge Cases and Boundary Conditions
- Decimal precision and rounding
- Rapid sequential operations
- High-load performance testing

## Best Practices

### Writing Tests
1. **Use descriptive test names** that explain the scenario
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test both happy path and error scenarios**
4. **Use TestHelpers for consistent setup**
5. **Mock external dependencies appropriately**

### Coverage Goals
1. **Aim for 100% function coverage** - every function should be tested
2. **Focus on branch coverage** - test all conditional paths
3. **Test error conditions** - ensure error handling works correctly
4. **Add edge case tests** - boundary conditions and unusual inputs

### Continuous Improvement
1. **Run coverage analysis regularly** with `npm run test:coverage:analyze`
2. **Review HTML reports** to identify specific uncovered lines
3. **Add tests for uncovered branches** and functions
4. **Monitor coverage trends** over time

## Troubleshooting

### Common Issues
1. **Low branch coverage**: Add tests for conditional logic and error paths
2. **Uncovered functions**: Ensure all public methods have dedicated tests
3. **Flaky tests**: Use proper setup/teardown and avoid shared state
4. **Slow tests**: Optimize test data and consider parallel execution

### Performance Optimization
- Use `--maxWorkers` flag to control parallel test execution
- Implement proper test isolation to avoid interference
- Use focused tests (`fit`, `fdescribe`) during development
- Consider test sharding for large test suites

## Reporting and Monitoring

### Automated Reports
- Coverage reports are generated automatically with each test run
- HTML reports provide detailed file-by-file analysis
- JSON reports enable integration with CI/CD pipelines

### Metrics Tracking
- Track coverage trends over time
- Monitor test execution time
- Identify frequently failing tests
- Measure test suite reliability

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Tests with Coverage
  run: npm run test:coverage

- name: Generate Test Report
  run: npm run test:report

- name: Upload Coverage Reports
  uses: actions/upload-artifact@v2
  with:
    name: coverage-reports
    path: coverage/
```

### Quality Gates
- Enforce minimum coverage thresholds
- Fail builds on coverage regression
- Require test updates for new features
- Monitor test execution performance

## Future Enhancements

### Planned Improvements
1. **Performance testing**: Load testing for high-concurrency scenarios
2. **Security testing**: Input validation and injection attack prevention
3. **Contract testing**: API contract validation
4. **Visual regression testing**: UI component testing (if applicable)

### Tool Enhancements
1. **Coverage trending**: Historical coverage tracking
2. **Test impact analysis**: Identify tests affected by code changes
3. **Mutation testing**: Verify test quality through code mutations
4. **Automated test generation**: AI-assisted test case creation