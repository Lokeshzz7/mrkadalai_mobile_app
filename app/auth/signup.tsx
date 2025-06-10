import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import { icons } from '@/constants/icons'
import { useAuth } from '../../context/AuthContext'
import Colors from '@/constants/theme/colors'

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { signup, isLoading } = useAuth()

  const handleSignup = async () => {
    if (name.trim() === '' || email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      await signup(name, email, password)
    } catch (error) {
      Alert.alert('Signup Failed', 'Could not create account. Please try again.')
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
          <Text className="text-white text-3xl font-bold mt-4">Create Account</Text>
          <Text className="text-light-200 text-base mt-2">Sign up to get started</Text>
        </View>


        <View className="space-y-5">
          <View className="bg-dark-200 rounded-xl px-4 py-3">
            <Text className="text-light-200 text-sm mb-1">Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#777"
              className="text-white text-base"
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View className="bg-dark-200 rounded-xl px-4 py-3">
            <Text className="text-light-200 text-sm mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#777"
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
                placeholder="Create a password"
                placeholderTextColor="#777"
                className="text-white text-base flex-1"
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
        </View>

        {/* Signup Button */}
        <TouchableOpacity
          className="bg-button_color rounded-full py-4 mt-8"
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark[200]} />
          ) : (
            <Text className="text-dark-200 text-center font-bold text-lg">
              Sign Up
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-light-200">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} disabled={isLoading}>
            <Text className="text-button_color font-bold">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Signup