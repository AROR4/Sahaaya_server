module.exports = {
  testEnvironment: "node",
  // Only use mock setup for unit tests in tests/ directory
  // Integration tests in test.js will not use mocks
  setupFiles: ["<rootDir>/tests/jest.setup.js"],
  testMatch: [
    "**/tests/**/*.test.js",
    "**/test.js"
  ],
  // Don't mock for integration tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
