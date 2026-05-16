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
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Feather as Icon } from '@expo/vector-icons';
import { apiRequest } from '../../utils/api';

const ResetPassword = () => {
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // POST to backend
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { email, otp, newPassword }
      });

      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Your password has been reset successfully.',
      });

      // Clear the stack and go to login
      router.replace('/auth/login');

    } catch (err: any) {
      console.error('Reset Password error details:', err);
      const errorMessage = err.message || 'Failed to securely reset password.';
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
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
        <View className="flex-1 px-6 pt-16">
          <Text className="text-3xl font-bold text-gray-900 mb-3">Create New Password</Text>
          <Text className="text-gray-500 text-base mb-10 leading-6">
            Your new password must be different from previous used passwords.
          </Text>

          {/* New Password */}
          <View className="mb-5">
            <Text className="text-gray-700 text-sm font-bold mb-2 uppercase tracking-wider">
              New Password
            </Text>
            <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${error && error.includes('characters') ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <View className="flex-row justify-between items-center">
                <TextInput
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    if (error) setError('');
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base flex-1"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="ml-2 p-1"
                >
                  <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-8">
            <Text className="text-gray-700 text-sm font-bold mb-2 uppercase tracking-wider">
              Confirm Password
            </Text>
            <View className={`bg-gray-50 rounded-xl px-4 py-4 border ${error && error.includes('match') ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <View className="flex-row justify-between items-center">
                <TextInput
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (error) setError('');
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base flex-1"
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  className="ml-2 p-1"
                >
                  <Icon name={isConfirmPasswordVisible ? 'eye' : 'eye-off'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            {error ? <Text className="text-red-500 text-sm mt-3 ml-1 font-medium">{error}</Text> : null}
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 shadow-md items-center justify-center ${
              isLoading ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'
            }`}
            onPress={handleReset}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#1F2937" size="small" />
            ) : (
              <Text className="text-gray-900 font-bold text-lg">Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;
