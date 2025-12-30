import React from 'react'
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Share,
    Image
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

interface OrderItem {
    id: number
    foodName: string
    price: string
    quantity: number
    image: string
}

interface Order {
    id: number;
    orderNumber: string;
    items: OrderItem[];
    totalPrice: string;
    status: string;
    orderDate: string;
    orderTime: string;
    completedTime: string;
    outlet: {
        id: number;
        name: string;
        address: string;
    };
    deliveryDate: string;
    deliverySlot: string;
}

// Helper to format Date
const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const formatSlotDisplay = (slot: string) => {
    if (!slot) return 'N/A';

    const match = slot.match(/(\d{1,2})_(\d{1,2})/);
    if (!match) return slot;

    const start24 = parseInt(match[1], 10);
    const end24 = parseInt(match[2], 10);

    const convertTo12Hr = (h: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12} ${period}`;
    };

    return `${convertTo12Hr(start24)} - ${convertTo12Hr(end24)}`;
};

const Receipt = () => {
    const router = useRouter()
    const params = useLocalSearchParams()

    let orderData: Order
    try {
        orderData = JSON.parse(params.orderData as string)
    } catch (error) {
        console.error('Error parsing order data:', error)
        router.back()
        return null
    }

    const parsePrice = (priceString: string): number => {
        if (!priceString) return 0
        const cleanPrice = priceString.replace(/[^\d.]/g, '')
        return parseFloat(cleanPrice) || 0
    }

    const actualTotalAmount = parsePrice(orderData.totalPrice)
    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`

    const orderDate = orderData.orderDate || 'N/A'
    const orderTime = orderData.orderTime || 'N/A'
    const formattedSlot = formatSlotDisplay(orderData.deliverySlot)

    const handleShare = async () => {
        try {
            const receiptText = `
Receipt - Order ${orderData.orderNumber}
Date: ${orderDate}
Time: ${orderTime}
Delivery Date: ${formatDate(orderData.deliveryDate)}
Delivery Slot: ${formattedSlot}
Outlet: ${orderData.outlet.name}

Items:
${orderData.items
                    .map(item => `${item.foodName} x${item.quantity} - ${formatCurrency(parsePrice(item.price))}`)
                    .join('\n')}

Total Amount: ${formatCurrency(actualTotalAmount)}
Payment Status: Successful
        `
            await Share.share({
                message: receiptText,
                title: `Receipt Order ${orderData.orderNumber}`
            })
        } catch (error) {
            console.error('Error sharing receipt:', error)
        }
    }

    const InfoRow = ({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean }) => (
        <View className={`flex-row justify-between items-center ${isTotal ? 'py-3 border-t border-gray-200 mt-2' : 'mb-2'}`}>
            <Text className={`${isTotal ? 'text-lg font-bold' : 'text-sm font-medium'} text-gray-700`}>
                {label}
            </Text>
            <Text className={`${isTotal ? 'text-xl font-bold text-yellow-600' : 'text-base font-semibold'} text-gray-900`}>
                {value}
            </Text>
        </View>
    )

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Receipt</Text>
                <TouchableOpacity className="bg-yellow-400 px-4 py-2 rounded-full" onPress={handleShare}>
                    <Text className="font-semibold text-gray-900">Share</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="mx-4 mt-6">
                    {/* Success Header */}
                    <View className="bg-white rounded-2xl px-6 py-8 mb-6 items-center shadow-sm">
                        <View className="bg-green-100 p-3 rounded-full mb-3">
                            <Text className="text-2xl">✅</Text>
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mb-2">Order Success</Text>
                        <Text className="text-base text-gray-600 text-center">
                            Your order is confirmed and scheduled for delivery.
                        </Text>
                    </View>

                    {/* Order Details */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Order Details</Text>
                        <View className="bg-gray-50 rounded-xl p-4">
                            <InfoRow label="Order Number" value={orderData.orderNumber} />
                            <InfoRow label="Order Date" value={orderDate} />
                            <InfoRow label="Delivery Date" value={formatDate(orderData.deliveryDate)} />
                            <InfoRow label="Delivery Slot" value={formattedSlot} />
                            <InfoRow label="Outlet" value={orderData.outlet.name} />
                        </View>
                    </View>

                    {/* Items List */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Items Ordered</Text>
                        {orderData.items.map((item) => (
                            <View key={item.id} className="flex-row p-3 bg-gray-50 rounded-xl mb-3 items-center">
                                <Image source={{ uri: item.image }} className="w-12 h-12 rounded-lg mr-4" />
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-900">{item.foodName}</Text>
                                    <Text className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(parsePrice(item.price))}</Text>
                                </View>
                                <Text className="font-bold text-gray-900">{formatCurrency(parsePrice(item.price) * item.quantity)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Summary */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Bill Summary</Text>
                        <InfoRow label="Items Total" value={formatCurrency(actualTotalAmount)} />
                        <InfoRow label="Additional Charges" value={formatCurrency(0)} />
                        <InfoRow label="Total Amount" value={formatCurrency(actualTotalAmount)} isTotal={true} />
                    </View>

                    {/* Payment Status */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-10 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Payment Info</Text>
                        <View className="bg-gray-50 rounded-xl p-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Method</Text>
                                <Text className="font-bold text-gray-900">UPI Payment</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Amount Paid</Text>
                                <Text className="font-bold text-gray-900">{formatCurrency(actualTotalAmount)}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-600">Status</Text>
                                <Text className="font-bold text-green-600">Successful</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-yellow-400 py-4 rounded-xl mb-10"
                        onPress={() => router.push("/(tabs)/orders")}
                    >
                        <Text className="text-center font-bold text-gray-900 text-base">Back to My Orders</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Receipt