import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { apiRequest } from "../utils/api"; // Import your centralized API function

/**
 * Sends the device token to your backend to register it.
 */
const registerDeviceOnServer = async (token) => {
  try {
    await apiRequest("/customer/notifications/register-device", {
      method: "POST",
      body: {
        deviceToken: token,
        platform: Platform.OS,
      },
    });
    // console.log(
    //   "✅ Push notification token successfully registered with backend."
    // );
  } catch (error) {
    console.error("❌ Error sending push token to server:", error);
  }
};

/**
 * Sends a request to your backend to deactivate the token.
 */
const unregisterDeviceOnServer = async (token) => {
  if (!token) return;
  try {
    await apiRequest("/customer/notifications/unregister-device", {
      method: "POST",
      body: { deviceToken: token },
    });
    // console.log("✅ Push notification token unregistered from backend.");
  } catch (error) {
    console.error("❌ Error unregistering push token from server:", error);
  }
};

/**
 * A hook to manage push notification registration logic.
 */
export const usePushNotifications = () => {
  /**
   * Gets permissions and the native device token, then sends it to the server.
   */
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      // console.log("Push notifications are not supported on simulators.");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // console.log("User did not grant permission for push notifications.");
      return;
    }

    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData.data;
      // console.log("Native Device Token:", token);
      await registerDeviceOnServer(token);
    } catch (e) {
      console.error("Failed to get native push token", e);
    }
  };

  /**
   * Gets the device token and tells the server to deactivate it.
   */
  const unregisterForPushNotifications = async () => {
    if (!Device.isDevice) return;
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      await unregisterDeviceOnServer(tokenData.data);
    } catch (error) {
      console.error("Could not get token to unregister", error);
    }
  };

  return { registerForPushNotifications, unregisterForPushNotifications };
};
