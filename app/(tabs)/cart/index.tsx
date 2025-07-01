import React, { useState, useEffect, useCallback } from 'react'
import {
    FlatList,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { useRouter } from 'expo-router'
import { apiRequest } from '../../../utils/api' // Adjust path as needed
import { useFocusEffect } from '@react-navigation/native'

// Types
interface CartProduct {
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

interface CartItem {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
    product: CartProduct;
}

interface CartData {
    id: number;
    customerId: number;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}

const Cart = () => {
    const router = useRouter()
    
    const [cartData, setCartData] = useState<CartData | null>(null)
    const [loading, setLoading] = useState(true)
    const [updatingItem, setUpdatingItem] = useState<number | null>(null)
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)

    const timeSlots = [
        { id: 1, time: '11:00 AM - 12:00 PM', available: true },
        { id: 2, time: '12:00 PM - 1:00 PM', available: true },
        { id: 3, time: '1:00 PM - 2:00 PM', available: false },
        { id: 4, time: '2:00 PM - 3:00 PM', available: true },
        { id: 5, time: '3:00 PM - 4:00 PM', available: true },
        { id: 6, time: '4:00 PM - 5:00 PM', available: true }
    ]

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

    // Fetch cart data from API using your updated API structure
    const fetchCartData = async () => {
        try {
            setLoading(true)
            const response = await apiRequest('/customer/outlets/get-cart', {
                method: 'GET'
            })
            
            if (response.cart) {
                setCartData(response.cart)
            } else {
                setCartData(null)
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            // If cart doesn't exist or error occurs, set empty cart
            setCartData(null)
        } finally {
            setLoading(false)
        }
    }

    // Use focus effect to refresh cart when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchCartData()
        }, [])
    )

    // Update quantity using your backend API structure
    const updateQuantity = async (productId: number, change: number) => {
        if (!cartData) return
        
        const currentItem = cartData.items.find(item => item.productId === productId)
        if (!currentItem) return

        const newQuantity = currentItem.quantity + change
        
        try {
            setUpdatingItem(productId)
            
            if (newQuantity <= 0) {
                // Remove all items of this product
                await apiRequest('/customer/outlets/update-cart-item', {
                    method: 'PUT',
                    body: {
                        productId,
                        quantity: currentItem.quantity, // Remove all quantity
                        action: 'remove'
                    }
                })
            } else if (change > 0) {
                // Add quantity
                await apiRequest('/customer/outlets/update-cart-item', {
                    method: 'PUT',
                    body: {
                        productId,
                        quantity: Math.abs(change),
                        action: 'add'
                    }
                })
            } else {
                // Remove quantity (but not all)
                await apiRequest('/customer/outlets/update-cart-item', {
                    method: 'PUT',
                    body: {
                        productId,
                        quantity: Math.abs(change),
                        action: 'remove'
                    }
                })
            }
            
            // Refresh cart data after successful update
            await fetchCartData()
        } catch (error) {
            console.error('Error updating quantity:', error)
            Alert.alert('Error', 'Failed to update item quantity. Please try again.')
        } finally {
            setUpdatingItem(null)
        }
    }

    // Remove item completely from cart
    const removeItemCompletely = async (productId: number) => {
        const currentItem = cartData?.items.find(item => item.productId === productId)
        if (!currentItem) return

        try {
            setUpdatingItem(productId)
            
            await apiRequest('/customer/outlets/update-cart-item', {
                method: 'PUT',
                body: {
                    productId,
                    quantity: currentItem.quantity, // Remove all quantity
                    action: 'remove'
                }
            })
            
            // Refresh cart data
            await fetchCartData()
        } catch (error) {
            console.error('Error removing item:', error)
            Alert.alert('Error', 'Failed to remove item from cart')
        } finally {
            setUpdatingItem(null)
        }
    }

    const calculateTotal = () => {
        if (!cartData) return 0
        return cartData.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    }

    const calculateTotalItems = () => {
        if (!cartData) return 0
        return cartData.items.reduce((total, item) => total + item.quantity, 0)
    }

    const handleCheckout = () => {
        if (!cartData || cartData.items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart first')
            return
        }
        if (!selectedTimeSlot) {
            Alert.alert('Select Time Slot', 'Please select a delivery time slot')
            return
        }

        // Navigate to OrderPayment page
        router.push('/(tabs)/cart/orderPayment')
    }

    const CartItem = ({ item, index }: { item: CartItem; index: number }) => {
        const isUpdating = updatingItem === item.productId
        const isAvailable = item.product.inventory ? item.product.inventory.quantity > 0 : true

        return (
            <MotiView
                from={{ opacity: 0, translateX: -50 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                    type: 'timing',
                    duration: 300,
                    delay: index * 100,
                }}
                className="bg-white mx-4 mb-1 px-4 py-4 flex-row items-center"
            >
                {/* Food Icon */}
                <View className="w-16 h-16 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
                    <Text className="text-2xl">{getCategoryIcon(item.product.category)}</Text>
                </View>

                {/* Item Details */}
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {item.product.name}
                    </Text>
                    {item.product.description && (
                        <Text className="text-sm text-gray-600 mb-2">
                            {item.product.description}
                        </Text>
                    )}
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-green-600">
                            ${item.product.price.toFixed(2)}
                        </Text>
                        {item.product.inventory && (
                            <Text className="text-xs text-gray-500">
                                Stock: {item.product.inventory.quantity}
                            </Text>
                        )}
                    </View>
                    <Text className="text-sm font-medium text-gray-700 mt-1">
                        Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                </View>

                {/* Quantity Controls */}
                <View className="items-center">
                    <View className="flex-row items-center bg-gray-100 rounded-full px-1 mb-2">
                        <TouchableOpacity
                            onPress={() => updateQuantity(item.productId, -1)}
                            className="w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                            activeOpacity={0.7}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">−</Text>
                            )}
                        </TouchableOpacity>

                        <Text className="mx-4 text-lg font-semibold text-gray-900 min-w-8 text-center">
                            {item.quantity}
                        </Text>

                        <TouchableOpacity
                            onPress={() => updateQuantity(item.productId, 1)}
                            className="w-8 h-8 bg-green-500 rounded-full items-center justify-center"
                            activeOpacity={0.7}
                            disabled={isUpdating || !isAvailable}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">+</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Remove Item Button */}
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                'Remove Item',
                                `Remove ${item.product.name} from cart?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Remove', 
                                        style: 'destructive',
                                        onPress: () => removeItemCompletely(item.productId)
                                    }
                                ]
                            )
                        }}
                        className="bg-red-100 px-3 py-1 rounded-full"
                        disabled={isUpdating}
                    >
                        <Text className="text-red-600 text-xs font-medium">Remove</Text>
                    </TouchableOpacity>
                </View>
            </MotiView>
        )
    }

    const TimeSlotItem = ({ slot, index }: any) => (
        <TouchableOpacity
            onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
            activeOpacity={0.7}
            disabled={!slot.available}
        >
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                    type: 'timing',
                    duration: 300,
                    delay: index * 50,
                }}
                className={`mx-4 mb-2 px-4 py-3 rounded-2xl border-2 ${selectedTimeSlot === slot.id
                    ? 'bg-yellow-100 border-yellow-400'
                    : slot.available
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-100 border-gray-200'
                    }`}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className={`w-4 h-4 rounded-full mr-3 ${selectedTimeSlot === slot.id
                            ? 'bg-yellow-500'
                            : slot.available
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                            }`} />
                        <Text className={`text-base font-medium ${slot.available ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                            {slot.time}
                        </Text>
                    </View>
                    {!slot.available && (
                        <Text className="text-sm text-red-500 font-medium">Unavailable</Text>
                    )}
                </View>
            </MotiView>
        </TouchableOpacity>
    )

    // Loading state
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FCD34D" />
                    <Text className="mt-4 text-gray-600">Loading cart...</Text>
                </View>
            </SafeAreaView>
        )
    }

    const cartItems = cartData?.items || []

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">Cart</Text>

                <View className="flex-row items-center">
                    <View className="bg-red-500 rounded-full min-w-6 h-6 items-center justify-center mr-2">
                        <Text className="text-white text-xs font-bold">
                            {calculateTotalItems()}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 70 }}
            >
                {/* Cart Summary */}
                <MotiView
                    from={{ opacity: 0, translateY: -30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600 }}
                    className="mx-4 mt-6 mb-6"
                >
                    <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
                            <View className="bg-yellow-100 px-3 py-1 rounded-full">
                                <Text className="text-yellow-800 text-sm font-medium">
                                    {calculateTotalItems()} items
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                            <Text className="text-lg font-semibold text-gray-700">Total Amount</Text>
                            <Text className="text-2xl font-bold text-green-600">
                                ${calculateTotal().toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Cart Items */}
                {cartItems.length > 0 ? (
                    <View className="bg-white rounded-2xl mx-4 mb-6 shadow-md border border-gray-100 overflow-hidden">
                        {cartItems.map((item, index) => (
                            <View key={item.id}>
                                <CartItem item={item} index={index} />
                                {index < cartItems.length - 1 && (
                                    <View className="h-px bg-gray-200 mx-4" />
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 600 }}
                        className="mx-4 mb-6"
                    >
                        <View className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 items-center">
                            <Text className="text-6xl mb-4">🛒</Text>
                            <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
                            <Text className="text-gray-600 text-center mb-4">Add some delicious items to get started!</Text>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="bg-yellow-400 px-6 py-3 rounded-full"
                            >
                                <Text className="font-semibold text-gray-900">Browse Menu</Text>
                            </TouchableOpacity>
                        </View>
                    </MotiView>
                )}

                {/* Delivery Time Selection */}
                {cartItems.length > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: 30 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 600, delay: 400 }}
                        className="mx-4 mb-6"
                    >
                        <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <View className="flex-row items-center mb-4">
                                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                    <Text className="text-lg">🕐</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">Select Delivery Time</Text>
                            </View>

                            <Text className="text-gray-600 mb-4">Choose your preferred delivery time slot</Text>

                            {timeSlots.map((slot, index) => (
                                <TimeSlotItem key={slot.id} slot={slot} index={index} />
                            ))}
                        </View>
                    </MotiView>
                )}

                {/* Checkout Button */}
                {cartItems.length > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: 30 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 600, delay: 600 }}
                        className="mx-4 mb-8"
                    >
                        <TouchableOpacity
                            onPress={handleCheckout}
                            activeOpacity={0.8}
                            className={`rounded-2xl p-4 shadow-md ${cartItems.length > 0 && selectedTimeSlot
                                ? 'bg-yellow-400'
                                : 'bg-gray-300'
                                }`}
                        >
                            <View className="flex-row items-center justify-center">
                                <Text className="text-xl">🛍️</Text>
                                <Text className={`text-lg font-bold ml-2 ${cartItems.length > 0 && selectedTimeSlot
                                    ? 'text-gray-900'
                                    : 'text-gray-500'
                                    }`}>
                                    Proceed to Checkout • ${calculateTotal().toFixed(2)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </MotiView>
                )}

                {/* Security Info */}
                <View className="items-center pb-8">
                    <Text className="text-gray-500 text-sm">Secure Checkout</Text>
                    <Text className="text-gray-400 text-xs mt-1">🔒 Your payment is protected</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Cart