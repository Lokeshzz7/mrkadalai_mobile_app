import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react'
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
import { apiRequest } from '../../utils/api'
import { useFocusEffect } from '@react-navigation/native'
import { useCart } from '../../context/CartContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { AppConfigContext } from '@/context/AppConfigContext'

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
interface DateItem {
  id: number;
  day: string;
  date: number;
  month: string;
  fullDate: Date;
  availableSlots: any; // Or a more specific type if you know it
}

interface ApiResponse {
  products: Product[];
}

interface FoodItemCardProps {
  item: Product;
  index: number;
  getItemQuantity: (id: number) => number;
  onAddToCart: (product: Product) => void;
  onQuantityChange: (product: Product, change: number) => void;
  getCategoryIcon: (category: string) => string;
  isProductAvailable: (product: Product) => boolean;
}

const DateCard = React.memo(({ date, index, isSelected, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={{ width: 80, marginRight: 12 }}>

    <MotiView

      className={`px-3 py-3 rounded-2xl border-2 ${isSelected ? 'border-yellow-400' : 'border-gray-200'} ${isSelected ? 'bg-[#FCD34D]' : 'bg-[#FFFFFF]'} shadow-sm`}
    >
      <Text className={`text-center text-sm font-medium ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
        {date.day}
      </Text>
      <Text className={`text-center text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
        {date.date}
      </Text>
      <Text className={`text-center text-xs ${isSelected ? 'text-gray-700' : 'text-gray-500'}`}>
        {date.month}
      </Text>
    </MotiView>
  </TouchableOpacity>
))

// Memoized CategoryCard component
const CategoryCard = React.memo(({ category, isSelected, onPress }: any) => (
  <TouchableOpacity onPress={onPress} className="mr-3">
    <MotiView
      animate={{
        backgroundColor: isSelected ? '#FCD34D' : '#F9FAFB',
        scale: isSelected ? 1.05 : 1,
      }}
      transition={{ type: 'timing', duration: 200 }}
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
))

//  FIX: Enhanced FoodItemCard with better stock handling
const FoodItemCard = React.memo(({ item, index, getItemQuantity, onAddToCart, onQuantityChange, getCategoryIcon, isProductAvailable }: FoodItemCardProps) => {

  const isAvailable = isProductAvailable(item)
  const availableStock = item.inventory ? item.inventory.quantity : 0
  const cartQuantity = getItemQuantity(item.id)

  // ⭐ FIX: Better stock calculation
  const remainingStock = availableStock - cartQuantity
  const canAddMoreItems = remainingStock > 0 && isAvailable

  return (
    <View className={`bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100 ${!isAvailable ? 'opacity-60' : ''}`}>
      <View className="flex-row">
        <View className="flex-1 gap-3">
          <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
          {item.description && (
            <Text className="text-sm text-gray-600 mb-2">{item.description}</Text>
          )}
          <View className="flex-row items-center mb-2">
            <Text className="text-sm text-gray-500">
              {item.inventory ? `Stock: ${availableStock}${cartQuantity > 0 ? ` (${remainingStock} available)` : ''}` : 'Available'}
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

          {/* Cart Controls - INSTANT UPDATES, NO LOADING */}
          {cartQuantity > 0 ? (
            <View className="flex-row items-center bg-gray-100 rounded-full px-1">
              <TouchableOpacity
                onPress={() => onQuantityChange(item, -1)}
                className="w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold text-sm">−</Text>
              </TouchableOpacity>

              <Text className="mx-3 text-sm font-bold text-gray-900 min-w-6 text-center">
                {cartQuantity}
              </Text>

              <TouchableOpacity
                onPress={() => onQuantityChange(item, 1)}
                className={`w-8 h-8 rounded-full items-center justify-center ${canAddMoreItems ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                activeOpacity={0.7}
                disabled={!canAddMoreItems}
              >
                <Text className="text-white font-bold text-sm">+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className={`px-4 py-2 w-20 rounded-full items-center ${isAvailable ? 'bg-yellow-400' : 'bg-gray-300'
                }`}
              activeOpacity={0.7}
              disabled={!isAvailable}
              onPress={() => onAddToCart(item)}
            >
              <Text className={`font-semibold text-xs ${isAvailable ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {isAvailable ? 'Add' : 'Out'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
})

const RestaurantHome = () => {
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use cart context
  const {
    state: cartState,
    fetchCartData,
    updateItemQuantity,
    getTotalCartItems,
    getItemQuantity,
    canAddMore
  } = useCart()

  // Memoize dates to prevent re-calculation
  const [dates, setDates] = useState<DateItem[]>([]);
  const { config } = useContext(AppConfigContext);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);
        const response = await apiRequest(`/customer/outlets/get-appdates/${outletId}`, {
          method: 'GET'
        });

        console.log("Full API response:", response);

        let dateArray = response.data || []; // ✅ Correct

        // If LIVE_COUNTER is false, remove the first date
        if (!config.LIVE_COUNTER) {
          dateArray = dateArray.slice(1);
        }

        const dateList = dateArray.map((item: any, index: number) => {
          const dateObj = new Date(item.date);
          return {
            id: index,
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            date: dateObj.getDate(),
            month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
            fullDate: dateObj,
            availableSlots: item.availableSlots
          };
        });

        console.log("Processed dateList:", dateList); // ✅ Check processed dates

        setDates(dateList);

        if (dateList.length > 0) {
          await AsyncStorage.setItem("Date", JSON.stringify(dateList[0]));
          console.log("Default date saved:", dateList[0]);
        }

      } catch (error) {
        console.error("Error fetching available dates:", error);
      }
    };

    fetchDates();
  }, [config.LIVE_COUNTER]);




  // Category mapping with icons
  const categoryMapping = useMemo(() => ({
    'All': { id: 'all', name: 'All', icon: '🍽️' },
    'Starters': { id: 'starters', name: 'Starters', icon: '🥗' },
    'Meals': { id: 'meals', name: 'Meals', icon: '🍛' },
    'Beverages': { id: 'beverages', name: 'Beverages', icon: '🥤' },
    'Desserts': { id: 'desserts', name: 'Desserts', icon: '🍰' }
  }), [])

  // Get unique categories from products
  const availableCategories = useMemo(() => {
    const categories = ['All']
    const productCategories = [...new Set(products.map(product => product.category))]
    categories.push(...productCategories)
    return categories.map(cat => categoryMapping[cat as keyof typeof categoryMapping]).filter(Boolean)
  }, [products, categoryMapping])

  // Get category icon based on product category
  const getCategoryIcon = useCallback((category: string) => {
    const iconMap: { [key: string]: string } = {
      'Starters': '🥗',
      'Meals': '🍛',
      'Beverages': '🥤',
      'Desserts': '🍰'
    }
    return iconMap[category] || '🍽️'
  }, [])

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )

      const apiPromise = apiRequest('/customer/outlets/get-product/', {
        method: 'GET'
      })

      const response: ApiResponse = await Promise.race([apiPromise, timeoutPromise]) as ApiResponse

      if (response && response.products && Array.isArray(response.products)) {
        setProducts(response.products)
      } else if (response && Array.isArray(response)) {
        setProducts(response)
      } else {
        console.warn('Unexpected API response structure:', response)
        setProducts([])
      }

    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ⭐ FIX: Refresh both cart and products when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Refresh both cart data and product data (including stock)
      fetchCartData()
      fetchProducts() // This will get fresh stock data
    }, [fetchCartData, fetchProducts])
  )

  // Filter products based on selected category - memoized
  const filteredProducts = useMemo(() => {
    return selectedCategory === 'All'
      ? products
      : products.filter(product => product.category === selectedCategory)
  }, [products, selectedCategory])

  // Check if product is available (has stock)
  const isProductAvailable = useCallback((product: Product) => {
    if (!product.inventory) return true
    return product.inventory.quantity > 0
  }, [])

  // ⭐ FIX: Enhanced stock validation
  const validateStock = useCallback((product: Product, requestedQuantity: number) => {
    if (!product.inventory) return true

    const currentCartQuantity = getItemQuantity(product.id)
    const availableStock = product.inventory.quantity
    const totalAfterAdd = currentCartQuantity + requestedQuantity

    // Check if we have enough stock
    if (totalAfterAdd > availableStock) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient Stock',
        text2: `Only ${availableStock} items available. You already have ${currentCartQuantity} in cart.`,
        position: 'top',           // shows at the top
        visibilityTime: 5000,      // stays visible for 5 seconds
        autoHide: true,
        onPress: () => Toast.hide(), // tap to close
      });

      return false
    }

    return true
  }, [getItemQuantity])

  // ⭐ FIX: Enhanced add to cart with better validation
  const handleAddToCart = useCallback((product: Product) => {
    if (!isProductAvailable(product)) {
      Toast.show({
        type: 'error',
        text1: 'Out of Stock',
        text2: 'This item is currently out of stock.',
        position: 'top',
        topOffset: 200,
        visibilityTime: 5000,
        autoHide: true,
        onPress: () => Toast.hide(),
      });
      return
    }

    // Validate stock before adding
    if (!validateStock(product, 1)) {
      return
    }

    const availableStock = product.inventory?.quantity || 0
    updateItemQuantity(product.id, 1, product, availableStock)
  }, [isProductAvailable, validateStock, updateItemQuantity])

  // ⭐ FIX: Enhanced quantity changes with better validation
  const handleQuantityChange = useCallback((product: Product, change: number) => {
    if (change > 0) {
      // Validate stock before increasing
      if (!validateStock(product, change)) {
        return
      }
    }

    const availableStock = product.inventory?.quantity || 0
    updateItemQuantity(product.id, change, product, availableStock)
  }, [validateStock, updateItemQuantity])

  const handleDateSelect = useCallback(async (date: any, index: number) => {
    setSelectedDate(index);
    try {
      AsyncStorage.setItem('Date', JSON.stringify(date));
    } catch (error) {
      console.error('Error saving date', error);
    }
  }, []);

  // Memoized DateCard component


  // Loading component
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FCD34D" />
          <Text className="mt-4 text-gray-600">Loading products...</Text>
          <TouchableOpacity
            className="mt-4 bg-yellow-400 px-6 py-3 rounded-full"
            onPress={() => {
              setLoading(false)
              setProducts([])
            }}
          >
            <Text className="font-semibold text-gray-900">Skip Loading</Text>
          </TouchableOpacity>
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

  const totalCartItems = getTotalCartItems()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item, index }) => (
          <FoodItemCard
            item={item}
            index={index}
            getItemQuantity={getItemQuantity}
            onAddToCart={handleAddToCart}
            onQuantityChange={handleQuantityChange}
            getCategoryIcon={getCategoryIcon}
            isProductAvailable={isProductAvailable}
          />
        )}
        ListHeaderComponent={
          <>
            {/* --- All your header content now lives inside the FlatList --- */}
            <View className="bg-white mt-3">
              {/* Header with greeting, cart button, and FAQ button */}
              <View className="flex-row justify-between items-center px-4 pt-2">
                <Text className="text-2xl font-bold text-gray-900">
                  Hello Moto !
                </Text>
                <View className="flex-row items-center gap-3">
                  {/* Cart Button - Instant Updates */}
                  {totalCartItems > 0 && (
                    <TouchableOpacity
                      className="flex-row items-center bg-green-500 px-4 py-2 rounded-full"
                      onPress={() => router.push("/(tabs)/cart")}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-semibold mr-2">Cart</Text>
                      <View className="bg-white rounded-full min-w-6 h-6 items-center justify-center">
                        <Text className="text-green-500 text-xs font-bold">
                          {totalCartItems}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* FAQ Button */}
                  <TouchableOpacity
                    className="bg-yellow-400 px-4 py-2 rounded-full"
                    onPress={() => router.push("/ticket/faq")}
                  >
                    <Text className="font-semibold text-gray-900">🎫 Faq</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Selection */}
              <View className="my-6">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {dates.map((date, index) => (
                    <DateCard
                      key={date.id}
                      date={date}
                      index={index}
                      isSelected={selectedDate === index}
                      onPress={() => handleDateSelect(date, index)} // Using the memoized handler
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Categories Header */}
              <View className="flex-row justify-between items-center px-4 mb-4">
                <Text className="text-lg font-semibold text-gray-900">All Categoreis</Text>
                <TouchableOpacity>
                  <Text className="text-yellow-600 font-medium">See All</Text>
                </TouchableOpacity>
              </View>

              {/* Categories */}
              <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {availableCategories.map((category) => (
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
          </>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-gray-500 text-lg">No products available</Text>
            <Text className="text-gray-400 text-sm mt-2">
              {selectedCategory !== 'All' ? `No ${selectedCategory.toLowerCase()} found` : 'No products in this outlet'}
            </Text>
            <TouchableOpacity
              className="mt-4 bg-yellow-400 px-6 py-3 rounded-full"
              onPress={fetchProducts}
            >
              <Text className="font-semibold text-gray-900">Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  )
}

export default RestaurantHome