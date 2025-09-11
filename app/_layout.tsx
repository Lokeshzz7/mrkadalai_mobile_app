import { Stack } from "expo-router";
import './globals.css';
import { AuthProvider } from "../context/AuthContext";
import { AppConfigProvider } from "../context/AppConfigContext";
import { useCallback, useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Toast from 'react-native-toast-message';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'EarlyQuake': require('@/assets/fonts/EarlyQuakeDEMO.otf'),
    'HughLife': require('@/assets/fonts/HughisLifePersonalUse.ttf'),
    'BebasNeue': require('@/assets/fonts/BebasNeue-Regular.ttf')
  });

  // References for notification listeners
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const hideSplash = async () => {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    };
    hideSplash();
  }, [fontsLoaded]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received in foreground:', notification);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User tapped notification:', response);

      // Handle notification tap here
      const notificationData = response.notification.request.content.data;

      // Example: Navigate to specific screens based on notification data
      if (notificationData?.screen) {
        console.log(`Navigate to: ${notificationData.screen}`);
      }

      if (notificationData?.orderId) {
        console.log(`Navigate to order: ${notificationData.orderId}`);
      }
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Additional notification configuration for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Create notification channel for Android
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        description: 'Notifications for order status updates',
      });

      Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        description: 'Promotional offers and discounts',
      });
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppConfigProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          onLayout={onLayoutRootView}
        >
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
        <Toast position="top" topOffset={50} />
      </AppConfigProvider>
    </AuthProvider>
  );
}