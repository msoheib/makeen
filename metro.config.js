const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Prioritize CommonJS modules over ESM for certain packages
config.resolver = {
  ...(config.resolver || {}),
  unstable_conditionNames: ['browser', 'require', 'react-native'],
};

module.exports = config;