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

// Define the OrderItem type
interface OrderItem {
    id: number;
    foodName: string;
    price: string;
    quantity: number;
    image: string;
}

// Define the Order type
interface Order {
    id: number;
    orderNumber: string;
    items: OrderItem[];
    totalPrice: string;
    status: string;
    orderTime?: string;
    estimatedTime?: string;
    orderDate?: string;
    completedTime?: string;
}

const Cancel = () => {
    const router = useRouter()
    const params = useLocalSearchParams()

    // Parse order data from params
    let orderData: Order
    try {
        orderData = JSON.parse(params.orderData as string)
    } catch (error) {
        // Fallback data if parsing fails
        orderData = {
            id: 1,
            orderNumber: '#ORD-001',
            items: [
                { id: 1, foodName: 'Grilled Chicken', price: '$18.99', quantity: 2, image: '🍖' }
            ],
            totalPrice: '$55.96',
            status: 'cancelled',
            orderTime: '2:30 PM',
        }
    }

    // Calculate totals
    const calculateItemsTotal = () => {
        return orderData.items.reduce((total, item) => {
            const price = parseFloat(item.price.replace('$', ''))
            return total + (price * item.quantity)
        }, 0)
    }

    const itemsTotal = calculateItemsTotal()
    const deliveryFee = 2.99
    const serviceFee = 1.50
    const subtotal = itemsTotal + deliveryFee + serviceFee
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

    const handleBackToOrders = () => {
        router.push('/(tabs)/orders')
    }

    const handleBrowseFood = () => {
        router.push('/(tabs)/orders')
    }

    const handleContactSupport = () => {
        // Handle contact support navigation
        console.log('Contact support pressed')
    }

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
                                    <Text className="text-sm text-gray-600">Order Time: {orderData.orderTime}</Text>
                                </View>
                                <View className="bg-red-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-medium text-red-800">Cancelled</Text>
                                </View>
                            </View>
                        </View>

                        {/* All Food Items */}
                        <Text className="text-base font-semibold text-gray-900 mb-3">Cancelled Items:</Text>
                        {orderData.items.map((item, index) => {
                            const itemPrice = parseFloat(item.price.replace('$', ''))
                            const itemTotal = itemPrice * item.quantity

                            return (
                                <MotiView
                                    key={item.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{
                                        type: 'timing',
                                        duration: 300,
                                        delay: index * 100
                                    }}
                                    className="flex-row p-4 bg-gray-50 rounded-xl mb-3"
                                >
                                    <View className="w-16 h-16 bg-yellow-100 rounded-xl items-center justify-center mr-4">
                                        <Text className="text-2xl">{item.image}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-gray-900 mb-1">{item.foodName}</Text>
                                        <Text className="text-sm text-gray-600">Unit Price: {item.price}</Text>
                                        <Text className="text-sm text-gray-600">Quantity: {item.quantity}</Text>
                                    </View>
                                    <View className="items-end justify-center">
                                        <Text className="text-lg font-bold text-gray-900">{formatCurrency(itemTotal)}</Text>
                                    </View>
                                </MotiView>
                            )
                        })}

                        {/* Order Summary */}
                        <View className="bg-yellow-50 rounded-xl p-4 mt-2">
                            <View className="flex-row justify-between items-center">
                                <Text className="font-semibold text-gray-900">Total Items:</Text>
                                <Text className="font-bold text-gray-900">{orderData.items.length}</Text>
                            </View>
                            <View className="flex-row justify-between items-center mt-1">
                                <Text className="font-semibold text-gray-900">Items Total:</Text>
                                <Text className="font-bold text-yellow-600">{formatCurrency(itemsTotal)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Refund Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Refund Information</Text>

                        <View className="space-y-2">
                            <InfoRow label="Items Total" value={formatCurrency(itemsTotal)} />
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

                    {/* Refund Breakdown by Item */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Refund Breakdown</Text>

                        {orderData.items.map((item, index) => {
                            const itemPrice = parseFloat(item.price.replace('$', ''))
                            const itemTotal = itemPrice * item.quantity

                            return (
                                <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                    <View className="flex-1">
                                        <Text className="font-medium text-gray-900">{item.foodName}</Text>
                                        <Text className="text-sm text-gray-600">{item.quantity} x {item.price}</Text>
                                    </View>
                                    <Text className="font-semibold text-gray-900">{formatCurrency(itemTotal)}</Text>
                                </View>
                            )
                        })}

                        <View className="mt-3 pt-3 border-t border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="font-bold text-gray-900">Total Refunded:</Text>
                                <Text className="font-bold text-green-600">{formatCurrency(refundAmount)}</Text>
                            </View>
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

                            <View className="flex-row items-start">
                                <Text className="text-xl mr-3">⭐</Text>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">Your Feedback Matters</Text>
                                    <Text className="text-sm text-gray-600">Help us improve by sharing your experience.</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="space-y-3 mb-8">
                        <TouchableOpacity
                            className="bg-yellow-400 py-4 rounded-2xl"
                            onPress={handleBrowseFood}
                        >
                            <Text className="text-center font-bold text-gray-900 text-lg">Browse Food Again</Text>
                        </TouchableOpacity>


                    </View>

                    {/* Cancellation Policy */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Cancellation Policy</Text>

                        <View className="space-y-3">
                            <View className="flex-row items-start">
                                <View className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></View>
                                <Text className="text-sm text-gray-600 flex-1">
                                    Orders can be cancelled free of charge before restaurant confirmation.
                                </Text>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></View>
                                <Text className="text-sm text-gray-600 flex-1">
                                    Full refunds are processed instantly to your wallet.
                                </Text>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></View>
                                <Text className="text-sm text-gray-600 flex-1">
                                    Wallet balance can be used for future orders or withdrawn.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer Message */}
                    <View className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-3 items-center mb-16">
                        <Text className="text-4xl mb-3">🤗</Text>
                        <Text className="text-lg font-bold text-gray-900 mb-2">We Miss You Already!</Text>
                        <Text className="text-sm text-gray-600 text-center">
                            Thank you for choosing us. We hope to serve you again soon with amazing food and great service!
                        </Text>
                    </View>
                </MotiView>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Cancel