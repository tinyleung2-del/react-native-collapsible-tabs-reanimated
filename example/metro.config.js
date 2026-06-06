// https://docs.expo.dev/guides/monorepos/#configure-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../");

const config = getDefaultConfig(projectRoot);

// Watch workspace root so Metro can see the local package source
config.watchFolders = [workspaceRoot];

// Resolve modules first from the example, then from the workspace root
// config.resolver.nodeModulesPaths = [
//   path.resolve(projectRoot, "node_modules"),
//   path.resolve(workspaceRoot, "node_modules"),
// ];

// Enable package.json `exports` field so sub-paths like
// 'react-native-collapsible-tabs-reanimated/flash-list' resolve correctly
// config.resolver.unstable_enablePackageExports = true;

module.exports = config;
