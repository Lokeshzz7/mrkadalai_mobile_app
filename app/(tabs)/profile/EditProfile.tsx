import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { apiRequest } from '../../../utils/api'
import Toast from 'react-native-toast-message'

const EditProfile = () => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [degree, setDegree] = useState('UG')
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    email: '',
    bio: '',
    yearOfStudy: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setInitialLoading(true)
      const response = await apiRequest('/customer/outlets/get-profile', {
        method: 'GET'
      })

      setName(response.name || '')
      setPhone(response.phone || '')
      setEmail(response.email || '')
      setBio(response.bio || '')
      setYearOfStudy(response.yearOfStudy?.toString() || '')
      setDegree(response.degree || 'UG')
    } catch (error) {
      console.error('Error fetching profile:', error)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile information',
        position: 'top',
        topOffset: 200,
        visibilityTime: 4000,
        autoHide: true,
        onPress: () => Toast.hide(),
      });
    } finally {
      setInitialLoading(false)
    }
  }

  const validateForm = () => {
    const errors = { name: '', phone: '', email: '', bio: '', yearOfStudy: '' }
    let isValid = true

    if (name.trim() === '') {
      errors.name = 'Name is required'
      isValid = false
    }

    if (email.trim() === '') {
      errors.email = 'Email is required'
      isValid = false
    }

    if (yearOfStudy.trim() === '') {
      errors.yearOfStudy = 'Year of study is required'
      isValid = false
    } else if (isNaN(parseInt(yearOfStudy))) {
      errors.yearOfStudy = 'Please enter a valid year'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSaveProfile = async () => {
    setFormErrors({ name: '', phone: '', email: '', bio: '', yearOfStudy: '' })

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const requestData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bio: bio.trim(),
        yearOfStudy: parseInt(yearOfStudy),
        degree: degree
      }

      await apiRequest('/customer/outlets/edit-profile', {
        method: 'PUT',
        body: requestData
      })

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
        onPress: () => {
          Toast.hide();
        },
        onHide: () => {
          router.back();
        },
      });

    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching ongoing orders:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to fetch ongoing orders. Please try again.',
          position: 'top',
          topOffset: 200,
          visibilityTime: 4000,
          autoHide: true,
          onPress: () => Toast.hide(),
        });
      } else {
        console.error('Unknown error:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unexpected error occurred.',
          position: 'top',       // shows at the top
          visibilityTime: 4000,  // stays visible for 4 seconds
          autoHide: true,
          onPress: () => Toast.hide(), // hide toast when pressed
        });
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
        <Text className="text-lg text-gray-600 mt-4">Loading profile...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity
          className="p-2"
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>

        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${isLoading ? 'bg-gray-300' : 'bg-yellow-400'}`}
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          <Text className="text-gray-900 font-semibold">
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 py-8">
          {/* Header */}
          <View
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="items-center mb-10 mt-6"
          >
            <View className="w-24 h-24 bg-yellow-400 rounded-full items-center justify-center mb-6 shadow-md">
              <Text className="text-4xl">👤</Text>
            </View>
            <Text
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              className="text-gray-900 text-3xl font-bold mb-2"
            >
              Edit Profile
            </Text>
            <Text
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              className="text-gray-600 text-base"
            >
              Update your personal information
            </Text>
          </View>

          {/* Form Container */}
          <View
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6"
          >
            {/* Name Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">👤 Full Name</Text>
              <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text)
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: '' }))
                    }
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  autoCapitalize="words"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {formErrors.name ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">❌ {formErrors.name}</Text>
              ) : null}
            </View>

            {/* Phone Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📞 Phone Number</Text>
              <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                <TextInput
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text)
                    if (formErrors.phone) {
                      setFormErrors(prev => ({ ...prev, phone: '' }))
                    }
                  }}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  keyboardType="phone-pad"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {formErrors.phone ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">❌ {formErrors.phone}</Text>
              ) : null}
            </View>

            {/* Email Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📧 Email Address</Text>
              <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }))
                    }
                  }}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  autoCapitalize="none"
                  keyboardType="default"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {formErrors.email ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">❌ {formErrors.email}</Text>
              ) : null}
            </View>

            {/* Bio Field */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📝 Bio</Text>
              <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.bio ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                <TextInput
                  value={bio}
                  onChangeText={(text) => {
                    setBio(text)
                    if (formErrors.bio) {
                      setFormErrors(prev => ({ ...prev, bio: '' }))
                    }
                  }}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {formErrors.bio ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">❌ {formErrors.bio}</Text>
              ) : null}
            </View>

            {/* Degree Selection */}
            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-semibold mb-2">🎓 Degree</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  className={`flex-1 px-4 py-4 rounded-xl border ${degree === 'UG'
                    ? 'bg-yellow-400 border-yellow-400'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                  onPress={() => setDegree('UG')}
                  disabled={isLoading}
                >
                  <Text className={`text-center font-semibold ${degree === 'UG' ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                    UG
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 px-4 py-4 rounded-xl border ${degree === 'PG'
                    ? 'bg-yellow-400 border-yellow-400'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                  onPress={() => setDegree('PG')}
                  disabled={isLoading}
                >
                  <Text className={`text-center font-semibold ${degree === 'PG' ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                    PG
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Year of Study Field */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-semibold mb-2">📚 Year of Study</Text>
              <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${formErrors.yearOfStudy ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                <TextInput
                  value={yearOfStudy}
                  onChangeText={(text) => {
                    setYearOfStudy(text)
                    if (formErrors.yearOfStudy) {
                      setFormErrors(prev => ({ ...prev, yearOfStudy: '' }))
                    }
                  }}
                  placeholder="Enter your current year of study"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  keyboardType="numeric"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {formErrors.yearOfStudy ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">❌ {formErrors.yearOfStudy}</Text>
              ) : null}
            </View>

            {/* Update Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 shadow-md ${isLoading ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'}`}
              onPress={handleSaveProfile}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#1F2937" size="small" />
                  <Text className="text-gray-700 ml-2 font-semibold">Updating...</Text>
                </View>
              ) : (
                <Text className="text-gray-900 text-center font-bold text-lg">
                  🚀 Update Profile
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default EditProfile