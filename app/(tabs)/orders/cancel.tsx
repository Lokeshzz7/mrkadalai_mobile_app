import React from 'react'
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView
} from 'react-native'
import { MotiView } from 'moti'
import { useLocalSearchParams, useRouter } from 'expo-router'

const Cancel = () => {
    const router = useRouter()
    const params = useLocalSearchParams()

    // Get order data from params or use sample data
    const orderData = params.orderNumber ? {
        id: parseInt(params.id as string) || 1,
        orderNumber: params.orderNumber as string,
        foodName: params.foodName as string,
        price: params.price as string,
        quantity: parseInt(params.quantity as string) || 1,
        image: params.image as string,
        status: params.status as string,
        orderTime: params.orderTime as string,
    } : {
        id: 1,
        orderNumber: '#ORD-001',
        foodName: 'Grilled Chicken',
        price: '$18.99',
        quantity: 2,
        image: '🍖',
        status: 'cancelled',
        orderTime: '2:30 PM',
    }

    // Extract numeric value from price string
    const priceValue = parseFloat(orderData.price.replace('$', ''))

    // Calculate amounts
    const itemTotal = priceValue * orderData.quantity
    const deliveryFee = 2.99
    const serviceFee = 1.50
    const subtotal = itemTotal + deliveryFee + serviceFee
    const gstRate = 0.18 // 18% GST
    const gstAmount = subtotal * gstRate
    const totalAmount = subtotal + gstAmount

    // Wallet information
    const previousWalletBalance = 150.75
    const refundAmount = totalAmount
    const newWalletBalance = previousWalletBalance + refundAmount

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-medium text-gray-600">{label}</Text>
            <Text className="text-base font-semibold text-gray-900">{value}</Text>
        </View>
    )

    const WalletRow = ({ label, value, isHighlighted = false }: {
        label: string
        value: string
        isHighlighted?: boolean
    }) => (
        <View className={`flex-row justify-between items-center py-3 px-4 rounded-xl mb-2 ${isHighlighted ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Text className={`font-medium ${isHighlighted ? 'text-green-800' : 'text-gray-700'}`}>
                {label}
            </Text>
            <Text className={`font-bold text-lg ${isHighlighted ? 'text-green-600' : 'text-gray-900'}`}>
                {value}
            </Text>
        </View>
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
                <Text className="text-xl font-bold text-gray-900">Order Cancelled</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Sorry Message */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-6"
                >
                    {/* Sorry Header */}
                    <View className="bg-white rounded-2xl px-6 py-8 mb-6 items-center">
                        <Text className="text-6xl mb-4">😔</Text>
                        <Text className="text-2xl font-bold text-gray-900 mb-2">We're Sorry!</Text>
                        <Text className="text-base text-gray-600 text-center leading-6">
                            Your order has been successfully cancelled. We understand plans can change, and we're here whenever you're ready to order again.
                        </Text>
                    </View>

                    {/* Cancelled Order Details */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Cancelled Order Details</Text>

                        {/* Order Info */}
                        <View className="bg-red-50 rounded-xl p-4 mb-4">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-lg font-bold text-gray-900">{orderData.orderNumber}</Text>
                                    <Text className="text-sm text-gray-600">Cancelled on {new Date().toLocaleDateString()}</Text>
                                </View>
                                <View className="bg-red-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-medium text-red-800">Cancelled</Text>
                                </View>
                            </View>
                        </View>

                        {/* Food Item */}
                        <View className="flex-row p-4 bg-gray-50 rounded-xl">
                            <View className="w-16 h-16 bg-yellow-100 rounded-xl items-center justify-center mr-4">
                                <Text className="text-2xl">{orderData.image}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-semibold text-gray-900 mb-1">{orderData.foodName}</Text>
                                <Text className="text-sm text-gray-600">Quantity: {orderData.quantity}</Text>
                                <Text className="text-sm text-gray-600">Unit Price: {orderData.price}</Text>
                                <Text className="text-sm text-gray-600">Order Time: {orderData.orderTime}</Text>
                            </View>
                            <Text className="text-lg font-bold text-gray-900">{formatCurrency(itemTotal)}</Text>
                        </View>
                    </View>

                    {/* Refund Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Refund Information</Text>

                        <View className="space-y-2">
                            <InfoRow label="Item Total" value={formatCurrency(itemTotal)} />
                            <InfoRow label="Delivery Fee" value={formatCurrency(deliveryFee)} />
                            <InfoRow label="Service Fee" value={formatCurrency(serviceFee)} />
                            <InfoRow label="Subtotal" value={formatCurrency(subtotal)} />
                            <InfoRow label={`GST (${(gstRate * 100).toFixed(0)}%)`} value={formatCurrency(gstAmount)} />

                            <View className="border-t border-gray-200 pt-3 mt-3">
                                <InfoRow label="Total Refund Amount" value={formatCurrency(refundAmount)} />
                            </View>
                        </View>
                    </View>

                    {/* Wallet Balance Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Wallet Balance</Text>

                        <View className="space-y-2">
                            <WalletRow
                                label="Previous Wallet Balance"
                                value={formatCurrency(previousWalletBalance)}
                            />
                            <WalletRow
                                label="Refunded Amount"
                                value={`+ ${formatCurrency(refundAmount)}`}
                            />
                            <WalletRow
                                label="Current Wallet Balance"
                                value={formatCurrency(newWalletBalance)}
                                isHighlighted={true}
                            />
                        </View>

                        <View className="mt-4 p-4 bg-blue-50 rounded-xl">
                            <Text className="text-sm text-blue-800 text-center">
                                💡 Your refund has been processed and added to your wallet balance instantly!
                            </Text>
                        </View>
                    </View>

                    {/* Additional Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">What's Next?</Text>

                        <View className="space-y-3">
                            <View className="flex-row items-start">
                                <Text className="text-xl mr-3">🔄</Text>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">Instant Refund</Text>
                                    <Text className="text-sm text-gray-600">Your refund has been added to your wallet and is ready to use.</Text>
                                </View>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-xl mr-3">🍽️</Text>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">Order Again</Text>
                                    <Text className="text-sm text-gray-600">Use your wallet balance for your next delicious order.</Text>
                                </View>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-xl mr-3">💬</Text>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">Need Help?</Text>
                                    <Text className="text-sm text-gray-600">Contact our support team if you have any questions.</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </MotiView>

                {/* Action Buttons */}
                <View className="px-4 py-6">
                    <TouchableOpacity
                        className="bg-yellow-400 py-4 rounded-xl mb-3"
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Text className="text-center font-bold text-gray-900 text-lg">Continue Shopping</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-100 py-4 rounded-xl mb-3"
                        onPress={() => router.push('/(tabs)/orders')}
                    >
                        <Text className="text-center font-medium text-gray-700 text-base">View My Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-blue-100 py-4 rounded-xl">
                        <Text className="text-center font-medium text-blue-700 text-base">Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Cancel