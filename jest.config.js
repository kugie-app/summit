// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    // Handle CSS imports (e.g., if using CSS modules)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle module aliases (adjust based on your tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts", // Exclude type definition files
    "!src/**/layout.tsx", // Exclude layout files usually
    "!src/**/page.tsx", // Exclude page entry files (better tested with E2E)
    "!src/lib/db/**", // Exclude direct DB schema/migrations
    "!src/emails/**", // Exclude email templates (can be tested visually/integration)
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["json", "lcov", "text", "clover"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 