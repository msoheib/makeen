module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      'react-native-reanimated/plugin',
      // Strip console.* calls in production builds to reduce logging overhead
      // Keep warn/error for important surface-level issues
      ...(process.env.NODE_ENV === 'production' ? [
        [
          'transform-remove-console',
          { exclude: ['error', 'warn'] },
        ]
      ] : []),
    ],
  };
};