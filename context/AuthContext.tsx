import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  email: string;
};

type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          setUser(JSON.parse(userString));
          router.replace('/');
        } else {
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const existingUserString = await AsyncStorage.getItem('registeredUser');
      
      if (existingUserString) {
        const existingUser: RegisteredUser = JSON.parse(existingUserString);
        
        if (existingUser.email !== email || existingUser.password !== password) {
          throw new Error('Invalid email or password');
        }
        const userData: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.replace('/');
      } else {
        throw new Error('No registered user found. Please sign up first.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const registeredUserData: RegisteredUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password 
      };
      
      await AsyncStorage.setItem('registeredUser', JSON.stringify(registeredUserData));
     
      router.replace('/auth/login');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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