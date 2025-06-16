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
import { Picker } from '@react-native-picker/picker'
import { router } from 'expo-router'
import { icons } from '@/constants/icons'
import { useAuth } from '../../context/AuthContext'

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [college, setCollege] = useState('')
  const [customerYear, setCustomerYear] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const { signup, isLoading } = useAuth()

  const collegeList = [
    'Select your college',
    'CIT',
    'REC',
  ]

  const yearOfStudy = [
    'Select your year',
    '1 year',
    '2 year',
    '3 year',
    '4 year',
  ]

  const handleSignup = async () => {
    // Validation
    if (name.trim() === '' || email.trim() === '' || phoneNumber.trim() === '' ||
      college === '' || college === 'Select your college' ||
      customerYear === '' || customerYear === 'Select your year' ||
      password.trim() === '' || confirmPassword.trim() === '') {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    try {
      await signup(name, email, phoneNumber, college, customerYear, password)
      Alert.alert('Success', 'Account created successfully!')
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Could not create account. Please try again.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="flex-1 px-4 py-8">
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="items-center mb-8 mt-4"
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
              Create Account
            </MotiText>
            <MotiText
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              className="text-gray-600 text-base text-center"
            >
              Join us and discover amazing food experiences
            </MotiText>
          </MotiView>

          {/* Form Container */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6"
          >
            {/* Full Name Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">👤 Full Name</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

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

            {/* Phone Number Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📞 Phone Number</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* College Dropdown */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">🎓 College</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <Picker
                  selectedValue={college}
                  onValueChange={setCollege}
                  style={{
                    height: 60,
                    color: '#1F2937',
                  }}
                  enabled={!isLoading}
                >
                  {collegeList.map((item, index) => (
                    <Picker.Item
                      key={index}
                      label={item}
                      value={item}
                      color={index === 0 ? '#9CA3AF' : '#1F2937'}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Year of Study Dropdown */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📚 Year of Study</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <Picker
                  selectedValue={customerYear}
                  onValueChange={setCustomerYear}
                  style={{
                    height: 60,
                    color: '#1F2937',
                  }}
                  enabled={!isLoading}
                >
                  {yearOfStudy.map((item, index) => (
                    <Picker.Item
                      key={index}
                      label={item}
                      value={item}
                      color={index === 0 ? '#9CA3AF' : '#1F2937'}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">🔒 Password</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <View className="flex-row justify-between items-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password (min 6 characters)"
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

            {/* Confirm Password Field */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-2">🔐 Confirm Password</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <View className="flex-row justify-between items-center">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-900 text-base flex-1"
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    disabled={isLoading}
                    className="ml-2"
                  >
                    <Text className="text-yellow-600 font-semibold">
                      {isConfirmPasswordVisible ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              className="bg-yellow-400 rounded-xl py-4 shadow-md"
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#1F2937" size="small" />
              ) : (
                <Text className="text-gray-900 text-center font-bold text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </MotiView>

          {/* Login Link */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 800 }}
            className="bg-white rounded-2xl p-4 shadow-md border border-gray-100"
          >
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text className="text-yellow-600 font-bold text-base">Sign In</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Signup