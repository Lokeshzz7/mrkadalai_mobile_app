import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../utils/api'; // Assuming your standard API util

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOtp = async () => {
    setError('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Email address is required');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // POST to backend
      const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email: trimmedEmail }
      });

      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'If the email exists, an OTP has been sent successfully.',
      });

      // Pass the email to the next screen to avoid asking again
      router.push({
        pathname: '/auth/verify-otp',
        params: { email: trimmedEmail }
      });

    } catch (err: any) {
      console.error('Forgot Password detailed error:', err);
      const errorMessage = err.message || 'Something went wrong while sending the OTP.';
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 shadow-sm active:bg-gray-100"
            disabled={isLoading}
          >
             <Ionicons name="chevron-back" size={24} color="#374151" className="mr-0.5" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 pt-10">
          <Text className="text-3xl font-bold text-gray-900 mb-3">Forgot Password</Text>
          <Text className="text-gray-500 text-base mb-10 leading-6">
            Enter the email address associated with your account, and we'll send you a 6-digit verification code.
          </Text>

          {/* Email Input */}
          <View className="mb-8">
            <Text className="text-gray-700 text-sm font-bold mb-2 uppercase tracking-wider">
              Email Address
            </Text>
            <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError('');
                }}
                placeholder="registered@email.com"
                placeholderTextColor="#9CA3AF"
                className="text-gray-900 text-base"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
            {error ? <Text className="text-red-500 text-sm mt-2 ml-1 font-medium">{error}</Text> : null}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 shadow-md items-center justify-center ${isLoading ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'}`}
            onPress={handleSendOtp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#1F2937" size="small" />
            ) : (
              <Text className="text-gray-900 font-bold text-lg">Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
