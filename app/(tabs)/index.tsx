// RestaurantHome.tsx - Final layout and behavior adjustments

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import {
  FlatList,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native'

import { router } from 'expo-router'
import { apiRequest } from '../../utils/api'
import { useFocusEffect } from '@react-navigation/native'
import { useCart } from '../../context/CartContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { AppConfigContext } from '@/context/AppConfigContext'
import { useAuth } from '@/context/AuthContext'

// Types (keeping existing types)
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
  availableSlots: any;
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
  getAvailableStock: (product: Product) => number;
  canAddMore: (productId: number, product: Product) => boolean;
}

const DateCard = React.memo(({ date, index, isSelected, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={{ width: 80, marginRight: 12 }}>
    <View
      className={`px-3 py-3 rounded-2xl border-2 ${isSelected ? 'border-[#C1803F]' : 'border-gray-200'} ${isSelected ? 'bg-[#C1803F]' : 'bg-[#FFFFFF]'} shadow-sm`}
    >
      <Text className={`text-center text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>
        {date.day}
      </Text>
      <Text className={`text-center text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
        {date.date}
      </Text>
      <Text className={`text-center text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
        {date.month}
      </Text>
    </View>
  </TouchableOpacity>
))

const CategoryCard = React.memo(({ category, isSelected, onPress }: any) => (
  <TouchableOpacity onPress={onPress} className="mr-3">
    <View
      className={`px-6 py-3 rounded-full ${isSelected ? 'bg-yellow-400' : 'bg-gray-200'}`}
    >
      <View className="flex-row items-center">
        <Text className="text-lg mr-2">{category.icon}</Text>
        <Text className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
          {category.name}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
))

const FoodItemCard = React.memo(({
  item,
  getItemQuantity,
  onAddToCart,
  onQuantityChange,
  isProductAvailable,
  getAvailableStock,
  canAddMore
}: FoodItemCardProps) => {
  const isAvailable = isProductAvailable(item);
  const availableStock = getAvailableStock(item);
  const cartQuantity = getItemQuantity(item.id);
  const canAddMoreItems = canAddMore(item.id, item);
  const [expanded, setExpanded] = useState(false);

  const descriptionText = item.description || '';
  const isLongDescription = descriptionText.length > 80;
  const displayedDescription = expanded ? descriptionText : `${descriptionText.substring(0, 60)}`;

  return (
    <View
      className={`bg-white rounded-xl p-4 mb-5 shadow-sm border border-gray-200 ${!isAvailable ? 'opacity-60' : ''}`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-extrabold text-gray-900">{item.name}</Text>
          {isAvailable && availableStock <= 10 && (
            <Text className="text-red-500 text-sm font-medium mt-1">
              Only a few left - hurry up!
            </Text>
          )}
          <Text className="text-2xl font-extrabold text-black mt-2">
            ₹{item.price.toFixed(0)}
          </Text>
          {descriptionText && (
            <Text className="text-gray-600 text-base mt-2 leading-6">
              {displayedDescription}
              {!expanded && isLongDescription && '... '}
              {isLongDescription && (
                <Text
                  className="text-black font-bold"
                  onPress={() => setExpanded(!expanded)}
                >
                  {expanded ? ' Read Less' : 'Read More'}
                </Text>
              )}
            </Text>
          )}
        </View>

        <View className="w-36 items-center">
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-36 h-36 rounded-lg"
              resizeMode="cover"
            />
          )}
          {!isAvailable && (
            <View className="absolute top-0 left-0 w-36 h-36 bg-black/50 rounded-lg flex items-center justify-center">
              <Text className="text-white font-bold text-base">Out of Stock</Text>
            </View>
          )}
          <View className="absolute -bottom-3 w-32">
            {cartQuantity > 0 ? (
              <View className="flex-row items-center justify-between bg-green-600 rounded-lg shadow-lg">
                <TouchableOpacity
                  onPress={() => onQuantityChange(item, -1)}
                  className="px-4 py-2"
                >
                  <Text className="text-white font-bold text-2xl">-</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">{cartQuantity}</Text>
                <TouchableOpacity
                  onPress={() => onQuantityChange(item, 1)}
                  disabled={!canAddMoreItems}
                  className={`px-4 py-2 ${!canAddMoreItems ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-bold text-2xl">+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => onAddToCart(item)}
                disabled={!isAvailable || availableStock <= 0}
                className={`h-11 justify-center items-center rounded-lg shadow-lg ${isAvailable && availableStock > 0
                  ? 'bg-white border border-green-300'
                  : 'bg-gray-200'
                  }`}
              >
                <Text className={`font-bold text-base ${isAvailable && availableStock > 0
                  ? 'text-green-600'
                  : 'text-gray-500'
                  }`}
                >
                  {isAvailable && availableStock > 0 ? 'ADD' : 'OUT'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});


const RestaurantHome = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    fetchCartData,
    updateItemQuantity,
    getTotalCartItems,
    getItemQuantity,
    canAddMore,
    getAvailableStock
  } = useCart()

  const [dates, setDates] = useState<DateItem[]>([]);
  const { config } = useContext(AppConfigContext);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);
        const response = await apiRequest(`/customer/outlets/get-appdates/${outletId}`, {
          method: 'GET'
        });

        let dateArray = response.data || [];

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
        setDates(dateList);

        if (dateList.length > 0) {
          await AsyncStorage.setItem("Date", JSON.stringify(dateList[0]));
        }

      } catch (error) {
        console.error("Error fetching available dates:", error);
      }
    };

    fetchDates();
  }, [config.LIVE_COUNTER]);

  const categoryMapping = useMemo(() => ({
    'All': { id: 'all', name: 'All', icon: '🍽️' },
    'Starters': { id: 'starters', name: 'Starters', icon: '🥗' },
    'Meals': { id: 'meals', name: 'Meals', icon: '🍛' },
    'Beverages': { id: 'beverages', name: 'Beverages', icon: '🥤' },
    'Desserts': { id: 'desserts', name: 'Desserts', icon: '🍰' }
  }), [])

  const availableCategories = useMemo(() => {
    const categories = ['All']
    const productCategories = [...new Set(products.map(product => product.category))]
    categories.push(...productCategories)
    return categories.map(cat => categoryMapping[cat as keyof typeof categoryMapping]).filter(Boolean)
  }, [products, categoryMapping])

  const getCategoryIcon = useCallback((category: string) => {
    const iconMap: { [key: string]: string } = {
      'Starters': '🥗',
      'Meals': '🍛',
      'Beverages': '🥤',
      'Desserts': '🍰'
    }
    return iconMap[category] || '🍽️'
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const apiPromise = apiRequest('/customer/outlets/get-product/', {
        method: 'GET'
      })
      const response: ApiResponse = await apiPromise;

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

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useFocusEffect(
    useCallback(() => {
      fetchCartData()
      fetchProducts()
    }, [fetchCartData, fetchProducts])
  )

  const filteredProducts = useMemo(() => {
    return selectedCategory === 'All'
      ? products
      : products.filter(product => product.category === selectedCategory)
  }, [products, selectedCategory])

  const isProductAvailable = useCallback((product: Product) => {
    if (!product.inventory) return true
    return getAvailableStock(product) > 0
  }, [getAvailableStock])

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
    updateItemQuantity(product.id, 1, product)
  }, [isProductAvailable, updateItemQuantity])

  const handleQuantityChange = useCallback((product: Product, change: number) => {
    updateItemQuantity(product.id, change, product)
  }, [updateItemQuantity])

  const handleDateSelect = useCallback(async (date: any, index: number) => {
    setSelectedDate(index);
    try {
      AsyncStorage.setItem('Date', JSON.stringify(date));
    } catch (error) {
      console.error('Error saving date', error);
    }
  }, []);

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

  const StaticHeader = () => (
    <View className="bg-white pt-3 px-4">
      <View className="flex-row justify-between items-center pt-2">
        <Text className="text-2xl font-bold text-gray-900">
          {`Hello ${user?.name || "User"}`}
        </Text>
        <View className="flex-row items-center gap-3">
          {totalCartItems > 0 && (
            <TouchableOpacity
              className="flex-row items-center bg-yellow-400 px-4 py-2 rounded-full"
              onPress={() => router.push("/(tabs)/cart")}
              activeOpacity={0.8}
            >
              <Text className="text-black font-semibold mr-2">Cart</Text>
              <View className="bg-white rounded-full min-w-6 h-6 items-center justify-center">
                <Text className="text-black text-xs font-bold">
                  {totalCartItems}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="bg-yellow-400 px-4 py-2 rounded-full"
            onPress={() => router.push("/ticket/faq")}
          >
            <Text className="font-semibold text-gray-900">🎫 Faq</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="my-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {dates.map((date, index) => (
            <DateCard
              key={date.id}
              date={date}
              index={index}
              isSelected={selectedDate === index}
              onPress={() => handleDateSelect(date, index)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" >
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

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-gray-900">
          {selectedCategory === 'All' ? 'All Products' : selectedCategory}
        </Text>
        <Text className="text-sm text-gray-500">
          {filteredProducts.length} items
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StaticHeader />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <FoodItemCard
            item={item}
            index={index}
            getItemQuantity={getItemQuantity}
            onAddToCart={handleAddToCart}
            onQuantityChange={handleQuantityChange}
            getCategoryIcon={getCategoryIcon}
            isProductAvailable={isProductAvailable}
            getAvailableStock={getAvailableStock}
            canAddMore={canAddMore}
          />
        )}
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