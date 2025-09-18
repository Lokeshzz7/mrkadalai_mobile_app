import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import Toast from 'react-native-toast-message'

import Icon from 'react-native-vector-icons/Feather'

import { images } from '@/constants/images'

const { width } = Dimensions.get('window')

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [formErrors, setFormErrors] = useState({ email: '', password: '' })
  const { login, isLoading } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const errors = { email: '', password: '' }
    let isValid = true

    if (email.trim() === '') {
      errors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }

    if (password.trim() === '') {
      errors.password = 'Password is required'
      isValid = false
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleForgotPassword = () => {
    Toast.show({
      type: 'info',
      text1: 'Forgot Password',
      text2: 'Please contact support to reset your password.',
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      onPress: () => Toast.hide(),
    })
  }

  const handleLogin = async () => {
    setFormErrors({ email: '', password: '' })
    if (!validateForm()) return

    try {
      await login(email.trim(), password)
      console.log('✅ Login successful')
    } catch (error) {
      console.error('Login error:', error)

      let errorMessage = 'Login failed. Please try again.'
      let shouldClearForm = false

      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage =
            'Invalid email or password. Please check your credentials and try again.'
          shouldClearForm = true
        } else if (error.message.includes('Server returned invalid response')) {
          errorMessage =
            'Unable to connect to server. Please check your internet connection and try again.'
        } else if (
          error.message.includes('Network request failed') ||
          error.message.includes('network')
        ) {
          errorMessage =
            'Network error. Please check your internet connection and try again.'
        } else if (error.message.includes('Login service not found')) {
          errorMessage =
            'Service temporarily unavailable. Please try again later.'
        } else if (error.message.includes('Server error')) {
          errorMessage =
            'Server is temporarily unavailable. Please try again in a few minutes.'
        } else if (error.message) {
          errorMessage = error.message
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
        onHide: () => {
          if (shouldClearForm) {
            setPassword('')
          }
        },
      })
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-background">
          {/* Header Illustration */}
          <View className="items-center">
            <Image
              source={images.Login_Illustration}
              style={{ width: width, height: (width / 2) / 2 }}
              resizeMode="contain"
            />
          </View>

          {/* Welcome text */}
          <View className="items-center mt-10 mb-6">
            <Text className="text-white text-3xl font-bold mb-2">Log In</Text>
            <Text className="text-gray-800 text-base">
              Please sign in to your existing account
            </Text>
          </View>

          {/* Form Container */}
          <View className="px-4 ">
            <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6">
              {/* Email Field */}
              <View className=" mt-4 mb-5">
                <Text className="text-gray-700 text-lg font-bold mb-2">
                  Email Address
                </Text>
                <View
                  className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.email
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200'
                    }`}
                >
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text)
                      if (formErrors.email) {
                        setFormErrors((prev) => ({ ...prev, email: '' }))
                      }
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-900 text-base"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                    autoCorrect={false}
                  />
                </View>
                {formErrors.email ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">
                    ❌ {formErrors.email}
                  </Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View className="mb-4">
                <Text className="text-gray-700 text-lg font-bold mb-2">
                  Password
                </Text>
                <View
                  className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.password
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200'
                    }`}
                >
                  <View className="flex-row justify-between items-center">
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text)
                        if (formErrors.password) {
                          setFormErrors((prev) => ({ ...prev, password: '' }))
                        }
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      className="text-gray-900 text-base flex-1"
                      secureTextEntry={!isPasswordVisible}
                      autoCapitalize="none"
                      editable={!isLoading}
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      disabled={isLoading}
                      className="ml-2 p-1"
                    >
                      <Icon
                        name={isPasswordVisible ? 'eye' : 'eye-off'}
                        size={20}
                        color="#374151"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {formErrors.password ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">
                    {formErrors.password}
                  </Text>
                ) : null}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                className="self-end mb-6"
                disabled={isLoading}
                onPress={handleForgotPassword}
              >
                <Text className="text-yellow-600 text-sm font-semibold">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                className={`rounded-xl py-4 shadow-md ${isLoading
                  ? 'bg-gray-300'
                  : 'bg-yellow-400 active:bg-yellow-500'
                  }`}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="#1F2937" size="small" />
                    <Text className="text-gray-700 ml-2 font-semibold">
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-900 text-center font-bold text-lg">
                    Log In
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-10 mb-5">
                <Text className="text-gray-600 text-base">
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/auth/signup')}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text className="text-yellow-600 font-extrabold text-base ">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Link */}

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Login
