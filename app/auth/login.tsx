import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import { icons } from '@/constants/icons'
import { useAuth } from '../../context/AuthContext'
import Colors from '@/constants/theme/colors'

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
    <SafeAreaView className="flex-1 bg-dark-200">
      <View className="flex-1 px-6 py-8">

        {/* Header */}
        <View className="items-center mb-10 mt-6">
          <Image
            source={icons.logo}
            className="size-20"
            resizeMode="contain"
          />
          <Text className="text-white text-3xl font-bold mt-4">Welcome Back</Text>
          <Text className="text-light-200 text-base mt-2">Sign in to continue</Text>
        </View>

        {/* Form */}
        <View className="space-y-5">
          <View className="bg-dark-200 rounded-xl px-4 py-3">
            <Text className="text-light-200 text-sm mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={Colors.placeholder}
              className="text-white text-base"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View className="bg-dark-200 rounded-xl px-4 py-3">
            <Text className="text-light-200 text-sm mb-1">Password</Text>
            <View className="flex-row justify-between items-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.placeholder}
                className="text-white text-base flex-1 "
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} disabled={isLoading}>
                <Text className="text-button_color">
                  {isPasswordVisible ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity className="self-end" disabled={isLoading}>
            <Text className="text-button_color text-sm">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="bg-button_color rounded-full py-4 mt-8"
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark[200]} />
          ) : (
            <Text className="text-dark-200 text-center font-bold text-lg">
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-light-200">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')} disabled={isLoading}>
            <Text className="text-button_color font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Login