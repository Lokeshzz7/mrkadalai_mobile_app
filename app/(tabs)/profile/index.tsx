import { Text, View, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native'

import React from 'react'

// Importing the custom authentication context to access user and logout functionality
import { useAuth } from '@/context/AuthContext'

// Importing icons from the project’s constants
import { icons } from '@/constants/icons'

// Importing theme colors
import Colors from '@/constants/theme/colors'

const index = () => {

  const { user, logout } = useAuth()

  return (
    // SafeAreaView makes sure the UI doesn’t overlap with system status bars or notches
    <SafeAreaView className="flex-1 bg-background">

      <ScrollView className="flex-1">
        <View className="p-6 pb-24">

          {/* ------------------- Profile Header ------------------- */}
          <View className="items-center justify-center mb-8">
            {/* User’s profile avatar circle (shows first letter of name or "?" if unknown) */}
            <View className="bg-button_color rounded-full size-24 items-center justify-center mb-4">
              <Text className="text-3xl font-bold text-dark-200">
                {/* Displays the first character of the user's name or '?' as fallback */}
                {user?.name ? user.name.charAt(0) : "?"}
              </Text>
            </View>

            {/* Display the user's full name or "User" if not available */}
            <Text className="text-pritext text-2xl font-bold">{user?.name || "User"}</Text>

            {/* Display the user's email or default placeholder */}
            <Text className="text-pritext text-base">{user?.email || "user@example.com"}</Text>
          </View>

          {/* ------------------- Profile Options ------------------- */}
          <View className="bg-background rounded-xl overflow-hidden mb-6">

            {/* ---- Edit Profile Button ---- */}
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-[#1a1a2e]"
              onPress={() => console.log('Edit Profile')} // Action when button is pressed
            >
              {/* Person Icon */}
              <Image
                source={icons.person}
                className="size-6 mr-4"
                tintColor={Colors.button_color}
              />
              {/* Option label */}
              <Text className="text-pritext text-lg flex-1">Edit Profile</Text>
              {/* Right arrow indicating navigation */}
              <Text className="text-pritext">→</Text>
            </TouchableOpacity>

            {/* ---- Notification Settings Button ---- */}
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-[#1a1a2e]"
              onPress={() => console.log('Notification Settings')}
            >
              {/* Notification Icon */}
              <Image
                source={icons.save}
                className="size-6 mr-4"
                tintColor={Colors.button_color}
              />
              <Text className="text-pritext text-lg flex-1">Notification Settings</Text>
              <Text className="text-pritext">→</Text>
            </TouchableOpacity>

            {/* ---- App Settings Button ---- */}
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => console.log('App Settings')}
            >
              {/* Settings/Search Icon */}
              <Image
                source={icons.search}
                className="size-6 mr-4"
                tintColor={Colors.button_color}
              />
              <Text className="text-pritext text-lg flex-1">App Settings</Text>
              <Text className="text-pritext">→</Text>
            </TouchableOpacity>
          </View>

          {/* ------------------- Logout Button ------------------- */}
          <TouchableOpacity
            className="bg-red-500 rounded-full py-4 mt-4 mb-10"
            onPress={logout} // Calls the logout function from AuthContext
          >
            <Text className="text-white text-center font-bold text-lg">Logout</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default index
