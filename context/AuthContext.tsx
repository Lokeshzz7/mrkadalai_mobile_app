import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  outletId?: number;
  customerInfo?: {
    id: string;
    yearOfStudy: number;
    wallet: {
      id: string;
      balance: number;
    };
  };
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phoneNumber: string, college: string, yearOfStudy: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Replace this with your actual API base URL
// Examples:
// Local development: 'http://localhost:3000/api' or 'http://192.168.1.100:3000/api'
// Production: 'https://your-domain.com/api'
// Make sure your backend server is running and accessible
const API_BASE_URL = 'http://192.168.137.251:5500/api'; // Update this to your backend URL

// 7 days in milliseconds
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');

        console.log('Loading user data:', {
          hasUser: !!userString,
          hasToken: !!token,
          loginTimestamp
        });

        if (userString) {
          const currentTime = Date.now();
          const loginTime = loginTimestamp ? parseInt(loginTimestamp) : 0;
          const timeDifference = currentTime - loginTime;

          console.log('Time check:', {
            currentTime,
            loginTime,
            timeDifference,
            sessionDuration: SESSION_DURATION,
            isExpired: timeDifference > SESSION_DURATION
          });

          // Check if session is still valid (within 7 days)
          if (loginTime && timeDifference <= SESSION_DURATION) {
            const userData = JSON.parse(userString);
            setUser(userData);
            console.log('✅ User session is valid, auto-logging in:', userData.email);
            router.replace('/');
          } else {
            console.log('❌ User session expired, clearing data');
            // Session expired, clear data
            await AsyncStorage.multiRemove(['user', 'token', 'loginTimestamp']);
            router.replace('/auth/login');
          }
        } else {
          console.log('❌ No user data found, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // On error, redirect to login
        router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const saveUserSession = async (userData: User, token?: string) => {
    try {
      const loginTimestamp = Date.now().toString();

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('loginTimestamp', loginTimestamp);

      if (token) {
        await AsyncStorage.setItem('token', token);
      }

      console.log('✅ User session saved:', {
        email: userData.email,
        timestamp: loginTimestamp,
        expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString()
      });
    } catch (error) {
      console.error('Failed to save user session:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Login request URL:', `${API_BASE_URL}/auth/signin`);
      console.log('Login request body:', { email, password: '***' });

      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);

      // Get response text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response was:', responseText);
        throw new Error(`Server returned invalid response. Status: ${response.status}. Please check if the server is running and the URL is correct.`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed with status: ${response.status}`);
      }

      // Save user session with timestamp
      await saveUserSession(data.user, data.token);

      setUser(data.user);
      router.replace('/');

      console.log('✅ Login successful for:', data.user.email);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, phoneNumber: string, college: string, yearOfStudy: string, password: string) => {
    setIsLoading(true);
    try {
      // Map college names to IDs
      const collegeMap: { [key: string]: number } = {
        'CIT': 1,
        'REC': 2
      };

      // Map year strings to numbers
      const yearMap: { [key: string]: number } = {
        '1 year': 1,
        '2 year': 2,
        '3 year': 3,
        '4 year': 4
      };

      const outletId = collegeMap[college];
      const yearOfStudyNumber = yearMap[yearOfStudy];

      if (!outletId) {
        throw new Error('Invalid college selection');
      }

      if (!yearOfStudyNumber) {
        throw new Error('Invalid year of study selection');
      }

      const requestBody = {
        name,
        email,
        password,
        role: 'CUSTOMER',
        outletId,
        phone: phoneNumber,
        yearOfStudy: yearOfStudyNumber
      };

      console.log('Signup request URL:', `${API_BASE_URL}/auth/signup`);
      console.log('Signup request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get response text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response was:', responseText);
        throw new Error(`Server returned invalid response. Status: ${response.status}. Please check if the server is running and the URL is correct.`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Signup failed with status: ${response.status}`);
      }

      // Save user session with timestamp
      await saveUserSession(data.user, data.token);

      setUser(data.user);
      router.replace('/');

      console.log('✅ Signup successful for:', data.user.email);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (token) {
        // Try to logout from server, but don't wait for it
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(console.error);
      }

      // Clear all auth data including timestamp
      await AsyncStorage.multiRemove(['user', 'token', 'loginTimestamp']);
      setUser(null);
      router.replace('/auth/login');

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Function to check if user session is still valid
  const checkSessionValidity = async () => {
    try {
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      if (!loginTimestamp) return false;

      const currentTime = Date.now();
      const loginTime = parseInt(loginTimestamp);
      const timeDifference = currentTime - loginTime;

      return timeDifference <= SESSION_DURATION;
    } catch (error) {
      console.error('Failed to check session validity:', error);
      return false;
    }
  };

  const extendSession = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString && user) {
        const newTimestamp = Date.now().toString();
        await AsyncStorage.setItem('loginTimestamp', newTimestamp);
        console.log('✅ Session extended for user:', user.email);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};