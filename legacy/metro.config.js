/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

/* module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
    // babelTransformerPath: require.resolve('./bundledMediaStripTransform'),
  },
}; */

// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/** @type {import('metro-config').ConfigT} */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

