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

// Define the OrderItem type based on actual API response
interface OrderItem {
    id: number
    foodName: string
    price: string // API returns string like "$9.99"
    quantity: number
    image: string
}

// Define the Order type based on actual API response
interface Order {
    id: number;
    orderNumber: string;
    items: OrderItem[];
    totalPrice: string;
    status: string;
    orderDate: string; // formatted order date
    orderTime: string; // formatted order time
    completedTime: string;
    outlet: {
        id: number;
        name: string;
        address: string;
    };
    deliveryDate: string;  // add
    deliverySlot: string;  // add
    paymentMethod?: string; // add
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};


const Receipt = () => {
    const router = useRouter()
    const params = useLocalSearchParams()

    let orderData: Order
    try {
        orderData = JSON.parse(params.orderData as string)
        console.log('Order Data:', JSON.stringify(orderData, null, 2))
        console.log('Items:', JSON.stringify(orderData.items, null, 2))
    } catch (error) {
        console.error('Error parsing order data:', error)
        router.back()
        return null
    }

    const parsePrice = (priceString: string): number => {
        if (!priceString) return 0
        // Remove both $ and ₹ symbols, and commas
        const cleanPrice = priceString.replace(/[$₹,]/g, '').trim()
        return parseFloat(cleanPrice) || 0
    }

    const calculateItemsTotal = () => {
        if (!orderData.items || orderData.items.length === 0) return 0
        return orderData.items.reduce((total, item) => {
            const price = parsePrice(item.price)
            const quantity = item.quantity || 1
            return total + price * quantity
        }, 0)
    }

    const itemsTotal = calculateItemsTotal()
    const actualTotalAmount = parsePrice(orderData.totalPrice)
    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`
    const orderDate = orderData.orderDate || 'N/A'
    const orderTime = orderData.orderTime || 'N/A'

    const getPaymentMethodText = (method: string = 'WALLET') => {
        const methodMap: { [key: string]: { text: string; icon: string } } = {
            UPI: { text: 'UPI Payment', icon: '📱' },
            CARD: { text: 'Card Payment', icon: '💳' },
            CASH: { text: 'Cash Payment', icon: '💵' },
            WALLET: { text: 'Wallet Payment', icon: '👛' }
        }
        return methodMap[method] || { text: 'Wallet Payment', icon: '👛' }
    }

    const handleShare = async () => {
        try {
            const receiptText = `
Receipt - Order ${orderData.orderNumber}
Date: ${orderDate}
Time: ${orderTime}Delivery Date: ${orderData.deliveryDate}
Delivery Slot: ${orderData.deliverySlot}
Outlet: ${orderData.outlet.name}

Items:
${orderData.items
                    .map(item => {
                        const price = parsePrice(item.price)
                        return `${item.foodName} x${item.quantity} - ${formatCurrency(price)}`
                    })
                    .join('\n')}

Items Total: ${formatCurrency(itemsTotal)}
Total Amount: ${formatCurrency(actualTotalAmount)}

Payment: ${getPaymentMethodText().text}
Status: ${orderData.status}

Thank you for your order!
        `
            await Share.share({
                message: receiptText,
                title: `Receipt Order ${orderData.orderNumber}`
            })
        } catch (error) {
            console.error('Error sharing receipt:', error)
        }
    }

    const InfoRow = ({
        label,
        value,
        isTotal = false
    }: {
        label: string
        value: string
        isTotal?: boolean
    }) => (
        <View
            className={`flex-row justify-between items-center ${isTotal ? 'py-3 border-t border-gray-200' : 'mb-2'
                }`}
        >
            <Text
                className={`${isTotal ? 'text-lg font-bold' : 'text-sm font-medium'
                    } text-gray-700`}
            >
                {label}
            </Text>
            <Text
                className={`${isTotal ? 'text-xl font-bold text-yellow-600' : 'text-base font-semibold'
                    } text-gray-900`}
            >
                {value}
            </Text>
        </View>
    )

    const getStatusColor = (status: string) => {
        const lowerStatus = status.toLowerCase()
        switch (lowerStatus) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'delivered':
                return 'bg-green-100 text-green-800'
            case 'partially_delivered':
                return 'bg-blue-100 text-blue-800'
            case 'partial_cancel':
                return 'bg-orange-100 text-orange-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        const lowerStatus = status.toLowerCase()
        switch (lowerStatus) {
            case 'pending':
                return 'Order Pending'
            case 'delivered':
                return 'Delivered'
            case 'partially_delivered':
                return 'Partially Delivered'
            case 'partial_cancel':
                return 'Partially Cancelled'
            case 'cancelled':
                return 'Cancelled'
            default:
                return status.charAt(0).toUpperCase() + status.slice(1)
        }
    }

    const paymentMethodInfo = getPaymentMethodText(orderData.paymentMethod)

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
                <View
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-6"
                >
                    {/* Receipt Header */}
                    <View className="bg-white rounded-2xl px-6 py-8 mb-6 items-center shadow">
                        <Text className="text-2xl font-bold text-gray-900 mb-2">
                            Order Receipt
                        </Text>
                        <Text className="text-base text-gray-600 text-center">
                            Thank you for your order! Here's your detailed receipt.
                        </Text>
                    </View>

                    {/* Order Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Order Information
                        </Text>

                        <View className="bg-gray-50 rounded-xl p-4 mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-bold text-gray-900">
                                    Order {orderData.orderNumber}
                                </Text>
                                <View
                                    className={`px-3 py-1 rounded-full ${getStatusColor(
                                        orderData.status
                                    )}`}
                                >
                                    <Text className="text-xs font-medium">
                                        {getStatusText(orderData.status)}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Order Date:</Text>
                                <Text className="text-sm font-medium text-gray-900">{orderDate}</Text>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Order Time:</Text>
                                <Text className="text-sm font-medium text-gray-900">{orderTime}</Text>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Delivery Date:</Text>
                                <Text className="text-sm font-medium text-gray-900">{formatDate(orderData.deliveryDate)}</Text>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Delivery Slot:</Text>
                                <Text className="text-sm font-medium text-gray-900">{orderData.deliverySlot}</Text>
                            </View>

                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-sm text-gray-600">Outlet:</Text>
                                <Text className="text-sm font-medium text-gray-900">
                                    {orderData.outlet.name}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Order Items */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Order Items
                        </Text>

                        {orderData.items && orderData.items.length > 0 ? (
                            orderData.items.map((item, index) => {
                                const price = parsePrice(item.price)
                                const quantity = item.quantity || 1
                                const itemTotal = price * quantity

                                return (
                                    <View
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
                                        {/* Product Image */}
                                        <Image
                                            source={{ uri: item.image }}
                                            className="w-16 h-16 rounded-xl mr-4"
                                            resizeMode="cover"
                                        />

                                        {/* Item Info */}
                                        <View className="flex-1 justify-center">
                                            <Text className="text-lg font-semibold text-gray-900 mb-1">
                                                {item.foodName}
                                            </Text>
                                            <Text className="text-sm text-gray-600 mb-1">
                                                Unit Price: {formatCurrency(price)}
                                            </Text>
                                            <Text className="text-sm text-gray-600">
                                                Quantity: {quantity}
                                            </Text>
                                        </View>

                                        {/* Item Total */}
                                        <View className="items-end justify-center">
                                            <Text className="text-lg font-bold text-gray-900">
                                                {formatCurrency(itemTotal)}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            })
                        ) : (
                            <Text className="text-center text-gray-500 py-4">
                                No items found
                            </Text>
                        )}
                    </View>

                    {/* Bill Summary */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Bill Summary
                        </Text>
                        <View className="space-y-2">
                            <InfoRow label="Items Total" value={formatCurrency(itemsTotal)} />
                            <InfoRow
                                label="Total Amount"
                                value={formatCurrency(actualTotalAmount)}
                                isTotal={true}
                            />
                        </View>
                    </View>

                    {/* Payment Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-6 shadow">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Payment Information
                        </Text>
                        <View className="bg-gray-50 rounded-xl p-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-medium text-gray-800">Payment Method</Text>
                                <Text className="font-bold text-gray-900">
                                    {paymentMethodInfo.text}
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-medium text-gray-800">Amount Paid</Text>
                                <Text className="font-bold text-gray-900">
                                    {formatCurrency(actualTotalAmount)}
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-medium text-gray-800">Order ID</Text>
                                <Text className="font-bold text-gray-900 text-xs">
                                    {orderData.orderNumber}
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <Text className="font-medium text-green-800">
                                    Payment Status
                                </Text>
                                <Text className="font-bold text-green-600">
                                    {orderData.status.toLowerCase() === 'cancelled'
                                        ? 'Refunded'
                                        : '✅ Paid'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Contact Information */}
                    <View className="bg-white rounded-2xl px-6 py-6 mb-3 shadow">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Contact Information
                        </Text>
                        <View className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <View className="flex-row items-center">
                                <Text className="text-xl mr-3">📞</Text>
                                <View>
                                    <Text className="font-medium text-gray-900">
                                        Customer Support
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        +1 (555) 123-4567
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-xl mr-3">📧</Text>
                                <View>
                                    <Text className="font-medium text-gray-900">
                                        Email Support
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        support@foodapp.com
                                    </Text>
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
                    {/* <View className=" rounded-2xl px-6 py-4 ">
                    <Text className="text-center text-2xl font-bold text-gray-900">
                        Thank You!
                    </Text>
                </View> */}
                </View>

                {/* Action Buttons */}
                <View className="px-4 mb-4 mt-4">
                    <TouchableOpacity
                        className="bg-background py-4 rounded-xl"
                        onPress={() =>
                            router.push({
                                pathname: "/(tabs)/orders",
                            })
                        }
                    >
                        <Text className="text-center font-medium text-black text-base">
                            View All Orders
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Receipt
