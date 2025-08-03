const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Add path alias resolution
config.resolver.alias = {
  '@': path.resolve(__dirname),
};

// Prioritize CommonJS modules over ESM for certain packages
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;