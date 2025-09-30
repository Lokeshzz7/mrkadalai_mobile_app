import React, { useState, useEffect, useCallback } from 'react'
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Vibration,
    Image,
    TextInput,
    FlatList
} from 'react-native'
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router'
import RazorpayCheckout from 'react-native-razorpay';
import { apiRequest } from '../../../utils/api'
import { useAuth } from '../../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '@/context/CartContext';
import Toast from 'react-native-toast-message';
import { useContext } from 'react';
import { AppConfigContext } from '@/context/AppConfigContext';

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

interface WalletData {
    balance: number;
    totalRecharged: number;
    totalUsed: number;
    lastRecharged?: string;
    lastOrder?: string;
}

interface AppliedCoupon {
    code: string;
    discount: number;
    description: string;
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

interface CouponItemProps {
    coupon: Coupon;
    onApply: (code: string) => void;
}

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

const OrderPayment = () => {
    const router = useRouter()
    const navigation = useNavigation();
    const params = useLocalSearchParams()
    const { clearCart } = useCart()

    // States
    const [walletData, setWalletData] = useState<WalletData | null>(null)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'WALLET' | 'UPI' | null>(null)
    const [loading, setLoading] = useState(false)
    const [walletLoading, setWalletLoading] = useState(true)
    const [cartData, setCartData] = useState<CartData | null>(null)
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
    const [couponCode, setCouponCode] = useState<string>('')
    const [couponLoading, setCouponLoading] = useState<boolean>(false)
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
    const [showCoupons, setShowCoupons] = useState<boolean>(false)

    const { user } = useAuth();
    const outletId = user?.outletId;
    const { config } = useContext(AppConfigContext);

    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const fetchSelectedDate = async () => {
            const storedDate = await AsyncStorage.getItem('Date');
            if (storedDate) {
                setSelectedDate(JSON.parse(storedDate));
            }
        };
        fetchSelectedDate();
    }, []);

    // Parse cart data from params
    useEffect(() => {
        if (params.cartData) {
            try {
                const parsedCartData = JSON.parse(params.cartData as string)
                setCartData(parsedCartData)
            } catch (error) {
                console.error('Error parsing cart data:', error)
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Invalid cart data',
                    position: 'top',
                    topOffset: 200,
                    visibilityTime: 4000,
                    autoHide: true,
                    onPress: () => Toast.hide(),
                });
                router.back()
            }
        }
    }, [params.cartData])

    // Get order details from params
    const selectedTimeSlot = params.selectedTimeSlot as string
    const selectedTimeSlotDisplay = params.selectedTimeSlotDisplay as string
    const subtotalAmount = parseFloat(params.subtotalAmount as string || '0')
    const totalItems = parseInt(params.totalItems as string || '0')

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

    // Fetch coupons
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

    useEffect(() => {
        fetchCoupons()
    }, [fetchCoupons])

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
            const currentTotal = subtotalAmount
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
    }, [subtotalAmount, availableCoupons])

    // Remove coupon
    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null)
        setCouponCode('')
    }, [])

    // Calculate amounts
    const discount = appliedCoupon?.discount || 0
    const orderTotalAmount = subtotalAmount - discount
    const platformFee = selectedPaymentMethod === 'UPI' ? orderTotalAmount * 0.02 : 0;
    const finalTotalAmount = orderTotalAmount + platformFee

    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`

    // Fetch wallet details
    const fetchWalletData = async () => {
        try {
            setWalletLoading(true)
            const response = await apiRequest('/customer/outlets/get-wallet-details', {
                method: 'GET'
            })

            if (response.wallet) {
                setWalletData(response.wallet)
            }
        } catch (error) {
            console.error('Error fetching wallet:', error)
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to fetch wallet details',
                position: 'top',
                topOffset: 200,
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
        } finally {
            setWalletLoading(false)
        }
    }

    useEffect(() => {
        fetchWalletData()
    }, [])

    // Success alert
    const showSuccessAlert = (orderData: any, paymentId: string) => {
        const orderNumber = `#${String(orderData.id).padStart(6, '0')}`
        const amount = formatCurrency(finalTotalAmount)

        Alert.alert(
            '🎉 Order Confirmed!',
            `Congratulations! Your delicious meal is on its way!\n\n` +
            `📋 Order: ${orderNumber}\n` +
            `💳 Payment: ${amount}\n` +
            `🕐 Delivery: ${selectedTimeSlotDisplay}\n` +
            `📱 Payment ID: ${paymentId.substring(0, 12)}...\n\n` +
            `Thank you for choosing us! 😊`,
            [
                {
                    text: '🏠 Go Home',
                    onPress: () => {
                        clearCart();
                        navigation.popToTop();
                        router.replace('/(tabs)')
                    }
                }
            ],
            {
                cancelable: false
            }
        )
    }

    const showCancelledAlert = () => {
        Alert.alert(
            '😔 Payment Cancelled',
            `No worries! Your delicious food is still waiting for you.\n\nWould you like to try a different payment method?`,
            [
                {
                    text: 'Try Again',
                    onPress: () => {
                        setSelectedPaymentMethod(null)
                    }
                },
                {
                    text: 'Maybe Later',
                    style: 'cancel',
                    onPress: () => router.back()
                }
            ]
        )
    }

    const showErrorAlert = (title: string, message: string) => {
        Alert.alert(
            `❌ ${title}`,
            `${message}\n\nDon't worry, we're here to help!`,
            [
                {
                    text: 'Contact Support',
                    onPress: () => {
                        Alert.alert('Contact Support', 'Call: +91-XXXXX-XXXXX\nEmail: support@restaurant.com')
                    }
                },
                {
                    text: 'Try Again',
                    style: 'default',
                    onPress: () => {
                        setSelectedPaymentMethod(null)
                    }
                }
            ]
        )
    }

    const showWalletSuccessAlert = (orderData: any) => {
        const orderNumber = `#${String(orderData.id).padStart(6, '0')}`
        const amount = formatCurrency(finalTotalAmount)

        Alert.alert(
            '🎉 Order Placed Successfully!',
            `Your wallet payment was successful!\n\n` +
            `📋 Order: ${orderNumber}\n` +
            `💳 Amount: ${amount}\n` +
            `🕐 Delivery: ${selectedTimeSlotDisplay}\n\n` +
            `Thank you for using your wallet! 😊`,
            [
                {
                    text: '🏠 Go Home',
                    onPress: () => {
                        clearCart();
                        navigation.popToTop();
                        router.replace('/(tabs)')
                    }
                }
            ],
            {
                cancelable: false
            }
        )
    }

    const createRazorpayOrder = async (amount: number) => {
        try {
            console.log('Creating Razorpay order for amount:', amount)

            const response = await apiRequest('/customer/outlets/create-razorpay-order', {
                method: 'POST',
                body: {
                    amount: Math.round(amount * 100),
                    currency: 'INR',
                    receipt: `order_${new Date().getTime()}`
                }
            })

            console.log('Order creation response:', response)

            if (!response.order || !response.order.id) {
                throw new Error('Invalid order response from server')
            }

            return response.order
        } catch (error) {
            console.error('Error creating Razorpay order:', error)
            throw new Error('Failed to create payment order: ' + error.message)
        }
    }

    const handleRazorpayPayment = async () => {
        try {
            setLoading(true)
            console.log('Starting payment process...')
            console.log('Final amount:', finalTotalAmount)

            const razorpayOrder = await createRazorpayOrder(finalTotalAmount)
            console.log('Razorpay order created:', razorpayOrder)

            const options = {
                description: 'Food Order Payment',
                currency: 'INR',
                key: 'rzp_test_CqJOLIOhHoCry6',
                amount: razorpayOrder.amount,
                order_id: razorpayOrder.id,
                name: 'Mr Kadali',
                prefill: {
                    email: user?.email || 'customer@restaurant.com',
                    name: user?.name || 'Valued Customer'
                },
                theme: {
                    color: '#FCD34D'
                },
                modal: {
                    backdropclose: false,
                    escape: true,
                    handleback: true,
                    ondismiss: () => {
                        console.log('Payment modal dismissed')
                        setLoading(false)
                    }
                }
            }

            console.log('Payment options (masked):', {
                ...options,
                key: options.key.substring(0, 8) + '****'
            })

            RazorpayCheckout.open(options)
                .then(async (paymentData) => {
                    console.log('✅ Payment successful:', paymentData)
                    Vibration.vibrate([100, 200, 100])
                    await verifyPaymentAndCreateOrder(paymentData)
                })
                .catch((error) => {
                    console.log('❌ Payment error:', error)
                    setLoading(false)

                    if (error.description && error.description.includes('cancelled')) {
                        showCancelledAlert()
                    } else if (error.code === 'BAD_REQUEST_ERROR') {
                        showErrorAlert('Invalid Request', 'There was an issue with the payment setup. Please try again.')
                    } else {
                        showErrorAlert('Payment Failed', error.description || 'An unexpected error occurred. Please try again.')
                    }

                    console.error('Detailed Razorpay error:', JSON.stringify(error, null, 2))
                })

        } catch (error) {
            console.error('Payment setup error:', error)
            setLoading(false)
            showErrorAlert('Setup Error', 'Failed to initialize payment. Please try again.')
        }
    }

    const verifyPaymentAndCreateOrder = async (paymentData: any) => {
        try {
            console.log('Verifying payment and creating order...')

            const orderData = {
                totalAmount: finalTotalAmount,
                paymentMethod: 'UPI',
                deliverySlot: selectedTimeSlot,
                outletId: outletId,
                couponCode: appliedCoupon?.code || "",
                deliveryDate: selectedDate?.fullDate ? new Date(selectedDate.fullDate) : null,
                items: cartData!.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.product.price
                })),
                paymentDetails: {
                    razorpay_order_id: paymentData.razorpay_order_id,
                    razorpay_payment_id: paymentData.razorpay_payment_id,
                    razorpay_signature: paymentData.razorpay_signature
                }
            }

            // console.error(orderData);

            const response = await apiRequest('/customer/outlets/customer-order', {
                method: 'POST',
                body: orderData
            })

            if (response.order) {
                setLoading(false)
                Vibration.vibrate([200, 100, 200])
                setTimeout(() => {
                    showSuccessAlert(response.order, paymentData.razorpay_payment_id)
                }, 500)
            } else {
                throw new Error('Invalid response from server')
            }
        } catch (error) {
            console.error('Order creation error:', error)
            setLoading(false)

            Alert.alert(
                '⚠️ Order Processing Issue',
                `Your payment of ${formatCurrency(finalTotalAmount)} was successful!\n\n` +
                `Payment ID: ${paymentData.razorpay_payment_id}\n\n` +
                `However, there was an issue processing your order. Our team has been notified and will contact you shortly.\n\n` +
                `Please save your Payment ID for reference.`,
                [
                    {
                        text: 'Contact Support',
                        onPress: () => {
                            Alert.alert('Emergency Support', 'Call: +91-XXXXX-XXXXX\nEmail: urgent@restaurant.com')
                        }
                    },
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ],
                { cancelable: false }
            )
        }
    }

    const handleWalletPayment = async () => {
        try {
            setLoading(true)

            const orderData = {
                totalAmount: finalTotalAmount,
                paymentMethod: 'WALLET',
                deliverySlot: selectedTimeSlot,
                outletId: outletId,
                couponCode: appliedCoupon?.code || "",
                deliveryDate: selectedDate?.fullDate ? new Date(selectedDate.fullDate) : null,
                items: cartData!.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.product.price
                }))
            }

            // console.error(orderData);
            const response = await apiRequest('/customer/outlets/customer-order', {
                method: 'POST',
                body: orderData
            })

            if (response.order) {
                setLoading(false)
                Vibration.vibrate([200, 100, 200])
                setTimeout(() => {
                    showWalletSuccessAlert(response.order)
                }, 500)
            }
        } catch (error) {
            console.error('Wallet payment error:', error);
            setLoading(false)

            if (error instanceof Error) {
                showErrorAlert('Wallet Payment Failed', error.message);
            } else {
                showErrorAlert('Payment Error', 'Failed to process wallet payment');
            }
        }
    }

    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            Toast.show({
                type: 'error',
                text1: 'Select Payment Method',
                text2: 'Please choose how you want to pay',
                position: 'top',
                topOffset: 200,
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

        if (!cartData) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Cart data not found',
                position: 'top',
                topOffset: 200,
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

        if (!selectedTimeSlot) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Delivery time slot not selected',
                position: 'top',
                topOffset: 200,
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return
        }

        if (selectedPaymentMethod === 'WALLET') {
            if (walletData && walletData.balance < finalTotalAmount) {
                Toast.show({
                    type: 'error',
                    text1: 'Insufficient Balance',
                    text2: 'Your wallet balance is insufficient for this order',
                    position: 'top',
                    topOffset: 200,
                    visibilityTime: 4000,
                    autoHide: true,
                    onPress: () => Toast.hide(),
                });
                return
            }
            await handleWalletPayment()
        } else if (selectedPaymentMethod === 'UPI') {
            await handleRazorpayPayment()
        }
    }

    const OrderItem = ({ item }: { item: CartItem }) => (
        <View className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
            <View className="w-10 h-10 bg-yellow-100 rounded-xl items-center justify-center mr-3 overflow-hidden">
                {item.product.imageUrl ? (
                    <Image
                        source={{ uri: item.product.imageUrl }}
                        style={{ width: 40, height: 40, borderRadius: 8 }}
                        resizeMode="cover"
                    />
                ) : (
                    <Text className="text-lg">{getCategoryIcon(item.product.category)}</Text>
                )}
            </View>
            <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">{item.product.name}</Text>
                <Text className="text-sm text-gray-600">Qty: {item.quantity}</Text>
            </View>
            <Text className="text-base font-semibold text-gray-900">
                {formatCurrency(item.product.price * item.quantity)}
            </Text>
        </View>
    )

    const PaymentOption = ({
        type,
        title,
        subtitle,
        icon,
        onPress,
        disabled = false,
        note = null,
    }: {
        type: 'WALLET' | 'UPI'
        title: string
        subtitle: string
        icon: string
        onPress: () => void
        disabled?: boolean
        note?: string | null
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
            className={`mb-4 p-4 rounded-xl border-2 ${disabled
                ? 'bg-gray-100 border-gray-200'
                : selectedPaymentMethod === type
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-white border-gray-200'
                }`}
        >
            <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4">
                    <Text className="text-xl">{icon}</Text>
                </View>
                <View className="flex-1">
                    <Text className={`text-lg font-semibold ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
                        {title}
                    </Text>
                    <Text className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                        {subtitle}
                    </Text>
                    {note && (
                        <Text className="text-lg text-yellow-700 mt-1">
                            {note}
                        </Text>
                    )}
                </View>
                <View className={`w-6 h-6 rounded-full border-2 ${selectedPaymentMethod === type
                    ? 'bg-yellow-400 border-yellow-400'
                    : 'border-gray-300'
                    }`}>
                    {selectedPaymentMethod === type && (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-white text-xs font-bold">✓</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    )

    if (!cartData || walletLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FCD34D" />
                    <Text className="mt-4 text-gray-600">Loading order details...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()} disabled={loading}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="mx-4 mt-6">
                    <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                        <View className="items-center mb-4">
                            <Text className="text-3xl font-bold text-gray-900">Order Summary</Text>
                        </View>

                        <View className="bg-yellow-50 rounded-xl p-4 mb-4">
                            <Text className="text-sm text-gray-600">Delivery Time: {selectedTimeSlotDisplay}</Text>
                            <Text className="text-sm text-gray-600">
                                Selected Date:{" "}
                                {selectedDate?.fullDate
                                    ? new Date(selectedDate.fullDate).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    : "Not selected"}
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Items Ordered</Text>
                            {cartData?.items.map((item) => (
                                <OrderItem key={item.id} item={item} />
                            ))}
                        </View>

                        <View className="border-t border-gray-200 pt-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Bill Summary</Text>

                            <View className="space-y-2">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-700">Item Total</Text>
                                    <Text className="text-gray-900 font-medium">{formatCurrency(subtotalAmount)}</Text>
                                </View>

                                {appliedCoupon && discount > 0 && (
                                    <View className="bg-green-50 rounded-lg p-3 my-2 border border-green-200">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <View className="flex-row items-center">
                                                <Text className="text-lg mr-2">🎫</Text>
                                                <Text className="text-green-700 font-semibold">{appliedCoupon.code}</Text>
                                            </View>
                                            <Text className="text-green-700 font-bold">-{formatCurrency(discount)}</Text>
                                        </View>
                                        <Text className="text-sm text-gray-600">{appliedCoupon.description}</Text>
                                        <Text className="text-sm font-medium text-green-700">
                                            You saved {formatCurrency(discount)}!
                                        </Text>
                                    </View>
                                )}

                                <View className="flex-row justify-between">
                                    <Text className="text-gray-700">Subtotal After Discount</Text>
                                    <Text className="text-gray-900 font-medium">{formatCurrency(orderTotalAmount)}</Text>
                                </View>

                                {selectedPaymentMethod === "UPI" && (
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-700">Platform Fee (2%)</Text>
                                        <Text className="text-gray-900 font-medium">{formatCurrency(platformFee)}</Text>
                                    </View>
                                )}

                                <View className="flex-row justify-between items-center border-t border-gray-200 pt-3 mt-3">
                                    <Text className="text-lg font-bold text-gray-900">Total Amount</Text>
                                    <Text className="text-lg font-bold text-yellow-600">{formatCurrency(finalTotalAmount)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Coupon Section */}
                {config.COUPONS && (
                    <View className="mx-4 mb-6">
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
                                <ScrollView
                                    className="mt-4"
                                    style={{ maxHeight: 400 }}
                                    nestedScrollEnabled={true}
                                    showsVerticalScrollIndicator={true}
                                >
                                    {availableCoupons.map((coupon) => (
                                        <CouponItem
                                            key={coupon.id}
                                            coupon={coupon}
                                            onApply={applyCoupon}
                                        />
                                    ))}
                                </ScrollView>
                            )}

                            {showCoupons && availableCoupons.length === 0 && (
                                <View className="items-center py-4 mt-2">
                                    <Text className="text-gray-500">No coupons available</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Payment Methods */}
                <View className="mx-4 mb-6">
                    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Choose Payment Method</Text>

                        <PaymentOption
                            type="WALLET"
                            title="Pay by Wallet"
                            subtitle={walletData ? `Available Balance: ${formatCurrency(walletData.balance)}` : 'Loading wallet balance...'}
                            icon="💳"
                            onPress={() => setSelectedPaymentMethod('WALLET')}
                            disabled={!walletData}
                        />

                        {selectedPaymentMethod === 'WALLET' && walletData && (
                            <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                                <Text className="text-base font-semibold text-gray-900 mb-3">Wallet Transaction Details</Text>
                                <View className="space-y-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-700">Current Balance</Text>
                                        <Text className="text-gray-900 font-medium">{formatCurrency(walletData.balance)}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-700">Order Total</Text>
                                        <Text className="text-red-600 font-medium">-{formatCurrency(finalTotalAmount)}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center border-t border-blue-200 pt-2 mt-2">
                                        <Text className="text-base font-semibold text-gray-900">Balance After Payment</Text>
                                        <Text className={`text-base font-bold ${walletData.balance - finalTotalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(walletData.balance - finalTotalAmount)}
                                        </Text>
                                    </View>
                                </View>
                                {walletData.balance < finalTotalAmount && (
                                    <View className="mt-3 p-2 bg-red-100 rounded-lg">
                                        <Text className="text-red-700 text-sm font-medium">
                                            Insufficient wallet balance. Please choose online payment or add funds to your wallet.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {config.UPI && (
                            <>
                                <PaymentOption
                                    type="UPI"
                                    title="Pay by Online Transaction"
                                    subtitle="UPI, Card, Net Banking via Razorpay"
                                    icon="🌐"
                                    onPress={() => setSelectedPaymentMethod('UPI')}
                                    note="2% platform fee added for online payments"
                                />

                                {selectedPaymentMethod === 'UPI' && (
                                    <View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">Online Payment Details</Text>
                                        <View className="space-y-2">
                                            <View className="flex-row justify-between">
                                                <Text className="text-gray-700">Payment Amount</Text>
                                                <Text className="text-gray-900 font-medium">{formatCurrency(finalTotalAmount)}</Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-gray-700">Payment Gateway</Text>
                                                <Text className="text-gray-900 font-medium">Razorpay</Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-gray-700">Accepted Methods</Text>
                                                <Text className="text-gray-900 font-medium">UPI, Cards</Text>
                                            </View>
                                        </View>
                                        <View className="mt-3 p-2 bg-green-100 rounded-lg">
                                            <Text className="text-green-700 text-sm font-medium">
                                                ✓ Secure payment powered by Razorpay. Your payment information is encrypted and secure.
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Payment Button */}
                <View className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handlePayment}
                        activeOpacity={0.8}
                        className={`py-4 rounded-xl ${selectedPaymentMethod && !loading ? 'bg-yellow-400' : 'bg-gray-300'}`}
                        disabled={!selectedPaymentMethod || loading}
                    >
                        <View className="flex-row items-center justify-center">
                            {loading ? (
                                <>
                                    <ActivityIndicator size="small" color="#374151" />
                                    <Text className="text-lg font-bold text-gray-900 ml-2">
                                        {selectedPaymentMethod === 'UPI' ? 'Opening Payment Gateway...' : 'Processing...'}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text className="text-xl mr-2">💳</Text>
                                    <Text className={`text-lg font-bold ${selectedPaymentMethod ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {selectedPaymentMethod === 'UPI'
                                            ? `Pay Online • ${formatCurrency(finalTotalAmount)}`
                                            : `Pay Now • ${formatCurrency(finalTotalAmount)}`}
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default OrderPayment