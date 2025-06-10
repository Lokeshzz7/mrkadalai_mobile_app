import React, { useState } from 'react'
import {
  FlatList,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { MotiView, MotiText } from 'moti'

const RestaurantHome = () => {
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Generate dates for today + 2 days
  const getDates = () => {
    const dates = []
    for (let i = 0; i < 3; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push({
        id: i,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date
      })
    }
    return dates
  }

  const dates = getDates()

  const categories = [
    { id: 'all', name: 'All', icon: '🍽️' },
    { id: 'starters', name: 'Starters', icon: '🥗' },
    { id: 'meals', name: 'Meals', icon: '🍛' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' }
  ]

  const foodItems = [
    { id: 1, name: 'Caesar Salad', category: 'starters', price: '$12.99', image: '🥗', rating: 4.5, time: '10-15 min' },
    { id: 2, name: 'Chicken Wings', category: 'starters', price: '$8.99', image: '🍗', rating: 4.3, time: '15-20 min' },
    { id: 3, name: 'Grilled Chicken', category: 'meals', price: '$18.99', image: '🍖', rating: 4.7, time: '25-30 min' },
    { id: 4, name: 'Beef Burger', category: 'meals', price: '$15.99', image: '🍔', rating: 4.6, time: '20-25 min' },
    { id: 5, name: 'Pasta Carbonara', category: 'meals', price: '$16.99', image: '🍝', rating: 4.4, time: '20-25 min' },
    { id: 6, name: 'Fresh Orange Juice', category: 'beverages', price: '$4.99', image: '🧃', rating: 4.2, time: '5 min' },
    { id: 7, name: 'Iced Coffee', category: 'beverages', price: '$3.99', image: '☕', rating: 4.5, time: '5 min' },
    { id: 8, name: 'Smoothie Bowl', category: 'beverages', price: '$7.99', image: '🥤', rating: 4.3, time: '10 min' },
    { id: 9, name: 'Bruschetta', category: 'starters', price: '$9.99', image: '🍞', rating: 4.1, time: '10-15 min' },
    { id: 10, name: 'Fish & Chips', category: 'meals', price: '$19.99', image: '🍟', rating: 4.8, time: '25-30 min' }
  ]

  const filteredFoodItems = selectedCategory === 'All'
    ? foodItems
    : foodItems.filter(item => item.category === selectedCategory.toLowerCase())

  const DateCard = ({ date, index, isSelected, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <MotiView
        animate={{
          backgroundColor: isSelected ? '#FCD34D' : '#FFFFFF',
          scale: isSelected ? 1.05 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
        className={`mx-2 px-4 py-3 rounded-2xl border-2 ${isSelected ? 'border-yellow-400' : 'border-gray-200'
          } shadow-sm`}
      >
        <Text className={`text-center text-sm font-medium ${isSelected ? 'text-gray-800' : 'text-gray-600'
          }`}>
          {date.day}
        </Text>
        <Text className={`text-center text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'
          }`}>
          {date.date}
        </Text>
        <Text className={`text-center text-xs ${isSelected ? 'text-gray-700' : 'text-gray-500'
          }`}>
          {date.month}
        </Text>
      </MotiView>
    </TouchableOpacity>
  )

  const CategoryCard = ({ category, isSelected, onPress }) => (
    <TouchableOpacity onPress={onPress} className="mr-3">
      <MotiView
        animate={{
          backgroundColor: isSelected ? '#FCD34D' : '#F9FAFB',
          scale: isSelected ? 1.05 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
        className={`px-6 py-3 rounded-full border ${isSelected ? 'border-yellow-400' : 'border-gray-200'
          }`}
      >
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">{category.icon}</Text>
          <Text className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'
            }`}>
            {category.name}
          </Text>
        </View>
      </MotiView>
    </TouchableOpacity>
  )

  const FoodItemCard = ({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 300,
        delay: index * 100,
      }}
      className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100"
    >
      <View className="flex-row">
        <View className="w-20 h-20 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
          <Text className="text-3xl">{item.image}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-yellow-500 mr-1">⭐</Text>
            <Text className="text-sm text-gray-600 mr-3">{item.rating}</Text>
            <Text className="text-sm text-gray-500">🕒 {item.time}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-yellow-600">{item.price}</Text>
            <TouchableOpacity className="bg-yellow-400 px-4 py-2 rounded-full">
              <Text className="font-semibold text-gray-900">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MotiView>
  )

  return (
    <SafeAreaView className="flex-1 bg-white  p-4">


      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-end px-4 pt-2">
          <TouchableOpacity className="bg-yellow-400 px-4 py-2 rounded-full">
            <Text className="font-semibold text-gray-900">🎫 Ticket</Text>
          </TouchableOpacity>
        </View>
        <MotiView
          from={{ opacity: 0, translateX: -50 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          className="px-4 pt-4 pb-6"
        >
          <MotiText className="text-2xl font-bold text-gray-900">
            Hey Sandy, Good afternoon! 👋
          </MotiText>
          <Text className="text-gray-600 mt-1">What would you like to order today?</Text>
        </MotiView>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            Select Date
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
            {dates.map((date, index) => (
              <DateCard
                key={date.id}
                date={date}
                index={index}
                isSelected={selectedDate === index}
                onPress={() => setSelectedDate(index)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Categories Header */}
        <View className="flex-row justify-between items-center px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900">All Categories</Text>
          <TouchableOpacity>
            <Text className="text-yellow-600 font-medium">See All</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.name}
                onPress={() => setSelectedCategory(category.name)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Food Items */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            {selectedCategory === 'All' ? 'Popular Items' : selectedCategory}
          </Text>
          {filteredFoodItems.map((item, index) => (
            <FoodItemCard key={item.id} item={item} index={index} />
          ))}
        </View>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  )
}

export default RestaurantHome