import React, { useState, useEffect } from 'react'
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native'
import { MotiView } from 'moti'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiRequest } from '../../../utils/api'
import { useAuth } from '../../../context/AuthContext'; 

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

const OrderPayment = () => {
    const router = useRouter()
    const params = useLocalSearchParams()

    // States
    const [walletData, setWalletData] = useState<WalletData | null>(null)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'WALLET' | 'UPI' | null>(null)
    const [loading, setLoading] = useState(false)
    const [walletLoading, setWalletLoading] = useState(true)
    const [cartData, setCartData] = useState<CartData | null>(null)

    const { user } = useAuth();

    const outletId = user?.outletId;

    // Parse cart data from params
    useEffect(() => {
        if (params.cartData) {
            try {
                const parsedCartData = JSON.parse(params.cartData as string)
                setCartData(parsedCartData)
            } catch (error) {
                console.error('Error parsing cart data:', error)
                Alert.alert('Error', 'Invalid cart data')
                router.back()
            }
        }
    }, [params.cartData])

    // Get order details from params or cart data
    const selectedTimeSlot = params.selectedTimeSlot as string
    const selectedTimeSlotDisplay = params.selectedTimeSlotDisplay as string
    const totalAmount = cartData ? calculateTotal() : parseFloat(params.totalAmount as string || '0')
    const totalItems = cartData ? calculateTotalItems() : parseInt(params.totalItems as string || '0')

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

    // Calculate totals from cart data
    function calculateTotal() {
        if (!cartData) return 0
        return cartData.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    }

    function calculateTotalItems() {
        if (!cartData) return 0
        return cartData.items.reduce((total, item) => total + item.quantity, 0)
    }

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
            Alert.alert('Error', 'Failed to fetch wallet details')
        } finally {
            setWalletLoading(false)
        }
    }

    useEffect(() => {
        fetchWalletData()
    }, [])

    // Additional fees
    const deliveryFee = 2.99
    const serviceFee = 1.50
    const finalTotalAmount = totalAmount + deliveryFee + serviceFee

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            Alert.alert('Select Payment Method', 'Please choose how you want to pay')
            return
        }

        if (!cartData) {
            Alert.alert('Error', 'Cart data not found')
            return
        }

        if (!selectedTimeSlot) {
            Alert.alert('Error', 'Delivery time slot not selected')
            return
        }

        if (selectedPaymentMethod === 'WALLET' && walletData && walletData.balance < finalTotalAmount) {
            Alert.alert('Insufficient Balance', 'Your wallet balance is insufficient for this order')
            return
        }

        try {
            setLoading(true)
            
            // Prepare order data
            const orderData = {
                totalAmount: finalTotalAmount,
                paymentMethod: selectedPaymentMethod,
                deliverySlot: selectedTimeSlot,
                outletId:outletId,
                items: cartData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.product.price
                }))
            }

            const response = await apiRequest('/customer/outlets/customer-order', {
                method: 'POST',
                body: orderData
            })

            if (response.order) {
                Alert.alert(
                    'Order Placed Successfully!',
                    `Your order has been placed successfully.\nOrder ID: ${response.order.id}\nDelivery Time: ${selectedTimeSlotDisplay}`,
                    [
                        {
                            text: 'View Orders',
                            onPress: () => router.push('/(tabs)/orders')
                        }
                    ]
                )
            }
        } catch (error) {
            console.error('Recharge error:', error);

            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Error', 'Failed to recharge wallet');
            }
        } finally {
            setLoading(false)
        }
    }

    const OrderItem = ({ item }: { item: CartItem }) => (
        <View className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
            <View className="w-10 h-10 bg-yellow-100 rounded-xl items-center justify-center mr-3">
                <Text className="text-lg">{getCategoryIcon(item.product.category)}</Text>
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
        disabled = false
    }: {
        type: 'WALLET' | 'UPI'
        title: string
        subtitle: string
        icon: string
        onPress: () => void
        disabled?: boolean
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
            className={`mb-4 p-4 rounded-xl border-2 ${
                disabled 
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
                </View>
                <View className={`w-6 h-6 rounded-full border-2 ${
                    selectedPaymentMethod === type
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

    // Loading state
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
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity
                    className="p-2"
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
            >
                {/* Order Info */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-6"
                >
                    <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                        <View className="items-center mb-4">
                            <Text className="text-3xl mb-2">📋</Text>
                            <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
                        </View>

                        <View className="bg-yellow-50 rounded-xl p-4 mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-bold text-gray-900">
                                    Order #{new Date().getTime().toString().slice(-6)}
                                </Text>
                                <View className="bg-blue-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-medium text-blue-800">Pending</Text>
                                </View>
                            </View>
                            <Text className="text-sm text-gray-600">
                                Delivery Time: {selectedTimeSlotDisplay}
                            </Text>
                        </View>

                        {/* Order Items */}
                        <View className="mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Items Ordered</Text>
                            {cartData.items.map((item) => (
                                <OrderItem key={item.id} item={item} />
                            ))}
                        </View>

                        {/* Bill Summary */}
                        <View className="border-t border-gray-200 pt-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Bill Summary</Text>

                            <View className="space-y-2">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-700">Item Total</Text>
                                    <Text className="text-gray-900 font-medium">{formatCurrency(totalAmount)}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-700">Delivery Fee</Text>
                                    <Text className="text-gray-900 font-medium">{formatCurrency(deliveryFee)}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-700">Service Fee</Text>
                                    <Text className="text-gray-900 font-medium">{formatCurrency(serviceFee)}</Text>
                                </View>
                                <View className="flex-row justify-between items-center border-t border-gray-200 pt-3 mt-3">
                                    <Text className="text-lg font-bold text-gray-900">Total Amount</Text>
                                    <Text className="text-lg font-bold text-yellow-600">{formatCurrency(finalTotalAmount)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </MotiView>

                {/* Payment Methods */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 200 }}
                    className="mx-4 mb-6"
                >
                    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Choose Payment Method</Text>

                        <PaymentOption
                            type="WALLET"
                            title="Pay by Wallet"
                            subtitle={walletData 
                                ? `Available Balance: ${formatCurrency(walletData.balance)}`
                                : 'Loading wallet balance...'
                            }
                            icon="💳"
                            onPress={() => setSelectedPaymentMethod('WALLET')}
                            disabled={!walletData}
                        />

                        {/* Wallet Balance Details */}
                        {selectedPaymentMethod === 'WALLET' && walletData && (
                            <MotiView
                                from={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ type: 'timing', duration: 300 }}
                                className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200"
                            >
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
                                        <Text className={`text-base font-bold ${
                                            walletData.balance - finalTotalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
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
                            </MotiView>
                        )}

                        <PaymentOption
                            type="UPI"
                            title="Pay by Online Transaction"
                            subtitle="UPI, Card, Net Banking"
                            icon="🌐"
                            onPress={() => setSelectedPaymentMethod('UPI')}
                        />
                    </View>
                </MotiView>

                {/* Payment Button */}
                <View className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handlePayment}
                        activeOpacity={0.8}
                        className={`py-4 rounded-xl ${
                            selectedPaymentMethod && !loading
                                ? 'bg-yellow-400'
                                : 'bg-gray-300'
                        }`}
                        disabled={!selectedPaymentMethod || loading}
                    >
                        <View className="flex-row items-center justify-center">
                            {loading ? (
                                <ActivityIndicator size="small" color="#374151" />
                            ) : (
                                <>
                                    <Text className="text-xl mr-2">💳</Text>
                                    <Text className={`text-lg font-bold ${
                                        selectedPaymentMethod
                                            ? 'text-gray-900'
                                            : 'text-gray-500'
                                    }`}>
                                        {loading ? 'Processing...' : `Pay Now • ${formatCurrency(finalTotalAmount)}`}
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default OrderPayment