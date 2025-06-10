import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { router } from 'expo-router'
import { icons } from '@/constants/icons'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { login, isLoading } = useAuth()

  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      await login(email, password)
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 px-4 py-8">
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="items-center mb-10 mt-6"
          >
            <View className="w-24 h-24 bg-yellow-400 rounded-full items-center justify-center mb-6 shadow-md">
              <Text className="text-4xl">🍽️</Text>
            </View>
            <MotiText
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              className="text-gray-900 text-3xl font-bold mb-2"
            >
              Welcome Back
            </MotiText>
            <MotiText
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              className="text-gray-600 text-base"
            >
              Sign in to continue your food journey
            </MotiText>
          </MotiView>

          {/* Form Container */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6"
          >
            {/* Email Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📧 Email Address</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-semibold mb-2">🔒 Password</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <View className="flex-row justify-between items-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-900 text-base flex-1"
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    disabled={isLoading}
                    className="ml-2"
                  >
                    <Text className="text-yellow-600 font-semibold">
                      {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mb-6" disabled={isLoading}>
              <Text className="text-yellow-600 text-sm font-semibold">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              className="bg-yellow-400 rounded-xl py-4 shadow-md"
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#1F2937" size="small" />
              ) : (
                <Text className="text-gray-900 text-center font-bold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </MotiView>

          {/* Sign Up Link */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 800 }}
            className="bg-white rounded-2xl p-4 shadow-md border border-gray-100"
          >
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/signup')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text className="text-yellow-600 font-bold text-base">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Login