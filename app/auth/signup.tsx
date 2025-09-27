import React, { useEffect, useState } from 'react'
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
import { Picker } from '@react-native-picker/picker'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import Toast from 'react-native-toast-message'
import { images } from '@/constants/images'
import Icon from 'react-native-vector-icons/Feather'
import { apiRequest } from '@/utils/api'

const { width } = Dimensions.get('window')

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
  const [collegeList, setCollegeList] = useState<string[]>(['Select your college'])
  const [outletMap, setOutletMap] = useState<{ [name: string]: number }>({});
  const [isCollegeLoading, setIsCollegeLoading] = useState(false)


  // const collegeList = ['Select your college', 'CIT', 'REC']

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setIsCollegeLoading(true)
        const data = await apiRequest('/customer/get-outlets/', {
          method: 'GET',
        })
        // Assuming API returns { outlets: [{ id, name, ... }] }
        if (data?.outlets && Array.isArray(data.outlets)) {
          // console.log('Fetched outlets:', data.outlets);
          const names = data.outlets.map((outlet: any) => outlet.name)
          setCollegeList(['Select your college', ...names])

          const map: { [name: string]: number } = {};
          data.outlets.forEach((outlet: any) => {
            map[outlet.name] = outlet.id;
          });
          setOutletMap(map);
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error: any) {
        console.error('Error fetching college list:', error)
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Colleges',
          text2: error.message || 'Please try again later',
          position: 'top',
        })
      } finally {
        setIsCollegeLoading(false)
      }
    }

    fetchColleges()
  }, [])

  const yearOfStudy = ['Select your year', '1 year', '2 year', '3 year', '4 year']

  const handleSignup = async () => {
    if (
      name.trim() === '' ||
      email.trim() === '' ||
      phoneNumber.trim() === '' ||
      college === '' ||
      college === 'Select your college' ||
      customerYear === '' ||
      customerYear === 'Select your year' ||
      password.trim() === '' ||
      confirmPassword.trim() === ''
    ) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      })
      return
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      })
      return
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters long',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      })
      return
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phoneNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      })
      return
    }

    const outletId = outletMap[college];
    if (!outletId) {
      Toast.show({
        type: 'error',
        text1: 'Invalid College',
        text2: 'Please select a valid college',
        position: 'top',
      });
      return;
    }

    try {
      await signup(
        name,
        email,
        phoneNumber,
        outletId,
        customerYear,
        password,
        confirmPassword
      )

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Account created successfully!',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
      })
    } catch (error: any) {
      console.error('Signup error in component:', error)

      let errorTitle = 'Signup Failed'
      let errorMessage = 'Could not create account. Please try again.'
      let shouldClearEmail = false

      if (error.message) {
        if (
          error.message.toLowerCase().includes('user already exists') ||
          error.message.toLowerCase().includes('email already exists')
        ) {
          errorTitle = 'Account Already Exists'
          errorMessage =
            'An account with this email already exists. Please try signing in instead.'
          shouldClearEmail = true
        } else if (error.message.toLowerCase().includes('invalid email')) {
          errorTitle = 'Invalid Email'
          errorMessage = 'Please check your email address and try again.'
        } else if (
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('connection')
        ) {
          errorTitle = 'Connection Error'
          errorMessage = 'Please check your internet connection and try again.'
        } else if (error.message.toLowerCase().includes('server')) {
          errorTitle = 'Server Error'
          errorMessage = 'Server is temporarily unavailable. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }

      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        onHide: () => {
          if (shouldClearEmail) {
            setEmail('')
            setPassword('')
            setConfirmPassword('')
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
          {/* Header with semicircle */}
          <View className="items-center">
            <Image
              source={images.Login_Illustration}
              style={{ width: width, height: (width / 2) / 2 }}
              resizeMode="contain"
            />
          </View>

          {/* Header Text */}
          <View
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="items-center mb-10 mt-8"
          >
            <Text
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              className="text-white text-3xl font-bold mb-2"
            >
              Create Account
            </Text>
            <Text
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              className="text-gray-600 text-base text-center"
            >
              Join us and discover amazing food experiences
            </Text>
          </View>

          {/* Form + Login Link Container */}
          <View
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6 mx-4"
          >
            {/* Full Name Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-lg font-bold mb-2"> Full Name</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  autoCapitalize="words"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-lg font-bold mb-2"> Email Address</Text>
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
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Number Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-lg font-bold mb-2"> Phone Number</Text>
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
              <Text className="text-gray-700 text-lg font-bold mb-2"> College</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <Picker
                  selectedValue={college}
                  onValueChange={setCollege}
                  style={{ height: 60, color: '#1F2937' }}
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
              <Text className="text-gray-700 text-lg font-bold mb-2"> Year of Study</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <Picker
                  selectedValue={customerYear}
                  onValueChange={setCustomerYear}
                  style={{ height: 60, color: '#1F2937' }}
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
              <Text className="text-gray-700 text-lg font-bold mb-2"> Password</Text>
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
            </View>

            {/* Confirm Password Field */}
            <View className="mb-6">
              <Text className="text-gray-700 text-lg font-bold mb-2"> Confirm Password</Text>
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
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    disabled={isLoading}
                    className="ml-2 p-1"
                  >
                    <Icon
                      name={isConfirmPasswordVisible ? 'eye' : 'eye-off'}
                      size={20}
                      color="#374151"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 shadow-md ${isLoading ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'
                }`}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#1F2937" size="small" />
                  <Text className="text-gray-700 ml-2 font-semibold">Creating Account...</Text>
                </View>
              ) : (
                <Text className="text-gray-900 text-center font-bold text-lg"> Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link (merged inside same card) */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600 text-base">Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text className="text-yellow-600 font-bold text-base">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Signup
