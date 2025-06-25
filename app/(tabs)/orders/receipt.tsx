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

const Receipt = () => {
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
        orderDate: params.orderDate as string,
        completedTime: params.completedTime as string
    } : {
        id: 1,
        orderNumber: '#ORD-001',
        foodName: 'Grilled Chicken',
        price: '$18.99',
        quantity: 2,
        image: '🍖',
        status: 'completed',
        orderTime: '2:30 PM',
        orderDate: 'March 15, 2024',
        completedTime: '3:00 PM'
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

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

    const ReceiptRow = ({ label, value, isTotal = false, isBold = false }: {
        label: string
        value: string
        isTotal?: boolean
        isBold?: boolean
    }) => (
        <View className={`flex-row justify-between items-center ${isTotal ? 'border-t border-gray-200 pt-3 mt-3' : 'mb-2'}`}>
            <Text className={`${isTotal ? 'text-lg font-bold' : isBold ? 'font-semibold' : 'font-medium'} ${isTotal ? 'text-gray-900' : 'text-gray-700'}`}>
                {label}
            </Text>
            <Text className={`${isTotal ? 'text-lg font-bold text-yellow-600' : isBold ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
                {value}
            </Text>
        </View>
    )

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View className="mb-3">
            <Text className="text-sm font-medium text-gray-600 mb-1">{label}</Text>
            <Text className="text-base text-gray-900">{value}</Text>
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
                <Text className="text-xl font-bold text-gray-900">Receipt</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Receipt Container */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-6"
                >
                    {/* Receipt Header */}
                    <View className="bg-white rounded-t-2xl px-6 py-6 border-b border-gray-100">
                        <View className="items-center mb-4">
                            <Text className="text-3xl mb-2">🧾</Text>
                            <Text className="text-2xl font-bold text-gray-900">Receipt</Text>
                            <Text className="text-sm text-gray-600 mt-1">Thank you for your order!</Text>
                        </View>

                        {/* Order Info */}
                        <View className="bg-yellow-50 rounded-xl p-4 mb-4">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-lg font-bold text-gray-900">{orderData.orderNumber}</Text>
                                    <Text className="text-sm text-gray-600">Order Date: {orderData.orderDate || 'Today'}</Text>
                                </View>
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-medium text-green-800">
                                        {orderData.status === 'completed' ? 'Completed' : 'Processed'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Order Details */}
                    <View className="bg-white px-6 py-6 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Order Details</Text>

                        {/* Food Item */}
                        <View className="flex-row mb-4 p-4 bg-gray-50 rounded-xl">
                            <View className="w-12 h-12 bg-yellow-100 rounded-xl items-center justify-center mr-4">
                                <Text className="text-xl">{orderData.image}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900">{orderData.foodName}</Text>
                                <Text className="text-sm text-gray-600">Quantity: {orderData.quantity}</Text>
                                <Text className="text-sm text-gray-600">Unit Price: {orderData.price}</Text>
                            </View>
                            <Text className="text-base font-bold text-gray-900">{formatCurrency(itemTotal)}</Text>
                        </View>
                    </View>

                    {/* Bill Summary */}
                    <View className="bg-white px-6 py-6 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Bill Summary</Text>

                        <ReceiptRow label="Item Total" value={formatCurrency(itemTotal)} isBold />
                        <ReceiptRow label="Delivery Fee" value={formatCurrency(deliveryFee)} />
                        <ReceiptRow label="Service Fee" value={formatCurrency(serviceFee)} />
                        <ReceiptRow label="Subtotal" value={formatCurrency(subtotal)} />
                        <ReceiptRow label={`GST (${(gstRate * 100).toFixed(0)}%)`} value={formatCurrency(gstAmount)} />

                        <ReceiptRow
                            label="Total Amount"
                            value={formatCurrency(totalAmount)}
                            isTotal
                        />
                    </View>

                    {/* Additional Information */}
                    <View className="bg-white px-6 py-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Order Information</Text>

                        <InfoRow
                            label="Restaurant"
                            value="Tasty Bites Restaurant"
                        />
                        <InfoRow
                            label="Order Time"
                            value={orderData.orderTime || '2:30 PM'}
                        />
                        {orderData.completedTime && (
                            <InfoRow
                                label="Completed Time"
                                value={orderData.completedTime}
                            />
                        )}
                        <InfoRow
                            label="Delivery Address"
                            value="123 Main Street, Apt 4B\nNew York, NY 10001"
                        />
                        <InfoRow
                            label="Payment Method"
                            value="Credit Card ending in 4532"
                        />
                    </View>

                    {/* Footer */}
                    <View className="bg-white rounded-b-2xl px-6 py-6 items-center">
                        <Text className="text-sm text-gray-600 text-center mb-2">
                            Questions about your order?
                        </Text>
                        <Text className="text-sm font-medium text-yellow-600">
                            Contact Support: +1 (555) 123-4567
                        </Text>
                    </View>
                </MotiView>

                {/* Action Buttons */}
                <View className="px-4 py-6">
                    <TouchableOpacity className="bg-yellow-400 py-4 rounded-xl mb-3">
                        <Text className="text-center font-bold text-gray-900 text-lg">Download Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-gray-100 py-4 rounded-xl">
                        <Text className="text-center font-medium text-gray-700 text-base">Share Receipt</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Receipt