import React, { useState, useRef } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../utils/api';

const VerifyOtp = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setError('');
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      // POST to backend
      await apiRequest('/auth/verify-reset-otp', {
        method: 'POST',
        body: { email, otp: trimmedOtp }
      });

      Toast.show({
        type: 'success',
        text1: 'Verified',
        text2: 'Code accepted! Please set a new password.',
      });

      // Pass email AND verified OTP to reset screen
      router.push({
        pathname: '/auth/reset-password',
        params: { email, otp: trimmedOtp }
      });

    } catch (err: any) {
      console.error('Verify OTP error:', err);
      // Give visual error feedback
      setError(err.message || 'The code you entered is incorrect or expired.');
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: err.message || 'Invalid or expired OTP.',
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
          <Text className="text-3xl font-bold text-gray-900 mb-3">Verification Code</Text>
          <Text className="text-gray-500 text-base mb-10 leading-6">
            We have sent a 6-digit verification code to <Text className="font-bold text-gray-800">{email}</Text>.
          </Text>

          <View className="mb-8">
            <Text className="text-gray-700 text-sm font-bold mb-2 uppercase tracking-wider text-center">
              Enter 6-Digit Code
            </Text>
            <View className={`bg-gray-50 rounded-xl px-4 py-4 border items-center ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <TextInput
                value={otp}
                onChangeText={(t) => {
                  // Only allow numbers
                  const numeric = t.replace(/[^0-9]/g, '');
                  setOtp(numeric);
                  if (error) setError('');
                }}
                placeholder="000000"
                placeholderTextColor="#D1D5DB"
                className="text-gray-900 text-4xl font-extrabold tracking-[15px] text-center"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                autoFocus
              />
            </View>
            {error ? <Text className="text-red-500 text-sm mt-3 font-medium text-center">{error}</Text> : null}
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 shadow-md items-center justify-center ${
              isLoading || otp.length < 6 ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'
            }`}
            onPress={handleVerify}
            disabled={isLoading || otp.length < 6}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#1F2937" size="small" />
            ) : (
              <Text className="text-gray-900 font-bold text-lg">Verify Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOtp;
