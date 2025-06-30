import React from 'react'
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Share
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

const Receipt = () => {
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
            status: 'completed',
            orderTime: '2:30 PM',
            orderDate: 'Today'
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

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

    const handleShare = async () => {
        try {
            const receiptText = `
Receipt - ${orderData.orderNumber}
Date: ${orderData.orderDate || 'Today'}
Time: ${orderData.orderTime || 'N/A'}

Items:
${orderData.items.map(item =>
                `${item.foodName} x${item.quantity} - ${item.price}`
            ).join('\n')}

Subtotal: ${formatCurrency(itemsTotal)}
Delivery Fee: ${formatCurrency(deliveryFee)}
Service Fee: ${formatCurrency(serviceFee)}
GST (18%): ${formatCurrency(gstAmount)}
Total: ${formatCurrency(totalAmount)}

Thank you for your order!
            `
            await Share.share({
                message: receiptText,
                title: `Receipt ${orderData.orderNumber}`
            })
        } catch (error) {
            console.error('Error sharing receipt:', error)
        }
    }

    const InfoRow = ({ label, value, isTotal = false }: {
        label: string;
        value: string;
        isTotal?: boolean
    }) => (
        <View className={`flex-row justify-between items-center ${isTotal ? 'py-3 border-t border-gray-200' : 'mb-2'}`}>
            <Text className={`${isTotal ? 'text-lg font-bold' : 'text-sm font-medium'} text-gray-700`}>
                {label}
            </Text>
            <Text className={`${isTotal ? 'text-xl font-bold text-yellow-600' : 'text-base font-semibold'} text-gray-900`}>
                {value}
            </Text>
        </View>
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'placed':
                return 'bg-blue-100 text-blue-800'
            case 'processing':
                return 'bg-yellow-100 text-yellow-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'placed':
                return 'Order Placed'
            case 'processing':
                return 'On Processing'
            case 'completed':
                return 'Completed'
            case 'cancelled':
                return 'Cancelled'
            default:
                return 'Unknown'
        }
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
                <Text className="text-xl font-bold text-gray-900">Receipt</Text>
                <TouchableOpacity
                    className="p-2"
                    onPress={handleShare}
                >
                    <Text className="text-xl">📤</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Receipt Header */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-6"
                >
                    {/* Receipt Icon and Title */}
                    <View className="bg-white rounded-2xl px-6 py-8 mb-6 items-center">
                        <Text className="text-6xl mb-4">🧾</Text>
                        <Text className="text-2xl font-bold text-gray-900 mb-2">Order Receipt</Text>
                        <Text className="text-base text-gray-600 text-center">
                            Thank you for your order! Here's your detailed receipt.
                        </Text>
                    </View>

                    {/* Order Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Order Information</Text>

                        <View className="bg-gray-50 rounded-xl p-4 mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-bold text-gray-900">{orderData.orderNumber}</Text>
                                <View className={`px-3 py-1 rounded-full ${getStatusColor(orderData.status)}`}>
                                    <Text className="text-xs font-medium">{getStatusText(orderData.status)}</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Order Date:</Text>
                                <Text className="text-sm font-medium text-gray-900">{orderData.orderDate || 'Today'}</Text>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Order Time:</Text>
                                <Text className="text-sm font-medium text-gray-900">{orderData.orderTime || 'N/A'}</Text>
                            </View>
                            {orderData.completedTime && (
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text className="text-sm text-gray-600">Completed Time:</Text>
                                    <Text className="text-sm font-medium text-gray-900">{orderData.completedTime}</Text>
                                </View>
                            )}
                            {orderData.estimatedTime && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm text-gray-600">Estimated Time:</Text>
                                    <Text className="text-sm font-medium text-gray-900">{orderData.estimatedTime}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Order Items */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Order Items</Text>

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
                                        <Text className="text-sm text-gray-600 mb-1">Unit Price: {item.price}</Text>
                                        <Text className="text-sm text-gray-600">Quantity: {item.quantity}</Text>
                                    </View>
                                    <View className="items-end justify-center">
                                        <Text className="text-lg font-bold text-gray-900">{formatCurrency(itemTotal)}</Text>
                                    </View>
                                </MotiView>
                            )
                        })}
                    </View>

                    {/* Bill Summary */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Bill Summary</Text>

                        <View className="space-y-2">
                            <InfoRow label="Items Total" value={formatCurrency(itemsTotal)} />
                            <InfoRow label="Delivery Fee" value={formatCurrency(deliveryFee)} />
                            <InfoRow label="Service Fee" value={formatCurrency(serviceFee)} />
                            <InfoRow label="Subtotal" value={formatCurrency(subtotal)} />
                            <InfoRow label={`GST (${(gstRate * 100).toFixed(0)}%)`} value={formatCurrency(gstAmount)} />
                            <InfoRow label="Total Amount" value={formatCurrency(totalAmount)} isTotal={true} />
                        </View>
                    </View>

                    {/* Payment Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Payment Information</Text>

                        <View className="bg-green-50 rounded-xl p-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-medium text-green-800">Payment Method</Text>
                                <Text className="font-bold text-green-600">💳 Wallet</Text>
                            </View>
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-medium text-green-800">Amount Paid</Text>
                                <Text className="font-bold text-green-600">{formatCurrency(totalAmount)}</Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <Text className="font-medium text-green-800">Payment Status</Text>
                                <Text className="font-bold text-green-600">✅ Paid</Text>
                            </View>
                        </View>
                    </View>

                    {/* Contact Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Contact Information</Text>

                        <View className="space-y-3">
                            <View className="flex-row items-center">
                                <Text className="text-xl mr-3">📞</Text>
                                <View>
                                    <Text className="font-medium text-gray-900">Customer Support</Text>
                                    <Text className="text-sm text-gray-600">+1 (555) 123-4567</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-xl mr-3">📧</Text>
                                <View>
                                    <Text className="font-medium text-gray-900">Email Support</Text>
                                    <Text className="text-sm text-gray-600">support@foodapp.com</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-xl mr-3">🌐</Text>
                                <View>
                                    <Text className="font-medium text-gray-900">Website</Text>
                                    <Text className="text-sm text-gray-600">www.foodapp.com</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Thank You Message */}
                    <View className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl px-6 py-8">
                        <Text className="text-center text-2xl font-bold text-gray-900 mb-2">Thank You! 🙏</Text>
                        <Text className="text-center text-base text-gray-800 leading-6">
                            We appreciate your business and hope you enjoyed your meal.
                            Your feedback helps us serve you better!
                        </Text>
                    </View>
                </MotiView>

                {/* Action Buttons */}
                <View className="px-4 py-6 mb-16">
                    <TouchableOpacity
                        className="bg-yellow-400 py-4 rounded-xl mb-3"
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Text className="text-center font-bold text-gray-900 text-lg">Order Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-100 py-4 rounded-xl mb-3"
                        onPress={() => router.push('/(tabs)/orders')}
                    >
                        <Text className="text-center font-medium text-gray-700 text-base">View All Orders</Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity
                        className="bg-blue-100 py-4 rounded-xl"
                        onPress={handleShare}
                    >
                        <Text className="text-center font-medium text-blue-700 text-base">Share Receipt</Text>
                    </TouchableOpacity> */}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Receipt