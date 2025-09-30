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
import { apiRequest } from '../../../utils/api'
import Toast from 'react-native-toast-message'
import { useContext } from 'react';
import { AppConfigContext } from '@/context/AppConfigContext';

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
    const canAddMoreItems = availableStock > 0

    return (
        <View className="bg-white mx-4 mb-4 p-4">
            <View className="flex-row items-center">
                {/* Image Section */}
                <View className="mr-4">
                    {item.product.imageUrl ? (
                        <View className="w-20 h-20 bg-blue-100 rounded-2xl overflow-hidden items-center justify-center">
                            <Image
                                source={{ uri: item.product.imageUrl }}
                                style={{ width: 80, height: 80 }}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center">
                            <Text className="text-3xl">{getCategoryIcon(item.product.category)}</Text>
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-1">
                        {item.product.name}
                    </Text>
                    
                    <Text className="text-sm text-gray-500 mb-2">
                        {item.product.category}
                    </Text>

                    <Text className="text-lg font-bold text-gray-900">
                        ₹{(item.product.price * cartQuantity).toFixed(2)}
                    </Text>
                </View>

                {/* Quantity Controls */}
                <View className="flex-row items-center bg-gray-100 rounded-lg px-1">
                    <TouchableOpacity
                        onPress={() => handleQuantityChange(item.productId, -1, item.product)}
                        className="px-3 py-2"
                        activeOpacity={0.7}
                        disabled={cartQuantity <= 0}
                    >
                        <Text className="text-gray-900 font-bold text-lg">−</Text>
                    </TouchableOpacity>

                    <Text className="px-3 text-base font-bold text-gray-900">
                        {cartQuantity}
                    </Text>

                    <TouchableOpacity
                        onPress={() => handleQuantityChange(item.productId, 1, item.product)}
                        className="px-3 py-2"
                        activeOpacity={0.7}
                        disabled={!canAddMoreItems}
                    >
                        <Text className={`font-bold text-lg ${canAddMoreItems ? 'text-gray-900' : 'text-gray-400'}`}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Item Total */}
            {/* <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-600">
                    {cartQuantity} × ₹{item.product.price.toFixed(0)} = <Text className="font-bold text-gray-900">₹{(item.product.price * cartQuantity).toFixed(2)}</Text>
                </Text>
            </View> */}
        </View>
    )
})

const CouponItem = React.memo<CouponItemProps>(({ coupon, onApply }) => (
    <TouchableOpacity
        onPress={() => onApply(coupon.code)}
        className="bg-white mb-3 p-4 rounded-lg border border-gray-200"
        activeOpacity={0.7}
    >
        <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 mb-1">{coupon.code}</Text>
                <Text className="text-sm text-gray-600 mb-1">{coupon.description}</Text>
                <Text className="text-xs text-gray-500">Min order: ₹{coupon.minOrderValue}</Text>
            </View>
            <View className="bg-green-50 px-3 py-1 rounded-lg ml-3">
                <Text className="text-green-600 text-sm font-bold">
                    {coupon.rewardValue < 1 ? `${(coupon.rewardValue * 100)}% OFF` : `₹${coupon.rewardValue} OFF`}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
))

const TimeSlotItem = React.memo<TimeSlotItemProps>(({ slot, isSelected, onSelect }) => (
    <TouchableOpacity
        onPress={() => slot.available && onSelect(slot.id)}
        activeOpacity={0.7}
        disabled={!slot.available}
        className="mb-3"
    >
        <View className="mx-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${isSelected
                    ? 'border-gray-900'
                    : 'border-gray-300'
                    }`}>
                    {isSelected && <View className="w-3 h-3 rounded-full bg-gray-900" />}
                </View>
                <Text className={`text-base font-medium ${slot.available ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                    {slot.time}
                </Text>
            </View>
            {!slot.available && (
                <Text className="text-sm text-gray-400">Unavailable</Text>
            )}
        </View>
    </TouchableOpacity>
))

const Cart: React.FC = () => {
    const router = useRouter()
    const isFocused = useIsFocused();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [lastOrderCheck, setLastOrderCheck] = useState<string>('')
    const [couponCode, setCouponCode] = useState<string>('')
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
    const [couponLoading, setCouponLoading] = useState<boolean>(false)
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
    const [showCoupons, setShowCoupons] = useState<boolean>(false)
    const { config } = useContext(AppConfigContext);

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

    const getCategoryIcon = (category: string): string => {
        const iconMap: { [key: string]: string } = {
            'Starters': '🥗',
            'Meals': '🍛',
            'Beverages': '🥤',
            'Desserts': '🍰'
        }
        return iconMap[category] || '🍽️'
    }

    const fetchCoupons = useCallback(async () => {
        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);
        try {
            const coupons = await apiRequest(`/customer/outlets/coupons/${outletId}`, {
                method: 'GET'
            })
            setAvailableCoupons(coupons?.coupons ?? [])
        } catch (error) {
            console.error('Error fetching coupons:', error)
        }
    }, [])

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
            const response = await apiRequest('/customer/outlets/apply-coupon', {
                method: 'POST',
                body: {
                    code: code,
                    currentTotal,
                    outletId
                }
            })

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
                text2: `Coupon applied successfully! You saved ₹${response.discount.toFixed(2)}`,
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
        } finally {
            setCouponLoading(false)
        }
    }, [getTotalPrice, cartState.cartData, availableCoupons])

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null)
        setCouponCode('')
    }, [])

    const revalidateCoupon = useCallback(async (currentCartSubtotal: number) => {
        if (!appliedCoupon) return;

        const couponCodeToRevalidate = appliedCoupon.code;
        const outletId = parseInt(await AsyncStorage.getItem("outletId") || "0", 10);
        setCouponLoading(true);

        try {
            const response = await apiRequest('/customer/outlets/apply-coupon', {
                method: 'POST',
                body: {
                    code: couponCodeToRevalidate,
                    currentTotal: currentCartSubtotal,
                    outletId
                }
            });

            const couponDetails = availableCoupons.find(c => c.code.toUpperCase() === couponCodeToRevalidate.toUpperCase());
            setAppliedCoupon({
                code: couponCodeToRevalidate,
                discount: response.discount,
                description: couponDetails?.description || 'Discount Re-applied'
            });

        } catch (error: any) {
            setAppliedCoupon(null);
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

    const discount = appliedCoupon?.discount || 0
    const subtotal = getTotalPrice()
    const finalTotal = subtotal - discount

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

    useFocusEffect(
        useCallback(() => {
            if (!cartState.syncInProgress) {
                fetchCartData();
            }
        }, [cartState.syncInProgress, fetchCartData])
    )

    useEffect(() => {
        if (!cartState.loading && appliedCoupon) {
            const currentTotal = getTotalPrice();

            if (currentTotal === 0) {
                removeCoupon();
            } else {
                revalidateCoupon(currentTotal);
            }
        }
    }, [cartState.loading, cartState.cartData?.items?.length, appliedCoupon?.code]);

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

    const handleQuantityChange = useCallback(async (productId: number, change: number, product: CartProduct) => {
        const inventory = product.inventory
        const totalStock = inventory?.quantity || 0
        const reservedStock = inventory?.reserved || 0
        const currentQuantity = getItemQuantity?.(productId) ?? 0
        const newQuantity = currentQuantity + change
        const availableStock = Math.max(0, totalStock - reservedStock - currentQuantity)

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
                const newSubtotal = getTotalPrice();
                const newTotalItems = getTotalCartItems();

                if (newTotalItems === 0) {
                    removeCoupon();
                } else if (appliedCoupon) {
                    await revalidateCoupon(newSubtotal);
                }
            } else {
                await handleRefresh()
            }
        } catch (error) {
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
                                    removeCoupon();
                                } else if (appliedCoupon) {
                                    await revalidateCoupon(newSubtotal);
                                }
                            }, 50);
                        } catch (error) {
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
                totalAmount: finalTotalAmount.toFixed(2),
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

    const cartItems = cartState.cartData?.items || []
    const totalItems = getTotalCartItems()

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-gray-900">My Cart</Text>

                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={handleRefresh}
                        className="p-2 mr-2"
                        disabled={refreshing}
                    >
                        <Text className="text-xl">🔄</Text>
                    </TouchableOpacity>
                    <View className="bg-yellow-400 rounded-full min-w-7 h-7 items-center justify-center">
                        <Text className="text-gray-900 text-sm font-bold">
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
                    <View className="mx-4 mt-20">
                        <View className="bg-gray-50 rounded-2xl p-10 items-center">
                            <Text className="text-7xl mb-4">🛒</Text>
                            <Text className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
                            <Text className="text-gray-500 text-center mb-6 text-base">Add some delicious items to get started!</Text>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="bg-yellow-400 px-8 py-3 rounded-xl"
                            >
                                <Text className="font-bold text-gray-900 text-base">Browse Menu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Coupon Section */}
                {config.COUPONS && cartItems.length > 0 && (
                    <View className="mx-4 mt-4">
                        <View className="bg-white rounded-xl p-5 border border-gray-200">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <Text className="text-lg font-bold text-gray-900">Apply Coupon</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowCoupons(!showCoupons)}
                                    className="bg-gray-100 px-3 py-2 rounded-lg"
                                >
                                    <Text className="text-gray-700 text-xs font-bold">
                                        {showCoupons ? 'Hide' : 'View All'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {appliedCoupon ? (
                                <View className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-gray-900 mb-1">{appliedCoupon.code}</Text>
                                            <Text className="text-sm text-gray-600 mb-1">{appliedCoupon.description}</Text>
                                            <Text className="text-base font-bold text-green-600">Saved ₹{discount.toFixed(2)}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={removeCoupon}
                                            className="bg-white px-3 py-2 rounded-lg border border-gray-200 ml-3"
                                        >
                                            <Text className="text-gray-700 text-xs font-bold">Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-row items-center">
                                    <TextInput
                                        className="flex-1 bg-gray-50 px-4 py-3 rounded-lg text-base border border-gray-200"
                                        placeholder="Enter code"
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => applyCoupon(couponCode)}
                                        className={`ml-3 px-5 py-3 rounded-lg ${couponCode.trim() ? 'bg-gray-900' : 'bg-gray-300'}`}
                                        disabled={!couponCode.trim() || couponLoading}
                                    >
                                        {couponLoading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text className="text-white font-bold text-sm">Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {showCoupons && availableCoupons.length > 0 && (
                                <View className="mt-4">
                                    <View className="max-h-60">
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
                                            scrollEnabled={true}
                                            bounces={false}
                                            onStartShouldSetResponder={() => true}
                                            onMoveShouldSetResponderCapture={() => true}
                                            onScrollBeginDrag={() => { }}
                                            onScrollEndDrag={() => { }}
                                        />
                                    </View>
                                </View>
                            )}

                            {showCoupons && availableCoupons.length === 0 && (
                                <View className="items-center py-4 mt-2">
                                    <Text className="text-gray-500">No coupons available</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Delivery Time Selection */}
                {cartItems.length > 0 && (
                    <View className="mx-4 mt-4">
                        <View className="bg-white rounded-xl p-5 border border-gray-200">
                            <View className="flex-row items-center mb-4">
                                <Text className="text-lg font-bold text-gray-900">Select Time Slot</Text>
                            </View>

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

                                {appliedCoupon && (
                                    <View className="flex-row justify-between items-center py-2 border-t border-gray-200">
                                        <Text className="text-base text-green-600 font-medium">Coupon Discount</Text>
                                        <Text className="text-base font-bold text-green-600">
                                            -₹{discount.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                <View className="flex-row justify-between items-center pt-3 border-t-2 border-gray-300">
                                    <Text className="text-lg font-bold text-gray-900">Total Amount</Text>
                                    <Text className="text-2xl font-extrabold text-black">
                                        ₹{finalTotal.toFixed(2)}
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
                            className={`rounded-xl p-4 shadow-lg ${cartItems.length > 0 && selectedTimeSlot
                                ? 'bg-yellow-400'
                                : 'bg-gray-300'
                                }`}
                            disabled={!(cartItems.length > 0 && selectedTimeSlot)}
                        >
                            <View className="items-center">
                                <Text className={`text-xl font-extrabold mb-1 ${cartItems.length > 0 && selectedTimeSlot
                                    ? 'text-gray-900'
                                    : 'text-gray-500'
                                    }`}>
                                    Proceed to Payment
                                </Text>
                                <View className="flex-row items-center">
                                    {appliedCoupon && (
                                        <Text className={`text-sm line-through mr-2 ${cartItems.length > 0 && selectedTimeSlot
                                            ? 'text-gray-600'
                                            : 'text-gray-400'
                                            }`}>
                                            ₹{subtotal.toFixed(2)}
                                        </Text>
                                    )}
                                    <Text className={`text-2xl font-extrabold ${cartItems.length > 0 && selectedTimeSlot
                                        ? 'text-black'
                                        : 'text-gray-500'
                                        }`}>
                                        ₹{finalTotal.toFixed(2)}
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