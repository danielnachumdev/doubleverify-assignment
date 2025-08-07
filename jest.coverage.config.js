module.exports = {
  // Extend the base Jest configuration
  ...require('./package.json').jest,
  
  // Enhanced coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'cobertura'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Per-file thresholds
    './src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/models/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/',
    '/tests/'
  ],
  
  // Verbose coverage reporting
  verbose: true,
  
  // Show coverage summary in console
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ]
};