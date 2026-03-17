export default {
  expo: {
    name: "jansathi",
    slug: "jansathi-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "jansathi",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      SUPABASE_URL: "https://ofgwgfxswtltzteprwvo.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      router: {},
      eas: {
        projectId: "2d9c6699-57e4-45b3-a23b-aa6039a8c92a"
      }
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSSpeechRecognitionUsageDescription: "Allow JanSathi to recognize your speech.",
        NSMicrophoneUsageDescription: "Allow JanSathi to use the microphone for voice chat."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/logo_bg.png"
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.RECORD_AUDIO"
      ],
      package: "com.eshwar_1617.jansathiapp"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/icon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      "expo-web-browser",
      [
        "expo-speech-recognition",
        {
          microphonePermission: "Allow JanSathi to use the microphone for voice chat.",
          speechRecognitionPermission: "Allow JanSathi to recognize your speech."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};