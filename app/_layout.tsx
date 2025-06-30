import { Stack } from "expo-router";
import './globals.css';
import { AuthProvider } from "../context/AuthContext";
import { useCallback, useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'EarlyQuake': require('@/assets/fonts/EarlyQuakeDEMO.otf'),
    'HughLife': require('@/assets/fonts/HughisLifePersonalUse.ttf'),
    'BebasNeue': require('@/assets/fonts/BebasNeue-Regular.ttf')
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  useEffect(() => {
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  if (!fontsLoaded) {
    return null;
  }



  return (
    <AuthProvider>
      <Stack onLayout={onLayoutRootView}>

        <Stack.Screen
          name="auth/login"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="auth/signup"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ticket"
          options={{ headerShown: false }}
        />
      </Stack>

    </AuthProvider>
  );
}
