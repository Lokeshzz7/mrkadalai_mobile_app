import 'dotenv/config';

export default {
  expo: {
    name: "Mr Kadalai",
    owner: "mrkadalais-organization",
    slug: "mrkadalai_app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "mrkadalai",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/logo2.jpg",
      resizeMode: "contain",
      backgroundColor: "#0f0d23"
    },
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mrkadalai.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo2.jpg",
        backgroundColor: "#0f0d23"
      },
      package: "com.mrkadalai.app",
      googleServicesFile: "./google-services.json",
      permissions: [
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      usesCleartextTraffic: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiUrl: "https://mrkadalai-backend.onrender.com/api",
      razorpayKey: process.env.EXPO_PUBLIC_RAZORPAY_KEY,
      router: { origin: false },
      eas: {
        projectId: "14861e3d-0c60-433f-bd71-a692c804eeed"
      }
    }
  }
};
