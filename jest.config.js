
const common = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'unit',
      rootDir: '<rootDir>/src',
      testRegex: '.*\\.spec\\.ts$',
    },
    {
      ...common,
      displayName: 'e2e',
      rootDir: '<rootDir>',
      testRegex: '.*\\.e2e-spec\\.ts$',
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/migrations/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  maxWorkers: 1,
};
