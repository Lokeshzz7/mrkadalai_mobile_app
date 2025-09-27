import React, { useState, useCallback, useEffect } from 'react'
import {
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
    FlatList
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { useCart } from '../../../context/CartContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiRequest } from '../../../utils/api' // Import your API utility
import Toast from 'react-native-toast-message'
import { useContext } from 'react';
import { AppConfigContext } from '@/context/AppConfigContext';


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

interface Coupon {
    id: number;
    code: string;
    description: string;
    rewardValue: number;
    minOrderValue: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    usageLimit: number;
    usedCount: number;
}

interface AppliedCoupon {
    code: string;
    discount: number;
    description: string;
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

interface CouponItemProps {
    coupon: Coupon;
    onApply: (code: string) => void;
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

    const isOutOfStock = availableStock <= 0
    const isLowStock = availableStock > 0 && availableStock <= 5
    const canAddMoreItems = availableStock > 0

    console.log(`${item.product.name}:`, {
        totalStock,
        reservedStock,
        canAddMoreItems
    })

    return (
        <View className="bg-white mx-4 mb-1 px-4 py-4 flex-row items-center">
            <View className="w-16 h-16 bg-yellow-100 rounded-2xl items-center justify-center mr-4 overflow-hidden">
                {item.product.imageUrl ? (
                    <Image
                        source={{ uri: item.product.imageUrl }}
                        style={{ width: 64, height: 64, borderRadius: 16 }}
                        resizeMode="cover"
                    />
                ) : (
                    <Text className="text-2xl">{getCategoryIcon(item.product.category)}</Text>
                )}
            </View>

            <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {item.product.name}
                </Text>
                {/* {item.product.description && (
                    <Text className="text-sm text-gray-600 mb-2 " numberOfLines={2}>
                        {item.product.description}
                    </Text>
                )} */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-green-600">
                        ₹{item.product.price.toFixed(2)}
                    </Text>

                    {/* <View className="flex-row items-center">
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
                    </View> */}
                </View>
                <Text className="text-sm font-medium text-gray-700 mt-1">
                    Subtotal: ₹{(item.product.price * cartQuantity).toFixed(2)}
                </Text>
            </View>

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
                        className={`w-8 h-8 rounded-full items-center justify-center ${canAddMoreItems ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                        activeOpacity={0.7}
                        disabled={!canAddMoreItems}
                    >
                        <Text className="text-white font-bold text-lg">+</Text>
                    </TouchableOpacity>
                </View>

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

// Coupon Item Component
const CouponItem = React.memo<CouponItemProps>(({ coupon, onApply }) => (
    <TouchableOpacity
        onPress={() => onApply(coupon.code)}
        className="bg-gradient-to-r from-purple-50 to-pink-50 mb-2 p-4 rounded-2xl border border-purple-200"
        activeOpacity={0.7}
    >
        <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <Text className="text-lg font-bold text-purple-700">{coupon.code}</Text>
                    <View className="bg-purple-100 px-2 py-1 rounded-full ml-2">
                        <Text className="text-purple-600 text-xs font-medium">
                            {coupon.rewardValue < 1 ? `${(coupon.rewardValue * 100)}% OFF` : `$${coupon.rewardValue} OFF`}
                        </Text>
                    </View>
                </View>
                <Text className="text-sm text-gray-600 mb-1">{coupon.description}</Text>
                <Text className="text-xs text-gray-500">Min order: ${coupon.minOrderValue}</Text>
            </View>
            <Text className="text-purple-600 text-lg">🎫</Text>
        </View>
    </TouchableOpacity>
))

// Memoized Time Slot Component
const TimeSlotItem = React.memo<TimeSlotItemProps>(({ slot, isSelected, onSelect }) => (
    <TouchableOpacity
        onPress={() => slot.available && onSelect(slot.id)}
        activeOpacity={0.7}
        disabled={!slot.available}
    >
        <View
            className={`mx-4 mb-2 px-4 py-3 rounded-2xl border-2 ${isSelected
                ? 'bg-yellow-100 border-yellow-400'
                : slot.available
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-100 border-gray-200'
                }`}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className={`w-4 h-4 rounded-full mr-3 ${isSelected
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

const Cart: React.FC = () => {
    const router = useRouter()
    const isFocused = useIsFocused();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [lastOrderCheck, setLastOrderCheck] = useState<string>('')

    // Coupon related states
    const [couponCode, setCouponCode] = useState<string>('')
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
    const [couponLoading, setCouponLoading] = useState<boolean>(false)
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
    const [showCoupons, setShowCoupons] = useState<boolean>(false)
    const { config } = useContext(AppConfigContext);


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

    // Fetch available coupons
    const fetchCoupons = useCallback(async () => {
        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);
        try {
            const coupons = await apiRequest(`/customer/outlets/coupons/${outletId}`, {
                method: 'GET'
            })
            console.log("coupons : ", coupons);
            setAvailableCoupons(coupons?.coupons ?? [])
        } catch (error) {
            console.error('Error fetching coupons:', error)
        }
    }, [])

    // Apply coupon
    const applyCoupon = useCallback(async (code: string) => {
        if (!code.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter a coupon code',
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);

        setCouponLoading(true)
        try {
            const currentTotal = getTotalPrice()


            console.log(outletId)
            const response = await apiRequest('/customer/outlets/apply-coupon', {
                method: 'POST',
                body: {
                    code: code,
                    currentTotal,
                    outletId
                }
            })

            // Find the coupon details for description
            const couponDetails = availableCoupons.find(c => c.code.toUpperCase() === code.toUpperCase())

            setAppliedCoupon({
                code: code,
                discount: response.discount,
                description: couponDetails?.description || 'Discount Applied'
            })

            setCouponCode('')
            setShowCoupons(false)
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: `Coupon applied successfully! You saved $${response.discount.toFixed(2)}`,
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Coupon Error',
                text2: error.message || 'Failed to apply coupon',
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            console.error(outletId);
            console.error('Error applying coupon:', error)
        } finally {
            setCouponLoading(false)
        }
    }, [getTotalPrice, cartState.cartData, availableCoupons])



    // Remove applied coupon
    const removeCoupon = useCallback(() => {
        console.log('Removing coupon...');
        setAppliedCoupon(null)
        setCouponCode('')
    }, [])

    const revalidateCoupon = useCallback(async (currentCartSubtotal: number) => {
        if (!appliedCoupon) return; // Only run if a coupon is currently applied

        const couponCodeToRevalidate = appliedCoupon.code;
        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);

        setCouponLoading(true);

        try {
            const response = await apiRequest('/customer/outlets/apply-coupon', {
                method: 'POST',
                body: {
                    code: couponCodeToRevalidate,
                    currentTotal: currentCartSubtotal, // Pass the new total for validation
                    outletId
                }
            });

            // Success: Update the applied coupon (in case the discount amount changed)
            const couponDetails = availableCoupons.find(c => c.code.toUpperCase() === couponCodeToRevalidate.toUpperCase());
            setAppliedCoupon({
                code: couponCodeToRevalidate,
                discount: response.discount,
                description: couponDetails?.description || 'Discount Re-applied'
            });

        } catch (error: any) {
            // Failure: If min order value isn't met or coupon expired/invalid for new total
            console.log('Coupon re-validation failed:', error.message);
            setAppliedCoupon(null); // Directly set to null instead of calling removeCoupon
            setCouponCode('');
            Toast.show({
                type: 'info',
                text1: 'Coupon Removed',
                text2: `The coupon '${couponCodeToRevalidate}' no longer meets the order requirements.`,
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
            });
        } finally {
            setCouponLoading(false);
        }
    }, [appliedCoupon, availableCoupons]);

    // Calculate final amounts
    const discount = appliedCoupon?.discount || 0
    const subtotal = getTotalPrice()
    const finalTotal = subtotal - discount

    // Check if we need to refresh after order completion
    useEffect(() => {
        const checkOrderCompletion = async () => {
            try {
                const lastOrder = await AsyncStorage.getItem('lastOrderCompleted')
                if (lastOrder && lastOrder !== lastOrderCheck) {
                    setLastOrderCheck(lastOrder)
                    await Promise.all([
                        fetchCartData(),
                        refreshProducts()
                    ])
                    await AsyncStorage.removeItem('lastOrderCompleted')
                }
            } catch (error) {
                console.error('Error checking order completion:', error)
            }
        }

        checkOrderCompletion()
    }, [fetchCartData, refreshProducts, lastOrderCheck])

    // Fetch cart data and coupons when screen is focused
    useFocusEffect(
        useCallback(() => {
            // Only refresh the cart if another sync operation isn't already running.
            if (!cartState.syncInProgress) {
                console.log('Cart screen focused, refreshing cart data.');
                fetchCartData();
            } else {
                console.log('Cart screen focused, but a sync is already in progress. Skipping refresh.');
            }
        }, [cartState.syncInProgress, fetchCartData])
    )

    useEffect(() => {
        // Only run if cart data has loaded and we have a coupon applied
        if (!cartState.loading && appliedCoupon) {
            const currentTotal = getTotalPrice();

            // Always remove coupon if the cart total is 0 after a sync
            if (currentTotal === 0) {
                removeCoupon();
            } else {
                // Revalidate coupon on initial load/sync if it exists
                revalidateCoupon(currentTotal);
            }
        }
        // Dependency on cartState.cartData?.items.length ensures it runs after initial fetch
    }, [cartState.loading,
    cartState.cartData?.items?.length, // Only depend on items length, not the functions
    appliedCoupon?.code]);

    // Handle pull to refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([
                fetchCartData(),
                refreshProducts(),
                fetchCoupons()
            ])
        } catch (error) {
            console.error('Error refreshing cart:', error)
        } finally {
            setRefreshing(false)
        }
    }, [fetchCartData, refreshProducts, fetchCoupons])

    // Handle quantity changes with enhanced stock validation
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
            Toast.show({
                type: 'error',
                text1: 'Stock Limit',
                text2: `No more stock available for ${product.name}.`,
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

        if (newQuantity < 0) return

        try {
            const success = await updateItemQuantity(productId, change, product, availableStock)
            if (success) {
                // Get the cart details immediately after the update
                const newSubtotal = getTotalPrice();
                const newTotalItems = getTotalCartItems();

                if (newTotalItems === 0) {
                    // Scenario 1: Cart is now empty, always remove coupon
                    removeCoupon();
                } else if (appliedCoupon) {
                    // Scenario 2: Cart still has items, re-validate the applied coupon
                    await revalidateCoupon(newSubtotal);
                }
            } else {
                console.log('Update failed, refreshing cart...')
                await handleRefresh()
            }
        } catch (error) {
            console.error('Error updating quantity:', error)
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update quantity. Please try again.',
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
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
                            setTimeout(async () => {
                                const newSubtotal = getTotalPrice();
                                const newTotalItems = getTotalCartItems();

                                if (newTotalItems === 0) {
                                    // Scenario 1: Cart is now empty, always remove coupon
                                    removeCoupon();
                                } else if (appliedCoupon) {
                                    // Scenario 2: Cart still has items, re-validate the applied coupon
                                    await revalidateCoupon(newSubtotal);
                                }
                            }, 50);
                        } catch (error) {
                            console.error('Error removing item:', error)
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to remove item. Please try again.',
                                position: 'top',
                                topOffset: 200,
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

    const handleCheckout = useCallback(async () => {
        if (!cartState.cartData || cartState.cartData.items.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Empty Cart',
                text2: 'Please add items to your cart first',
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }
        if (!selectedTimeSlot) {
            Toast.show({
                type: 'error',
                text1: 'Select Time Slot',
                text2: 'Please select a delivery time slot',
                position: 'top',
                topOffset: 200,
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
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

        // Calculate all amounts
        const subtotalAmount = getTotalPrice()
        const discountAmount = appliedCoupon?.discount || 0
        const finalTotalAmount = subtotalAmount - discountAmount
        const payCoupon = appliedCoupon ? JSON.stringify(appliedCoupon) : ''
        setAppliedCoupon(null);
        router.push({
            pathname: '/(tabs)/cart/orderPayment',
            params: {
                cartData: JSON.stringify(cartState.cartData),
                selectedTimeSlot: selectedSlot?.slot || '',
                selectedTimeSlotDisplay: selectedSlot?.time || '',
                subtotalAmount: subtotalAmount.toFixed(2),
                discountAmount: discountAmount.toFixed(2),
                totalAmount: finalTotalAmount.toFixed(2), // This is the final amount after discount
                appliedCoupon: payCoupon,
                totalItems: getTotalCartItems().toString()
            }
        })
    }, [cartState.cartData, selectedTimeSlot, getTotalPrice, appliedCoupon, getTotalCartItems, router, validateCartStock, handleRefresh])



    if (!isFocused) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#FCD34D" />
            </SafeAreaView>
        );
    }

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
                {/* Cart Summary */}

                {/* Cart Items */}
                {cartItems.length > 0 ? (
                    <View className="bg-white rounded-2xl mx-4 mb-6 shadow-md border border-gray-100 overflow-hidden">
                        {cartItems.map((item, index) => (
                            <View key={item.id}>
                                <CartItem
                                    item={item}

                                    getItemQuantity={getItemQuantity}
                                    getCategoryIcon={getCategoryIcon}
                                    handleQuantityChange={handleQuantityChange}
                                    removeItemCompletely={removeItemCompletely}
                                />
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


                {/* Coupon Section */}
                {config.COUPONS && cartItems.length > 0 && (
                    <View className="mx-4 mb-6">
                        <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-lg">🎫</Text>
                                    </View>
                                    <Text className="text-xl font-bold text-gray-900">Coupon Code</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowCoupons(!showCoupons)}
                                    className="bg-purple-100 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-purple-600 text-sm font-medium">
                                        {showCoupons ? 'Hide Coupons' : 'View Available'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Applied Coupon Display */}
                            {appliedCoupon ? (
                                <View className="bg-green-50 p-4 rounded-2xl border border-green-200 mb-4">
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-lg font-bold text-green-700">{appliedCoupon.code}</Text>
                                                <View className="bg-green-100 px-2 py-1 rounded-full ml-2">
                                                    <Text className="text-green-600 text-xs font-medium">Applied</Text>
                                                </View>
                                            </View>
                                            <Text className="text-sm text-green-600">{appliedCoupon.description}</Text>
                                            <Text className="text-sm font-medium text-green-700">You saved ₹{discount.toFixed(2)}!</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={removeCoupon}
                                            className="bg-red-100 px-3 py-2 rounded-full ml-4"
                                        >
                                            <Text className="text-red-600 text-xs font-medium">Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-row items-center space-x-2 mb-4">
                                    <TextInput
                                        className="flex-1 bg-gray-100 px-4 py-3 rounded-xl text-base"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => applyCoupon(couponCode)}
                                        className={`px-6 py-3 rounded-xl ${couponCode.trim() ? 'bg-purple-500' : 'bg-gray-400'}`}
                                        disabled={!couponCode.trim() || couponLoading}
                                    >
                                        {couponLoading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text className="text-white font-semibold">Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {showCoupons && availableCoupons.length > 0 && (
                                <View>
                                    <Text className="text-gray-600 mb-3">Available Coupons:</Text>
                                    <View className="max-h-60 px-0">
                                        <FlatList
                                            data={availableCoupons}
                                            keyExtractor={(item) => item.id.toString()}
                                            renderItem={({ item }) => (
                                                <CouponItem
                                                    key={item.id}
                                                    coupon={item}
                                                    onApply={applyCoupon}
                                                />
                                            )}
                                            nestedScrollEnabled={true}
                                            showsVerticalScrollIndicator={true}
                                            contentContainerStyle={{ paddingVertical: 4 }}
                                            // These props help with nested scrolling
                                            scrollEnabled={true}
                                            bounces={false}
                                            onStartShouldSetResponder={() => true}
                                            onMoveShouldSetResponderCapture={() => true}
                                            // Prevent parent from intercepting scroll
                                            onScrollBeginDrag={() => { }}
                                            onScrollEndDrag={() => { }}
                                        />
                                    </View>
                                </View>
                            )}

                            {showCoupons && availableCoupons.length === 0 && (
                                <View className="items-center py-4">
                                    <Text className="text-gray-500">No coupons available at the moment</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

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

                        {/* Breakdown */}
                        <View className="space-y-2">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-base text-gray-600">Subtotal</Text>
                                <Text className="text-base font-medium text-gray-900">
                                    ₹{subtotal.toFixed(2)}
                                </Text>
                            </View>

                            {appliedCoupon && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-base text-green-600">Discount ({appliedCoupon.code})</Text>
                                    <Text className="text-base font-medium text-green-600">
                                        -₹{discount.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                                <Text className="text-lg font-semibold text-gray-700">Total Amount</Text>
                                <Text className="text-2xl font-bold text-green-600">
                                    ₹{finalTotal.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

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
                                <TimeSlotItem
                                    key={slot.id}
                                    slot={slot}
                                    isSelected={selectedTimeSlot === slot.id}
                                    onSelect={setSelectedTimeSlot}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Checkout Button */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mb-4">
                        <TouchableOpacity
                            onPress={handleCheckout}
                            activeOpacity={0.8}
                            className={`rounded-2xl p-4 shadow-md ${cartItems.length > 0 && selectedTimeSlot
                                ? 'bg-yellow-400'
                                : 'bg-gray-300'
                                }`}
                        >
                            <View className="flex-row items-center justify-center">
                                <View className="ml-2">
                                    <Text className={`text-lg font-bold ${cartItems.length > 0 && selectedTimeSlot
                                        ? 'text-gray-900'
                                        : 'text-gray-500'
                                        }`}>
                                        Proceed to Checkout
                                    </Text>
                                    <View className="flex-row items-center justify-center">
                                        {appliedCoupon && (
                                            <Text className={`text-sm line-through mr-2 ${cartItems.length > 0 && selectedTimeSlot
                                                ? 'text-gray-600'
                                                : 'text-gray-400'
                                                }`}>
                                                ₹{subtotal.toFixed(2)}
                                            </Text>
                                        )}
                                        <Text className={`text-lg font-bold ${cartItems.length > 0 && selectedTimeSlot
                                            ? 'text-gray-900'
                                            : 'text-gray-500'
                                            }`}>
                                            ₹{finalTotal.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Security Info */}
                <View className="items-center ">
                    <Text className="text-gray-500 text-sm">Secure Checkout</Text>
                    <Text className="text-gray-400 text-xs mt-1">🔒 Your payment is protected</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Cart