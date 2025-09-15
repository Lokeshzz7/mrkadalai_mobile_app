// import { Text, View, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native'

// import React from 'react'

// // Importing the custom authentication context to access user and logout functionality
// import { useAuth } from '@/context/AuthContext'

// // Importing icons from the project’s constants
// import { icons } from '@/constants/icons'

// // Importing theme colors
// import Colors from '@/constants/theme/colors'

// const index = () => {

//   const { user, logout } = useAuth()

//   return (
//     // SafeAreaView makes sure the UI doesn’t overlap with system status bars or notches
//     <SafeAreaView className="flex-1 bg-background">

//       <ScrollView className="flex-1">
//         <View className="p-6 pb-24">

//           {/* ------------------- Profile Header ------------------- */}
//           <View className="items-center justify-center mb-8">
//             {/* User’s profile avatar circle (shows first letter of name or "?" if unknown) */}
//             <View className="bg-button_color rounded-full size-24 items-center justify-center mb-4">
//               <Text className="text-3xl font-bold text-dark-200">
//                 {/* Displays the first character of the user's name or '?' as fallback */}
//                 {user?.name ? user.name.charAt(0) : "?"}
//               </Text>
//             </View>

//             {/* Display the user's full name or "User" if not available */}
//             <Text className="text-pritext text-2xl font-bold">{user?.name || "User"}</Text>

//             {/* Display the user's email or default placeholder */}
//             <Text className="text-pritext text-base">{user?.email || "user@example.com"}</Text>
//           </View>

//           {/* ------------------- Profile Options ------------------- */}
//           <View className="bg-background rounded-xl overflow-hidden mb-6">

//             {/* ---- Edit Profile Button ---- */}
//             <TouchableOpacity
//               className="flex-row items-center p-4 border-b border-[#1a1a2e]"
//               onPress={() => console.log('Edit Profile')} // Action when button is pressed
//             >
//               {/* Person Icon */}
//               <Image
//                 source={icons.person}
//                 className="size-6 mr-4"
//                 tintColor={Colors.button_color}
//               />
//               {/* Option label */}
//               <Text className="text-pritext text-lg flex-1">Edit Profile</Text>
//               {/* Right arrow indicating navigation */}
//               <Text className="text-pritext">→</Text>
//             </TouchableOpacity>

//             {/* ---- Notification Settings Button ---- */}
//             <TouchableOpacity
//               className="flex-row items-center p-4 border-b border-[#1a1a2e]"
//               onPress={() => console.log('Notification Settings')}
//             >
//               {/* Notification Icon */}
//               <Image
//                 source={icons.save}
//                 className="size-6 mr-4"
//                 tintColor={Colors.button_color}
//               />
//               <Text className="text-pritext text-lg flex-1">Notification Settings</Text>
//               <Text className="text-pritext">→</Text>
//             </TouchableOpacity>

//             {/* ---- App Settings Button ---- */}
//             <TouchableOpacity
//               className="flex-row items-center p-4"
//               onPress={() => console.log('App Settings')}
//             >
//               {/* Settings/Search Icon */}
//               <Image
//                 source={icons.search}
//                 className="size-6 mr-4"
//                 tintColor={Colors.button_color}
//               />
//               <Text className="text-pritext text-lg flex-1">App Settings</Text>
//               <Text className="text-pritext">→</Text>
//             </TouchableOpacity>
//           </View>

//           {/* ------------------- Logout Button ------------------- */}
//           <TouchableOpacity
//             className="bg-red-500 rounded-full py-4 mt-4 mb-10"
//             onPress={logout} // Calls the logout function from AuthContext
//           >
//             <Text className="text-white text-center font-bold text-lg">Logout</Text>
//           </TouchableOpacity>

//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

// export default index



import React, { useState, useEffect } from 'react'
import {
  FlatList,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '../../../utils/api'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'

const Profile = () => {
  const { user, logout } = useAuth()

  const [userDetails, setUserDetails] = useState({
    name: '',
    phone: '',
    email: '',
    bio: '',
    yearOfStudy: 0,
    degree: '',
    profileImage: '👤'
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/customer/outlets/get-profile', {
        method: 'GET'
      })

      setUserDetails({
        name: response.name || '',
        phone: response.phone || '',
        email: response.email || '',
        bio: response.bio || '',
        yearOfStudy: response.yearOfStudy || 0,
        degree: response.degree || '',
        profileImage: '👤'
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile information',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
        onPress: () => Toast.hide(),
      });
    } finally {
      setLoading(false)
    }
  }

  const profileMenuItems = [
    {
      id: 1,
      title: 'Profile Info',
      icon: '👤',
      description: 'Edit your personal information',
      hasNotification: false,
      action: 'edit_profile'
    },
    {
      id: 3,
      title: 'Cart',
      icon: '🛒',
      description: 'View items in your cart',
      action: 'cart'
    },
    {
      id: 6,
      title: 'FAQ',
      icon: '❓',
      description: 'Frequently asked questions',
      hasNotification: false,
      action: 'faq'
    },
    {
      id: 7,
      title: 'Settings',
      icon: '⚙️',
      description: 'App settings and preferences',
      hasNotification: false,
      action: 'settings'
    }
  ]

  const handleMenuItemPress = (item: any) => {
    switch (item.action) {
      case 'edit_profile':
        router.push('/profile/EditProfile')
        break
      case 'cart':
        router.push('/cart')
        break
      case 'faq':
        router.push('/ticket/faq')
        break
      case 'settings':
        Toast.show({
          type: 'error',
          text1: 'Settings',
          text2: 'Settings will be available soon',
          position: 'top',
          visibilityTime: 4000,
          autoHide: true,
          onPress: () => Toast.hide(),
        });
        break
      default:
        Toast.show({
          type: 'error',
          text1: item.title,
          text2: `Navigate to ${item.title} page`,
          position: 'top',
          visibilityTime: 4000,
          autoHide: true,
          onPress: () => Toast.hide(),
        });
    }
  }
  

  const ProfileMenuItem = ({ item, index }: any) => (
    <TouchableOpacity
      onPress={() => handleMenuItemPress(item)}
      activeOpacity={0.7}
    >
      <MotiView
        from={{ opacity: 0, translateX: -50 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{
          type: 'timing',
          duration: 300,
          delay: index * 100,
        }}
        className="bg-white mx-4 mb-1 px-4 py-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center mr-4">
            <Text className="text-xl">{item.icon}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {item.title}
            </Text>
            <Text className="text-sm text-gray-600">
              {item.description}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {item.hasNotification && (
            <View className="bg-red-500 rounded-full min-w-6 h-6 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">
                {item.notificationCount}
              </Text>
            </View>
          )}
          <Text className="text-gray-400 text-lg">→</Text>
        </View>
      </MotiView>

      {index < profileMenuItems.length - 1 && (
        <View className="h-px bg-gray-200 mx-4" />
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Loading profile...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900">Profile</Text>

        <View className="flex-row">
          {/* <TouchableOpacity
            className="p-1"
            onPress={() => handleHeaderButtonPress('more')}
          >
            <Text className="text-3xl">⋮</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        {/* User Profile Card */}
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          className="mx-4 mt-6 mb-6"
        >
          <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <View className="flex-row items-center">
              <View className="w-20 h-20 bg-yellow-400 rounded-full items-center justify-center mr-4">
                <Text className="text-4xl">{userDetails.profileImage}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {userDetails.name || 'User Name'}
                </Text>
                <Text className="text-gray-600 text-base mb-1">
                  📞 {userDetails.phone || 'Phone not provided'}
                </Text>
                <Text className="text-gray-600 text-base">
                  📧 {userDetails.email || 'Email not provided'}
                </Text>
                {userDetails.bio && (
                  <Text className="text-gray-600 text-sm mt-2">
                    {userDetails.bio}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row justify-around mt-6 pt-4 border-t border-gray-100">
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">127</Text>
                <Text className="text-sm text-gray-600">Orders</Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">45</Text>
                <Text className="text-sm text-gray-600">Reviews</Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">4.8</Text>
                <Text className="text-sm text-gray-600">Rating</Text>
              </View>
            </View>

            {userDetails.degree && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-sm text-gray-600">
                  🎓 {userDetails.degree} - Year {userDetails.yearOfStudy}
                </Text>
              </View>
            )}
          </View>
        </MotiView>

        {/* Menu Items */}
        <View className="bg-white rounded-2xl mx-4 mb-6 shadow-md border border-gray-100 overflow-hidden">
          {profileMenuItems.map((item, index) => (
            <ProfileMenuItem key={item.id} item={item} index={index} />
          ))}
        </View>

        {/* Account Actions */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 800 }}
          className="mx-4 mb-6"
        >
          <View className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <TouchableOpacity
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={logout}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-xl">🚪</Text>
                </View>
                <Text className="text-lg font-semibold text-red-600">
                  Logout
                </Text>
              </View>
              <Text className="text-gray-400 text-lg">→</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Profile