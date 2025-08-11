import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.137.120:5500/api"

interface RequestOptions extends RequestInit {
  body?: any;
}

export const apiRequest = async (
  endpoint: string,
  options: RequestOptions = {}
) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = await AsyncStorage.getItem("token");

  const config: RequestInit = {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
