import React, { useState } from 'react'
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert
} from 'react-native'
import { MotiView } from 'moti'
import { useLocalSearchParams, useRouter } from 'expo-router'

const OrderPayment = () => {
    const router = useRouter()
    const params = useLocalSearchParams()

    // Wallet balance state
    const [walletBalance] = useState(150.75) // Sample wallet balance
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'online' | null>(null)

    // Sample order data - in real app this would come from params/context
    const orderData = {
        orderNumber: '#ORD-2024-001',
        orderDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        status: 'Processed',
        items: [
            {
                id: 1,
                name: 'Chicken Burger',
                quantity: 2,
                price: 12.99,
                icon: '🍔'
            },
            {
                id: 2,
                name: 'Pizza Margherita',
                quantity: 1,
                price: 15.50,
                icon: '🍕'
            },
            {
                id: 3,
                name: 'Caesar Salad',
                quantity: 3,
                price: 8.99,
                icon: '🥗'
            }
        ]
    }

    // Calculate totals
    const itemTotal = orderData.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    const deliveryFee = 2.99
    const serviceFee = 1.50
    const totalAmount = itemTotal + deliveryFee + serviceFee

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

    const handlePayment = () => {
        if (!selectedPaymentMethod) {
            Alert.alert('Select Payment Method', 'Please choose how you want to pay')
            return
        }

        if (selectedPaymentMethod === 'wallet' && walletBalance < totalAmount) {
            Alert.alert('Insufficient Balance', 'Your wallet balance is insufficient for this order')
            return
        }

        Alert.alert(
            'Payment Successful',
            `Order paid successfully using ${selectedPaymentMethod === 'wallet' ? 'Wallet' : 'Online Payment'}`,
            [
                {
                    text: 'OK',
                    onPress: () => router.push('/(tabs)/orders')
                }
            ]
        )
    }

    const OrderItem = ({ item }: { item: any }) => (
        <View className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
            <View className="w-10 h-10 bg-yellow-100 rounded-xl items-center justify-center mr-3">
                <Text className="text-lg">{item.icon}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">{item.name}</Text>
                <Text className="text-sm text-gray-600">Qty: {item.quantity}</Text>
            </View>
            <Text className="text-base font-semibold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
            </Text>
        </View>
    )

    const PaymentOption = ({
        type,
        title,
        subtitle,
        icon,
        onPress
    }: {
        type: 'wallet' | 'online'
        title: string
        subtitle: string
        icon: string
        onPress: () => void
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`mb-4 p-4 rounded-xl border-2 ${selectedPaymentMethod === type
                ? 'bg-yellow-50 border-yellow-400'
                : 'bg-white border-gray-200'
                }`}
        >
            <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4">
                    <Text className="text-xl">{icon}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">{title}</Text>
                    <Text className="text-sm text-gray-600">{subtitle}</Text>
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

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity
                    className="p-2"
                    onPress={() => router.back()}
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
                                <Text className="text-lg font-bold text-gray-900">{orderData.orderNumber}</Text>
                                <View className="bg-blue-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-medium text-blue-800">{orderData.status}</Text>
                                </View>
                            </View>
                            <Text className="text-sm text-gray-600">Order Date: {orderData.orderDate}</Text>
                        </View>

                        {/* Order Items */}
                        <View className="mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Items Ordered</Text>
                            {orderData.items.map((item) => (
                                <OrderItem key={item.id} item={item} />
                            ))}
                        </View>

                        {/* Bill Summary */}
                        <View className="border-t border-gray-200 pt-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Bill Summary</Text>

                            <View className="space-y-2">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-700">Item Total</Text>
                                    <Text className="text-gray-900 font-medium">{formatCurrency(itemTotal)}</Text>
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
                                    <Text className="text-lg font-bold text-yellow-600">{formatCurrency(totalAmount)}</Text>
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
                            type="wallet"
                            title="Pay by Wallet"
                            subtitle={`Available Balance: ${formatCurrency(walletBalance)}`}
                            icon="💳"
                            onPress={() => setSelectedPaymentMethod('wallet')}
                        />

                        {/* Wallet Balance Details */}
                        {selectedPaymentMethod === 'wallet' && (
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
                                        <Text className="text-gray-900 font-medium">{formatCurrency(walletBalance)}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-700">Order Total</Text>
                                        <Text className="text-red-600 font-medium">-{formatCurrency(totalAmount)}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center border-t border-blue-200 pt-2 mt-2">
                                        <Text className="text-base font-semibold text-gray-900">Balance After Payment</Text>
                                        <Text className={`text-base font-bold ${walletBalance - totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {formatCurrency(walletBalance - totalAmount)}
                                        </Text>
                                    </View>
                                </View>
                                {walletBalance < totalAmount && (
                                    <View className="mt-3 p-2 bg-red-100 rounded-lg">
                                        <Text className="text-red-700 text-sm font-medium">
                                            Insufficient wallet balance. Please choose online payment or add funds to your wallet.
                                        </Text>
                                    </View>
                                )}
                            </MotiView>
                        )}

                        <PaymentOption
                            type="online"
                            title="Pay by Online Transaction"
                            subtitle="UPI, Card, Net Banking"
                            icon="🌐"
                            onPress={() => setSelectedPaymentMethod('online')}
                        />
                    </View>
                </MotiView>

                {/* Payment Button */}
                <View className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handlePayment}
                        activeOpacity={0.8}
                        className={`py-4 rounded-xl ${selectedPaymentMethod
                            ? 'bg-yellow-400'
                            : 'bg-gray-300'
                            }`}
                        disabled={!selectedPaymentMethod}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-xl mr-2">💳</Text>
                            <Text className={`text-lg font-bold ${selectedPaymentMethod
                                ? 'text-gray-900'
                                : 'text-gray-500'
                                }`}>
                                Pay Now • {formatCurrency(totalAmount)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default OrderPayment