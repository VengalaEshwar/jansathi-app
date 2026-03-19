const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// ✅ SVG transformer
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);

// ✅ Tell Metro: svg is source code, NOT a static asset
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// ✅ Keep your custom web stub logic
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return {
      filePath: path.resolve(__dirname, "stubs/react-native-maps.web.tsx"),
      type: "sourceFile",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

// ✅ Keep NativeWind wrapping at the end
module.exports = withNativeWind(config, { input: "./app/global.css" });