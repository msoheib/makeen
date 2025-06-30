module.exports = {
  preset: 'jest-expo',
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/components/NotificationCard.test.tsx',
    '<rootDir>/__tests__/lib/notificationCategories.test.ts',
    '<rootDir>/__tests__/lib/notificationStorage.test.ts'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/setup.ts'
  ],
  testEnvironment: 'node',
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
}; 