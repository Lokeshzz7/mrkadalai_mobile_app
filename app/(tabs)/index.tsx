import React, { useState, useEffect } from 'react'
import {
  FlatList,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { router } from 'expo-router'
import { apiRequest } from '../../utils/api' // Adjust path as needed

// Types
interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: 'Meals' | 'Starters' | 'Desserts' | 'Beverages';
  inventory?: {
    quantity: number;
    reserved: number;
  };
}

interface ApiResponse {
  products: Product[];
}

const RestaurantHome = () => {
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Category mapping with icons
  const categoryMapping = {
    'All': { id: 'all', name: 'All', icon: '🍽️' },
    'Starters': { id: 'starters', name: 'Starters', icon: '🥗' },
    'Meals': { id: 'meals', name: 'Meals', icon: '🍛' },
    'Beverages': { id: 'beverages', name: 'Beverages', icon: '🥤' },
    'Desserts': { id: 'desserts', name: 'Desserts', icon: '🍰' }
  }

  // Get unique categories from products
  const getAvailableCategories = () => {
    const availableCategories = ['All']
    const productCategories = [...new Set(products.map(product => product.category))]
    availableCategories.push(...productCategories)
    return availableCategories.map(cat => categoryMapping[cat as keyof typeof categoryMapping])
  }

  // Get category icon based on product category
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Starters': '🥗',
      'Meals': '🍛',
      'Beverages': '🥤',
      'Desserts': '🍰'
    }
    return iconMap[category] || '🍽️'
  }

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response: ApiResponse = await apiRequest('/customer/outlets/get-product/', {
        method: 'GET'
      })
      setProducts(response.products)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      Alert.alert('Error', 'Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory)

  // Check if product is available (has stock)
  const isProductAvailable = (product: Product) => {
    if (!product.inventory) return true // If no inventory data, assume available
    const availableStock = product.inventory.quantity
    return availableStock > 0
  }

  const DateCard = ({ date, index, isSelected, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={{ width: '27%' }}>
      <MotiView
        animate={{
          backgroundColor: isSelected ? '#FCD34D' : '#FFFFFF',
          scale: isSelected ? 1.05 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 100,
        }}
        className={`px-3 py-3 rounded-2xl border-2 ${isSelected ? 'border-yellow-400' : 'border-gray-200'} shadow-sm`}
      >
        <Text
          className={`text-center text-sm font-medium ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}
        >
          {date.day}
        </Text>
        <Text
          className={`text-center text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}
        >
          {date.date}
        </Text>
        <Text
          className={`text-center text-xs ${isSelected ? 'text-gray-700' : 'text-gray-500'}`}
        >
          {date.month}
        </Text>
      </MotiView>
    </TouchableOpacity>
  )

  const CategoryCard = ({ category, isSelected, onPress }: any) => (
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
        className={`px-6 py-3 rounded-full border ${isSelected ? 'border-yellow-400' : 'border-gray-200'}`}
      >
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">{category.icon}</Text>
          <Text className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
            {category.name}
          </Text>
        </View>
      </MotiView>
    </TouchableOpacity>
  )

  const FoodItemCard = ({ item, index }: { item: Product; index: number }) => {
    const isAvailable = isProductAvailable(item)
    const availableStock = item.inventory ? item.inventory.quantity : 0

    return (
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: 300,
          delay: index * 100,
        }}
        className={`bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100 ${!isAvailable ? 'opacity-60' : ''}`}
      >
        <View className="flex-row">
          <View className="flex-1 gap-3">
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
            {item.description && (
              <Text className="text-sm text-gray-600 mb-2">{item.description}</Text>
            )}
            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-gray-500">
                {item.inventory ? `Stock: ${availableStock}` : 'Available'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-yellow-600">
                ${item.price.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View className="flex flex-col gap-4">
            <View className="w-20 h-20 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
              <Text className="text-3xl">{getCategoryIcon(item.category)}</Text>
            </View>

            <TouchableOpacity 
              className={`px-4 py-2 w-20 rounded-full items-center ${
                isAvailable ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
              disabled={!isAvailable}
            >
              <Text className={`font-semibold ${
                isAvailable ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {isAvailable ? 'Add' : 'Out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </MotiView>
    )
  }

  // Loading component
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FCD34D" />
          <Text className="mt-4 text-gray-600">Loading products...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error component
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity 
            className="bg-yellow-400 px-6 py-3 rounded-full"
            onPress={fetchProducts}
          >
            <Text className="font-semibold text-gray-900">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Fixed Header Section */}
      <View className="bg-white mt-3">
        {/* Header with greeting and FAQ button */}
        <View className="flex-row justify-between px-4 pt-2">
          <MotiText className="text-2xl font-bold text-gray-900">
            <Text>Hello Moto !</Text>
          </MotiText>
          <TouchableOpacity 
            className="bg-yellow-400 px-4 py-2 rounded-full"
            onPress={() => router.push("/ticket/faq")}
          >
            <Text className="font-semibold text-gray-900">🎫 Faq</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View className="my-6">
          <View className="flex-row justify-between px-4">
            {dates.map((date, index) => (
              <DateCard
                key={date.id}
                date={date}
                index={index}
                isSelected={selectedDate === index}
                onPress={() => setSelectedDate(index)}
              />
            ))}
          </View>
        </View>

        {/* Categories Header */}
        <View className="flex-row justify-between items-center px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900">All Categories</Text>
          <TouchableOpacity>
            <Text className="text-yellow-600 font-medium">See All</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {getAvailableCategories().map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.name}
                onPress={() => setSelectedCategory(category.name)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Section Title */}
        <View className="flex-row justify-between items-center px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </Text>
          <Text className="text-sm text-gray-500">
            {filteredProducts.length} items
          </Text>
        </View>
      </View>

      {/* Scrollable Products Section */}
      {filteredProducts.length > 0 ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {filteredProducts.map((item, index) => (
            <FoodItemCard key={item.id} item={item} index={index} />
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">No products available</Text>
          <Text className="text-gray-400 text-sm mt-2">
            {selectedCategory !== 'All' ? `No ${selectedCategory.toLowerCase()} found` : 'No products in this outlet'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

export default RestaurantHome