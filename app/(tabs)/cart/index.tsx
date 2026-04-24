import React, { useState, useCallback, useEffect, useContext, useMemo } from 'react'
import {
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { useCart } from '../../../context/CartContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { AppConfigContext } from '@/context/AppConfigContext';

// ... (Interface and CartItem/TimeSlotItem definitions remain the same) ...

// Types remain the same
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

interface CartItemProps {
    item: CartItem;
    getItemQuantity: (id: number) => number;
    getCategoryIcon: (category: string) => string;
    handleQuantityChange: (productId: number, change: number, product: CartProduct) => void;
    removeItemCompletely: (productId: number) => void;
}

interface TimeSlotItemProps {
    slot: TimeSlot;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

const CartItem = React.memo<CartItemProps>(({ item, getItemQuantity,
    getCategoryIcon,
    handleQuantityChange,
    removeItemCompletely }) => {
    const inventory = item.product.inventory
    const totalStock = inventory?.quantity || 0
    const reservedStock = inventory?.reserved || 0
    const cartQuantity = getItemQuantity(item.productId)
    const availableStock = Math.max(0, totalStock - reservedStock - cartQuantity)
    const canAddMoreItems = availableStock > 0

    return (
        <View className="bg-white mx-4 mb-3 p-4 rounded-2xl shadow-sm border border-gray-100">
            <View className="flex-row items-center">
                {/* Image Section */}
                <View className="mr-4">
                    {item.product.imageUrl ? (
                        <View className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden items-center justify-center border border-gray-100">
                            <Image
                                source={{ uri: item.product.imageUrl }}
                                style={{ width: 80, height: 80 }}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View className="w-20 h-20 bg-gray-50 rounded-xl items-center justify-center border border-gray-100">
                            <Text className="text-3xl">{getCategoryIcon(item.product.category)}</Text>
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                        <Text className="text-base font-bold text-gray-900 mb-1 flex-1 pr-2" numberOfLines={2}>
                            {item.product.name}
                        </Text>
                        <TouchableOpacity onPress={() => removeItemCompletely(item.productId)} className="p-1">
                            <Text className="text-red-500 font-bold">✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-xs font-medium text-gray-500 mb-2">
                        {item.product.category}
                    </Text>

                    <View className="flex-row items-center justify-between mt-auto">
                        <Text className="text-lg font-extrabold text-gray-900">
                            ₹{(item.product.price * cartQuantity).toFixed(2)}
                        </Text>
                        
                        {/* Quantity Controls */}
                        <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200 ml-2">
                            <TouchableOpacity
                                onPress={() => handleQuantityChange(item.productId, -1, item.product)}
                                className="px-3 py-1 items-center justify-center"
                                activeOpacity={0.6}
                            >
                                <Text className="text-gray-900 font-bold text-xl">−</Text>
                            </TouchableOpacity>

                            <Text className="px-1 text-base font-bold text-gray-900 min-w-[20px] text-center">
                                {cartQuantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() => handleQuantityChange(item.productId, 1, item.product)}
                                className="px-3 py-1 items-center justify-center"
                                activeOpacity={0.6}
                                disabled={!canAddMoreItems}
                            >
                                <Text className={`font-bold text-xl ${canAddMoreItems ? 'text-gray-900' : 'text-gray-300'}`}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
})

const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
        'Starters': '🥗',
        'Meals': '🍛',
        'Beverages': '🥤',
        'Desserts': '🍰'
    }
    return iconMap[category] || '🍽️'
}

const TimeSlotItem = React.memo<TimeSlotItemProps>(({ slot, isSelected, onSelect }) => (
    <TouchableOpacity
        onPress={() => slot.available && onSelect(slot.id)}
        activeOpacity={0.8}
        disabled={!slot.available}
        className={`m-1 mb-2 px-4 py-3 flex-grow items-center justify-center rounded-xl border ${
            !slot.available ? 'bg-gray-50 border-gray-200 opacity-60' :
            isSelected ? 'bg-yellow-400 border-yellow-500 shadow-sm' : 'bg-white border-gray-200 shadow-sm'
        }`}
    >
        <Text className={`text-sm font-bold ${
            !slot.available ? 'text-gray-400' :
            isSelected ? 'text-gray-900' : 'text-gray-700'
        }`}>
            {slot.time}
        </Text>
        {!slot.available && <Text className="text-xs text-gray-400 font-medium">Unavailable</Text>}
    </TouchableOpacity>
))


const Cart: React.FC = () => {
    const router = useRouter()
    const isFocused = useIsFocused();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null) 
    const [refreshing, setRefreshing] = useState(false)
    const [selectedDate, setSelectedDate] = useState<any>(null)
    const { config } = useContext(AppConfigContext);

    const {
        state: cartState,
        fetchCartData,
        updateItemQuantity,
        removeItem,
        getTotalCartItems,
        getItemQuantity,
        getTotalPrice,
        validateCartStock,
        refreshProducts
    } = useCart()


    useEffect(() => {
        const loadSelectedDate = async () => {
            try {
                const dateString = await AsyncStorage.getItem('Date')
                if (dateString) {
                    const date = JSON.parse(dateString)
                    setSelectedDate(date)
                }
            } catch (error) {
                console.error('Error loading selected date:', error)
            }
        }
        loadSelectedDate()
    }, [isFocused]) 

    const isTimeSlotPassed = useCallback((endHour: number): boolean => {
        if (!selectedDate) return false 

        const now = new Date()
        const selectedDateObj = new Date(selectedDate.fullDate)
        
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateToCheck = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
        
        if (dateToCheck.getTime() === today.getTime()) {
            const currentHour = now.getHours()
            return currentHour >= endHour
        }

        return false
    }, [selectedDate])

    const timeSlots: TimeSlot[] = useMemo(() => [
        { id: 1, time: '11:00 AM - 12:00 PM', available: !isTimeSlotPassed(12), slot: 'SLOT_11_12' },
        { id: 2, time: '12:00 PM - 1:00 PM', available: !isTimeSlotPassed(13), slot: 'SLOT_12_13' },
        { id: 3, time: '1:00 PM - 2:00 PM', available: !isTimeSlotPassed(14), slot: 'SLOT_13_14' },
        { id: 4, time: '2:00 PM - 3:00 PM', available: !isTimeSlotPassed(15), slot: 'SLOT_14_15' },
        { id: 5, time: '3:00 PM - 4:00 PM', available: !isTimeSlotPassed(16), slot: 'SLOT_15_16' },
        { id: 6, time: '4:00 PM - 5:00 PM', available: !isTimeSlotPassed(17), slot: 'SLOT_16_17' }
    ], [isTimeSlotPassed])


    // FIXED: Clear selectedTimeSlot and fetch cart data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const initializeCart = async () => {
                // Clear selected time slot every time the user enters the cart
                setSelectedTimeSlot(null); 

                const lastOrder = await AsyncStorage.getItem('lastOrderCompleted')

                if (lastOrder) {
                    await Promise.all([fetchCartData(), refreshProducts()])
                    await AsyncStorage.removeItem('lastOrderCompleted')
                } else {
                    await fetchCartData()
                }
            }

            initializeCart()
        }, [fetchCartData, refreshProducts])
    )

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([
                fetchCartData(),
                refreshProducts()
            ])
            // Ensure slots are re-evaluated based on new data
            setSelectedTimeSlot(null); 
        } catch (error) {
            console.error('Error refreshing cart:', error)
        } finally {
            setRefreshing(false)
        }
    }, [fetchCartData, refreshProducts])

    const handleQuantityChange = useCallback(async (productId: number, change: number, product: CartProduct) => {
        const inventory = product.inventory
        const totalStock = inventory?.quantity || 0
        const reservedStock = inventory?.reserved || 0
        const currentQuantity = getItemQuantity?.(productId) ?? 0
        const availableStock = Math.max(0, totalStock - reservedStock - currentQuantity)

        if (change > 0 && availableStock <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Stock Limit',
                text2: `No more stock available for ${product.name}.`,
                position: 'top',
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

        if (currentQuantity + change < 0) return

        try {
            await updateItemQuantity(productId, change, product, availableStock)
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update quantity. Please try again.',
                position: 'top',
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
        }
    }, [updateItemQuantity, getItemQuantity])

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
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to remove item. Please try again.',
                                position: 'top',
                                visibilityTime: 5000,
                                autoHide: true,
                                onPress: () => Toast.hide(),
                            });
                        }
                    }
                }
            ]
        )
    }, [removeItem])

    // Get the selected slot object and check availability
    const selectedSlotObject = timeSlots.find(slot => slot.id === selectedTimeSlot);
    const isSlotAvailable = selectedSlotObject?.available ?? false;

    const handleCheckout = useCallback(async () => {
        if (!cartState.cartData || cartState.cartData.items.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Empty Cart',
                text2: 'Please add items to your cart first',
                position: 'top',
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }
        
        // Enforce re-selection and availability check
        if (!selectedTimeSlot || !isSlotAvailable) { 
            Toast.show({
                type: 'error',
                text1: 'Select Time Slot',
                text2: 'Please select an available delivery time slot',
                position: 'top',
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

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
        await AsyncStorage.setItem('orderInProgress', 'true')

        const subtotalAmount = getTotalPrice()

        router.push({
            pathname: '/(tabs)/cart/orderPayment',
            params: {
                cartData: JSON.stringify(cartState.cartData),
                selectedTimeSlot: selectedSlot?.slot || '',
                selectedTimeSlotDisplay: selectedSlot?.time || '',
                subtotalAmount: subtotalAmount.toFixed(2),
                totalItems: getTotalCartItems().toString()
            }
        })
    }, [cartState.cartData, selectedTimeSlot, isSlotAvailable, getTotalPrice, getTotalCartItems, router, validateCartStock, handleRefresh, timeSlots])

    if (!isFocused) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#FCD34D" />
            </SafeAreaView>
        );
    }

    if (cartState.loading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FCD34D" />
                    <Text className="mt-4 text-gray-600 font-medium">Loading cart...</Text>
                </View>
            </SafeAreaView>
        )
    }

    // Filter out items with 0 quantity
    const cartItems = (cartState.cartData?.items || []).filter(item => {
        const quantity = getItemQuantity(item.productId)
        return quantity > 0
    })

    const totalItems = getTotalCartItems()
    const subtotal = getTotalPrice()

    // Combined checkout button disabled logic
    const isCheckoutDisabled = !(cartItems.length > 0 && selectedTimeSlot && isSlotAvailable);

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100 relative">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 shadow-sm active:bg-gray-100"
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color="#374151" className="mr-0.5" />
                </TouchableOpacity>

                <Text className="absolute left-0 right-0 text-center text-xl font-bold text-gray-900">My Cart</Text>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#FCD34D']}
                        tintColor="#FCD34D"
                    />
                }
            >
                {/* Cart Items */}
                {cartItems.length > 0 ? (
                    <View className="mt-4">
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                getItemQuantity={getItemQuantity}
                                getCategoryIcon={getCategoryIcon}
                                handleQuantityChange={handleQuantityChange}
                                removeItemCompletely={removeItemCompletely}
                            />
                        ))}
                    </View>
                ) : (
                    <View className="mx-4 mt-16 pb-8">
                        <View className="bg-gray-50 border border-gray-100 rounded-3xl p-8 items-center shadow-sm">
                            <View className="bg-white w-24 h-24 rounded-full items-center justify-center shadow-sm mb-6 pointer-events-none">
                                <Text className="text-5xl">🛒</Text>
                            </View>
                            <Text className="text-2xl font-extrabold text-gray-900 mb-2">Cart is empty</Text>
                            <Text className="text-gray-500 text-center mb-8 text-base">Looks like you haven't added any items to your cart yet.</Text>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="bg-yellow-400 px-8 py-4 rounded-xl shadow-sm w-full"
                            >
                                <Text className="font-bold text-gray-900 text-base text-center">Start Browsing Menu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Delivery Date Info */}
                {selectedDate && cartItems.length > 0 && (
                    <View className="mx-4 mt-4">
                        <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex-row items-center">
                            <Text className="text-2xl mr-3">🗓️</Text>
                            <View>
                                <Text className="text-sm font-medium text-gray-700">Ordering for:</Text>
                                <Text className="text-lg font-bold text-gray-900">
                                    {selectedDate.day}, {selectedDate.month} {selectedDate.date} 
                                    {selectedDate.fullDate && (new Date(selectedDate.fullDate).getTime() === new Date(new Date().setHours(0,0,0,0)).getTime()) ? ' (Today)' : ''}
                                </Text>
                                <Text className="text-xs text-red-500 font-medium mt-1">
                                    {isTimeSlotPassed(17) && "All Time slots are unavailable for Today"}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Delivery Time Selection */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mt-4">
                        <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <View className="flex-row items-center mb-4">
                                <Text className="text-lg font-bold text-gray-900">Select Time Slot</Text>
                            </View>

                            <View className="flex-row flex-wrap -mx-1">
                                {timeSlots.map((slot) => (
                                    <TimeSlotItem
                                        key={slot.id}
                                        slot={slot}
                                        isSelected={selectedTimeSlot === slot.id}
                                        onSelect={setSelectedTimeSlot}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Order Summary */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mt-4">
                        <View className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-lg font-bold text-gray-900">Bill Summary</Text>
                                <View className="bg-yellow-100 px-3 py-1 rounded-lg">
                                    <Text className="text-yellow-800 text-sm font-bold">
                                        {totalItems} items
                                    </Text>
                                </View>
                            </View>

                            <View className="space-y-3">
                                <View className="flex-row justify-between items-center py-2">
                                    <Text className="text-base text-gray-600">Item Total</Text>
                                    <Text className="text-base font-semibold text-gray-900">
                                        ₹{subtotal.toFixed(2)}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between items-center pt-3 border-t-2 border-gray-300">
                                    <Text className="text-lg font-bold text-gray-900">Total Amount</Text>
                                    <Text className="text-2xl font-extrabold text-black">
                                        ₹{subtotal.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Checkout Button */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mt-6 mb-4">
                        <TouchableOpacity
                            onPress={handleCheckout}
                            activeOpacity={0.8}
                            className={`rounded-xl p-4 shadow-lg ${!isCheckoutDisabled
                                ? 'bg-yellow-400'
                                : 'bg-gray-300'
                                }`}
                            disabled={isCheckoutDisabled}
                        >
                            <View className="items-center">
                                <Text className={`text-xl font-extrabold mb-1 ${!isCheckoutDisabled
                                    ? 'text-gray-900'
                                    : 'text-gray-500'
                                    }`}>
                                    Proceed to Payment
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className={`text-2xl font-extrabold ${!isCheckoutDisabled
                                        ? 'text-black'
                                        : 'text-gray-500'
                                        }`}>
                                        ₹{subtotal.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Security Info */}
                <View className="items-center mb-6">
                    <View className="flex-row items-center">
                        <Text className="text-lg mr-1">🔒</Text>
                        <Text className="text-gray-500 text-sm">Secure Checkout • Your payment is protected</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Cart