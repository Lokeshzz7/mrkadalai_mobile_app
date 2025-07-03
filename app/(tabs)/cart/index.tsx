import React, { useState, useCallback, useEffect } from 'react'
import {
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native'
import { MotiView } from 'moti'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCart } from '../../../context/CartContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

interface TimeSlot {
    id: number;
    time: string;
    available: boolean;
    slot: string;
}

const Cart: React.FC = () => {
    const router = useRouter()
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [lastOrderCheck, setLastOrderCheck] = useState<string>('')
    
    // Use cart context
    const { 
        state: cartState, 
        fetchCartData, 
        updateItemQuantity, 
        removeItem,
        getTotalCartItems, 
        getItemQuantity,
        canAddMore,
        getTotalPrice,
        validateCartStock,
        refreshProducts
    } = useCart()

    const timeSlots: TimeSlot[] = [
        { id: 1, time: '11:00 AM - 12:00 PM', available: true, slot: 'SLOT_11_12' },
        { id: 2, time: '12:00 PM - 1:00 PM', available: true, slot: 'SLOT_12_13' },
        { id: 3, time: '1:00 PM - 2:00 PM', available: true, slot: 'SLOT_13_14' },
        { id: 4, time: '2:00 PM - 3:00 PM', available: true, slot: 'SLOT_14_15' },
        { id: 5, time: '3:00 PM - 4:00 PM', available: true, slot: 'SLOT_15_16' },
        { id: 6, time: '4:00 PM - 5:00 PM', available: true, slot: 'SLOT_16_17' }
    ]

    // Get category icon
    const getCategoryIcon = (category: string): string => {
        const iconMap: { [key: string]: string } = {
            'Starters': '🥗',
            'Meals': '🍛',
            'Beverages': '🥤',
            'Desserts': '🍰'
        }
        return iconMap[category] || '🍽️'
    }

    // Check if we need to refresh after order completion
    useEffect(() => {
        const checkOrderCompletion = async () => {
            try {
                const lastOrder = await AsyncStorage.getItem('lastOrderCompleted')
                if (lastOrder && lastOrder !== lastOrderCheck) {
                    setLastOrderCheck(lastOrder)
                    // Refresh cart and products after order completion
                    await Promise.all([
                        fetchCartData(),
                        refreshProducts()
                    ])
                    // Clear the flag
                    await AsyncStorage.removeItem('lastOrderCompleted')
                }
            } catch (error) {
                console.error('Error checking order completion:', error)
            }
        }
        
        checkOrderCompletion()
    }, [fetchCartData, refreshProducts, lastOrderCheck])

    // Fetch cart data when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchCartData()
            // Also validate current cart against latest stock
            validateCartStock()
        }, [fetchCartData, validateCartStock])
    )

    // Handle pull to refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([
                fetchCartData(),
                refreshProducts()
            ])
        } catch (error) {
            console.error('Error refreshing cart:', error)
        } finally {
            setRefreshing(false)
        }
    }, [fetchCartData, refreshProducts])

    // Handle quantity changes with enhanced stock validation
    // Handle quantity changes with corrected stock validation
const handleQuantityChange = useCallback(async (productId: number, change: number, product: CartProduct) => {
    const inventory = product.inventory
    const totalStock = inventory?.quantity || 0
    const reservedStock = inventory?.reserved || 0
    const currentQuantity = getItemQuantity?.(productId) ?? 0
    const newQuantity = currentQuantity + change

    const availableStock = Math.max(0, totalStock - reservedStock - currentQuantity)

    console.log(`Updating quantity for ${product.name}:`, {
        currentQuantity,
        newQuantity,
        totalStock,
        reservedStock,
        availableStock
    })

    if (change > 0 && availableStock <= 0) {
        Alert.alert('Stock Limit', `No more stock available for ${product.name}.`)
        return
    }

    if (newQuantity < 0) return

    try {
        const success = await updateItemQuantity(productId, change, product, availableStock)
        if (!success) {
            console.log('Update failed, refreshing cart...')
            await handleRefresh()
        }
    } catch (error) {
        console.error('Error updating quantity:', error)
        Alert.alert('Error', 'Failed to update quantity. Please try again.')
    }
}, [updateItemQuantity, getItemQuantity, handleRefresh])


const debugInventory = useCallback(() => {
    console.log('=== CART DEBUG INFO ===')
    cartState.cartData?.items.forEach(item => {
        const currentQuantity = getItemQuantity(item.productId)
        const totalStock = item.product.inventory?.quantity || 0
        const reservedStock = item.product.inventory?.reserved || 0
        const availableStock = Math.max(0, totalStock - reservedStock)
        
        console.log(`${item.product.name}:`)
        console.log(`  - Current in cart: ${currentQuantity}`)
        console.log(`  - Total stock: ${totalStock}`)
        console.log(`  - Reserved stock: ${reservedStock}`)
        console.log(`  - Available stock: ${availableStock}`)
        console.log(`  - Inventory object:`, item.product.inventory)
        console.log('---')
    })
    console.log('======================')
}, [cartState.cartData, getItemQuantity])

    // Remove item completely
    const removeItemCompletely = useCallback((productId: number) => {
        Alert.alert(
            'Remove Item',
            'Remove this item from cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeItem(productId)
                        } catch (error) {
                            console.error('Error removing item:', error)
                            Alert.alert('Error', 'Failed to remove item. Please try again.')
                        }
                    }
                }
            ]
        )
    }, [removeItem])

    const handleCheckout = useCallback(async () => {
        if (!cartState.cartData || cartState.cartData.items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart first')
            return
        }
        if (!selectedTimeSlot) {
            Alert.alert('Select Time Slot', 'Please select a delivery time slot')
            return
        }

        // Final stock validation before checkout
        try {
            const stockValid = await validateCartStock()
            if (!stockValid) {
                Alert.alert(
                    'Stock Updated',
                    'Some items in your cart are no longer available or have limited stock. Please review your cart.',
                    [
                        { text: 'OK', onPress: () => handleRefresh() }
                    ]
                )
                return
            }
        } catch (error) {
            console.error('Error validating stock:', error)
            Alert.alert(
                'Validation Error',
                'Unable to validate stock. Please try again.',
                [
                    { text: 'Retry', onPress: () => handleCheckout() },
                    { text: 'Cancel', style: 'cancel' }
                ]
            )
            return
        }

        const selectedSlot = timeSlots.find(slot => slot.id === selectedTimeSlot)
        
        // Set flag for order completion tracking
        await AsyncStorage.setItem('orderInProgress', 'true')
        
        router.push({
            pathname: '/(tabs)/cart/orderPayment',
            params: {
                cartData: JSON.stringify(cartState.cartData),
                selectedTimeSlot: selectedSlot?.slot || '',
                selectedTimeSlotDisplay: selectedSlot?.time || '',
                totalAmount: getTotalPrice().toFixed(2),
                totalItems: getTotalCartItems().toString()
            }
        })
    }, [cartState.cartData, selectedTimeSlot, getTotalPrice, getTotalCartItems, router, validateCartStock, handleRefresh])

const CartItem = React.memo<{ item: CartItem; index: number }>(({ item, index }) => {
    const inventory = item.product.inventory
const totalStock = inventory?.quantity || 0
const reservedStock = inventory?.reserved || 0
const cartQuantity = getItemQuantity(item.productId)

// 👇 Live remaining stock = total - reserved - current quantity in cart
const availableStock = Math.max(0, totalStock - reservedStock - cartQuantity)

// Stock status
const isOutOfStock = availableStock <= 0
const isLowStock = availableStock > 0 && availableStock <= 5
const canAddMoreItems = availableStock > 0

    
    // Debug log for troubleshooting
    console.log(`${item.product.name}:`, {
        totalStock,
        reservedStock, 
        canAddMoreItems
    })
    
    return (
        <View className="bg-white mx-4 mb-1 px-4 py-4 flex-row items-center">
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
                    
                    {/* 🔧 FIX: Stock Display - Show remaining stock */}
                    <View className="flex-row items-center">
                        {isOutOfStock ? (
                            <View className="bg-red-100 px-2 py-1 rounded-full mr-2">
                                <Text className="text-red-600 text-xs font-medium">Out of Stock</Text>
                            </View>
                        ) : isLowStock ? (
                            <View className="bg-orange-100 px-2 py-1 rounded-full mr-2">
                                <Text className="text-orange-600 text-xs font-medium">Low Stock</Text>
                            </View>
                        ) : (
                            <View className="bg-green-100 px-2 py-1 rounded-full mr-2">
                                <Text className="text-green-600 text-xs font-medium">In Stock</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text className="text-sm font-medium text-gray-700 mt-1">
                    Subtotal: ${(item.product.price * cartQuantity).toFixed(2)}
                </Text>
            </View>

            {/* Quantity Controls */}
            <View className="items-center">
                <View className="flex-row items-center bg-gray-100 rounded-full px-1 mb-2">
                    <TouchableOpacity
                        onPress={() => handleQuantityChange(item.productId, -1, item.product)}
                        className="w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                        activeOpacity={0.7}
                        disabled={cartQuantity <= 0}
                    >
                        <Text className="text-white font-bold text-lg">−</Text>
                    </TouchableOpacity>

                    <Text className="mx-4 text-lg font-semibold text-gray-900 min-w-8 text-center">
                        {cartQuantity}
                    </Text>

                    <TouchableOpacity
                        onPress={() => handleQuantityChange(item.productId, 1, item.product)}
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                            canAddMoreItems ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        activeOpacity={0.7}
                        disabled={!canAddMoreItems}
                    >
                        <Text className="text-white font-bold text-lg">+</Text>
                    </TouchableOpacity>
                </View>

                {/* Remove Item Button */}
                <TouchableOpacity
                    onPress={() => removeItemCompletely(item.productId)}
                    className="bg-red-100 px-3 py-1 rounded-full"
                >
                    <Text className="text-red-600 text-xs font-medium">Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
})
    // Memoized Time Slot Component
    const TimeSlotItem = React.memo<{ slot: TimeSlot; index: number }>(({ slot, index }) => (
        <TouchableOpacity
            onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
            activeOpacity={0.7}
            disabled={!slot.available}
        >
            <View
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
            </View>
        </TouchableOpacity>
    ))

    // Initial loading state
    if (cartState.loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FCD34D" />
                    <Text className="mt-4 text-gray-600">Loading cart...</Text>
                </View>
            </SafeAreaView>
        )
    }

    const cartItems = cartState.cartData?.items || []
    const totalAmount = getTotalPrice()
    const totalItems = getTotalCartItems()

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">Cart</Text>

                <View className="flex-row items-center">
                    <TouchableOpacity 
                        onPress={handleRefresh}
                        className="p-2 mr-2"
                        disabled={refreshing}
                    >
                        <Text className="text-lg">🔄</Text>
                    </TouchableOpacity>
                    <View className="bg-red-500 rounded-full min-w-6 h-6 items-center justify-center">
                        <Text className="text-white text-xs font-bold">
                            {totalItems}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 70 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#FCD34D']}
                        tintColor="#FCD34D"
                    />
                }
            >
                {/* Cart Summary */}
                <View className="mx-4 mt-6 mb-6">
                    <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
                            <View className="bg-yellow-100 px-3 py-1 rounded-full">
                                <Text className="text-yellow-800 text-sm font-medium">
                                    {totalItems} items
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                            <Text className="text-lg font-semibold text-gray-700">Total Amount</Text>
                            <Text className="text-2xl font-bold text-green-600">
                                ${totalAmount.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

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
                    <View className="mx-4 mb-6">
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
                    </View>
                )}

                {/* Delivery Time Selection */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mb-6">
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
                    </View>
                )}

                {/* Checkout Button */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mb-8">
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
                                    Proceed to Checkout • ${totalAmount.toFixed(2)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
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