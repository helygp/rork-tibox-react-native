const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const { withSentryMetro } = require("@sentry/react-native/expo/metro");

const config = getDefaultConfig(__dirname);

module.exports = withSentryMetro(withRorkMetro(config));
