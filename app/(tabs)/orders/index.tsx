import React, { useState, useEffect } from 'react'
import {
    FlatList,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { useRouter } from 'expo-router'
import { apiRequest } from '../../../utils/api'
import Receipt from './receipt'
import Cancel from './cancel'

// Define the OrderItem type based on backend response
interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        id: number;
        name: string;
        description: string;
        price: number;
    };
}

// Define the Order type based on backend response
interface Order {
    id: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    customerId: number;
    outletId: number;
    items: OrderItem[];
    outlet: {
        id: number;
        name: string;
        address: string;
    };
}

// Transform backend order to frontend format
interface TransformedOrderItem {
    id: number;
    foodName: string;
    price: string;
    quantity: number;
    image: string;
}

interface TransformedOrder {
    id: number;
    orderNumber: string;
    items: TransformedOrderItem[];
    totalPrice: string;
    status: string;
    orderTime?: string;
    estimatedTime?: string;
    orderDate?: string;
    completedTime?: string;
    outlet?: {
        id: number;
        name: string;
        address: string;
    };
}

const MyOrders = () => {
    const [activeTab, setActiveTab] = useState('ongoing')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<TransformedOrder | null>(null)
    const [ongoingOrders, setOngoingOrders] = useState<TransformedOrder[]>([])
    const [orderHistory, setOrderHistory] = useState<TransformedOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const router = useRouter()

    // Get random food emoji for items
    const getFoodEmoji = () => {
        const emojis = ['🍖', '🥗', '🧃', '🍔', '🍟', '🥤', '🍕', '🍗', '🍞', '🍝', '🍰', '☕', '🐟', '🥬', '🍋', '🍣', '🍜', '🍵', '🫘']
        return emojis[Math.floor(Math.random() * emojis.length)]
    }

    // Transform backend order to frontend format
    const transformOrder = (order: Order): TransformedOrder => {
        const transformedItems: TransformedOrderItem[] = order.items.map(item => ({
            id: item.id,
            foodName: item.product.name,
            price: `${item.product.price.toFixed(2)}`,
            quantity: item.quantity,
            image: getFoodEmoji()
        }))

        const orderDate = new Date(order.createdAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - orderDate.getTime())
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        let displayDate = ''
        if (diffDays === 0) {
            displayDate = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays === 1) {
            displayDate = 'Yesterday'
        } else {
            displayDate = `${diffDays} days ago`
        }

        return {
            id: order.id,
            orderNumber: `#ORD-${order.id.toString().padStart(3, '0')}`,
            items: transformedItems,
            totalPrice: `$${order.totalAmount.toFixed(2)}`,
            status: order.status.toLowerCase(),
            orderTime: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            estimatedTime: '20-30 min', // Default estimated time
            orderDate: displayDate,
            completedTime: new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            outlet: order.outlet
        }
    }

    // Fetch ongoing orders
    const fetchOngoingOrders = async () => {
        try {
            const data = await apiRequest('/customer/outlets/customer-ongoing-order/', {
                method: 'GET',
            })
            const transformedOrders = data.orders.map(transformOrder)
            setOngoingOrders(transformedOrders)
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching ongoing orders:', error);
                Alert.alert('Error', error.message || 'Failed to fetch ongoing orders. Please try again.');
            } else {
                console.error('Unknown error:', error);
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        }
    }

    // Fetch order history
    const fetchOrderHistory = async () => {
        try {
            const data = await apiRequest('/customer/outlets/customer-order-history/', {
                method: 'GET',
            })
            const transformedOrders = data.orders.map(transformOrder)
            setOrderHistory(transformedOrders)
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching orders history:', error);
                Alert.alert('Error', error.message || 'Failed to fetch orders history. Please try again.');
            } else {
                console.error('Unknown error:', error);
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        }
    }

    // Load orders based on active tab
    const loadOrders = async (showLoader = true) => {
        if (showLoader) setLoading(true)
        
        try {
            if (activeTab === 'ongoing') {
                await fetchOngoingOrders()
            } else {
                await fetchOrderHistory()
            }
        } finally {
            if (showLoader) setLoading(false)
        }
    }

    // Refresh orders
    const onRefresh = async () => {
        setRefreshing(true)
        await loadOrders(false)
        setRefreshing(false)
    }

    // Load orders when component mounts or tab changes
    useEffect(() => {
        loadOrders()
    }, [activeTab])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
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
            case 'pending':
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

    const navigateToReceipt = (item: TransformedOrder) => {
        router.push({
            pathname: '/(tabs)/orders/receipt',
            params: {
                orderData: JSON.stringify(item)
            }
        })
    }

    const handleCancelPress = (item: TransformedOrder) => {
        setSelectedOrder(item)
        setShowCancelModal(true)
    }

    const handleCancelConfirm = async () => {
    if (!selectedOrder) return;

    try {
        setLoading(true)
        
        // Call the backend cancel API
        const response = await apiRequest(`/customer/outlets/customer-cancel-order/${selectedOrder.id}`, {
            method: 'PUT',
        })

        setShowCancelModal(false)
        
        // Show success message
        Alert.alert(
            'Order Cancelled',
            `Order ${selectedOrder.orderNumber} has been cancelled successfully. ${response.refundAmount ? `$${response.refundAmount.toFixed(2)} has been refunded to your ${response.refundMethod === 'CASH' ? 'account' : 'wallet'}.` : ''}`,
            [
                {
                    text: 'OK',
                    onPress: () => {
                        // Navigate to cancel page with updated order data
                        const cancelledOrder = { ...selectedOrder, status: 'cancelled' }
                        router.push({
                            pathname: '/(tabs)/orders/cancel',
                            params: {
                                orderData: JSON.stringify(cancelledOrder)
                            }
                        })
                    }
                }
            ]
        )
        
        // Refresh the orders list
        await loadOrders(false)
        
    } catch (error) {
        console.error('Error cancelling order:', error)
        Alert.alert(
            'Cancellation Failed', 
            error instanceof Error ? error.message : 'Failed to cancel order. Please try again.'
        )
    } finally {
        setLoading(false)
    }
}

    const CancelConfirmationModal = () => (
        <Modal
            visible={showCancelModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCancelModal(false)}
        >
            <View className="flex-1 bg-white opacity-90  justify-center items-center px-4">
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 200 }}
                    className="bg-white rounded-2xl p-6 w-full max-w-sm"
                >
                    {/* Modal Header */}
                    <View className="items-center mb-4">
                        <Text className="text-4xl mb-2">⚠️</Text>
                        <Text className="text-xl font-bold text-gray-900">Cancel Order</Text>
                        <Text className="text-sm text-gray-600 text-center mt-2">
                            Are you sure you want to cancel this order?
                        </Text>
                    </View>

                    {/* Order Info - Only render if selectedOrder exists and has items */}
                    {selectedOrder && selectedOrder.items && selectedOrder.items.length > 0 && (
                        <View className="bg-gray-50 rounded-xl p-4 mb-6">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-bold text-gray-900">{selectedOrder.orderNumber}</Text>
                                <Text className="text-sm font-medium text-yellow-600">{selectedOrder.totalPrice}</Text>
                            </View>
                            <Text className="text-sm text-gray-600">
                                {selectedOrder.items.length} item{selectedOrder.items.length > 1 ? 's' : ''}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                {selectedOrder.items.slice(0, 2).map(item => item.foodName).join(', ')}
                                {selectedOrder.items.length > 2 && ` +${selectedOrder.items.length - 2} more`}
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            className="flex-1 bg-gray-100 py-3 rounded-xl"
                            onPress={() => setShowCancelModal(false)}
                        >
                            <Text className="text-center font-medium text-gray-700">Keep Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-red-500 py-3 rounded-xl"
                            onPress={handleCancelConfirm}
                            disabled={loading}
                        >
                            <Text className="text-center font-medium text-white">
                                {loading ? 'Cancelling...' : 'Yes, Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Modal>
    )

    const OngoingOrderCard = ({ item, index }: { item: TransformedOrder; index: number }) => (
        <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: 'timing',
                duration: 300,
                delay: index * 100,
            }}
            className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100"
        >
            {/* Order Number and Time */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-bold text-gray-900">{item.orderNumber}</Text>
                <Text className="text-xs text-gray-500">{item.orderTime}</Text>
            </View>

            {/* Order Items Preview */}
            <View className="mb-4">
                <View className="flex-row mb-3">
                    {/* Display first 3 item images */}
                    <View className="flex-row">
                        {item.items.slice(0, 3).map((orderItem, idx) => (
                            <View
                                key={orderItem.id}
                                className={`w-12 h-12 bg-yellow-100 rounded-xl items-center justify-center ${idx > 0 ? '-ml-2' : ''}`}
                                style={{ zIndex: 3 - idx }}
                            >
                                <Text className="text-lg">{orderItem.image}</Text>
                            </View>
                        ))}
                        {item.items.length > 3 && (
                            <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center -ml-2">
                                <Text className="text-xs font-bold text-gray-600">+{item.items.length - 3}</Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-1 ml-3">
                        <Text className="text-base font-bold text-gray-900 mb-1">
                            {item.items.length} item{item.items.length > 1 ? 's' : ''}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                            {item.items.slice(0, 2).map(orderItem => orderItem.foodName).join(', ')}
                            {item.items.length > 2 && ` +${item.items.length - 2} more`}
                        </Text>
                        <Text className="text-lg font-bold text-yellow-600">{item.totalPrice}</Text>
                    </View>
                </View>

                <Text className="text-xs text-gray-500">Est. {item.estimatedTime}</Text>
            </View>

            {/* Status and Action Buttons */}
            <View className="flex-row items-center justify-between">
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                </View>

                <View className="flex-row">
                    <TouchableOpacity
                        className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
                        onPress={() => navigateToReceipt(item)}
                    >
                        <Text className="text-xs font-medium text-gray-700">View Receipt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="bg-red-100 px-3 py-2 rounded-lg"
                        onPress={() => handleCancelPress(item)}
                    >
                        <Text className="text-xs font-medium text-red-700">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </MotiView>
    )

    const HistoryOrderCard = ({ item, index }: { item: TransformedOrder; index: number }) => (
        <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: 'timing',
                duration: 300,
                delay: index * 100,
            }}
            className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100"
        >
            {/* Order Number and Date */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-bold text-gray-900">{item.orderNumber}</Text>
                <Text className="text-xs text-gray-500">{item.orderDate}</Text>
            </View>

            {/* Order Items Preview */}
            <View className="mb-4">
                <View className="flex-row mb-3">
                    {/* Display first 3 item images */}
                    <View className="flex-row">
                        {item.items.slice(0, 3).map((orderItem, idx) => (
                            <View
                                key={orderItem.id}
                                className={`w-12 h-12 bg-yellow-100 rounded-xl items-center justify-center ${idx > 0 ? '-ml-2' : ''}`}
                                style={{ zIndex: 3 - idx }}
                            >
                                <Text className="text-lg">{orderItem.image}</Text>
                            </View>
                        ))}
                        {item.items.length > 3 && (
                            <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center -ml-2">
                                <Text className="text-xs font-bold text-gray-600">+{item.items.length - 3}</Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-1 ml-3">
                        <Text className="text-base font-bold text-gray-900 mb-1">
                            {item.items.length} item{item.items.length > 1 ? 's' : ''}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                            {item.items.slice(0, 2).map(orderItem => orderItem.foodName).join(', ')}
                            {item.items.length > 2 && ` +${item.items.length - 2} more`}
                        </Text>
                        <Text className="text-lg font-bold text-yellow-600">{item.totalPrice}</Text>
                    </View>
                </View>

                <Text className="text-xs text-gray-500">Completed at {item.completedTime}</Text>
            </View>

            {/* Status and Action Buttons */}
            <View className="flex-row items-center justify-between">
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                </View>

                <View className="flex-row">
                    <TouchableOpacity
                        className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
                        onPress={() => navigateToReceipt(item)}
                    >
                        <Text className="text-xs font-medium text-gray-700">View Receipt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-yellow-400 px-3 py-2 rounded-lg">
                        <Text className="text-xs font-medium text-gray-900">Re-order</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </MotiView>
    )

    const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
        <TouchableOpacity onPress={onPress} className="flex-1">
            <MotiView
                animate={{
                    backgroundColor: isActive ? '#FCD34D' : '#F9FAFB',
                }}
                transition={{
                    type: 'timing',
                    duration: 200,
                }}
                className={`py-3 rounded-xl mx-1 border ${isActive ? 'border-yellow-400' : 'border-gray-200'
                    }`}
            >
                <Text className={`text-center font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                    {title}
                </Text>
            </MotiView>
        </TouchableOpacity>
    )

    const currentOrders = activeTab === 'ongoing' ? ongoingOrders : orderHistory

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">My Orders</Text>
                <TouchableOpacity className="p-2" onPress={onRefresh}>
                    <Text className="text-lg">🔄</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View className="flex-row px-4 py-4">
                <TabButton
                    title="Ongoing Orders"
                    isActive={activeTab === 'ongoing'}
                    onPress={() => setActiveTab('ongoing')}
                />
                <TabButton
                    title="History"
                    isActive={activeTab === 'history'}
                    onPress={() => setActiveTab('history')}
                />
            </View>

            {/* Loading State */}
            {loading && (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FCD34D" />
                    <Text className="text-gray-600 mt-2">Loading orders...</Text>
                </View>
            )}

            {/* Orders List */}
            {!loading && (
                <View className="flex-1">
                    <FlatList
                        data={currentOrders}
                        renderItem={({ item, index }) => (
                            activeTab === 'ongoing' ? 
                            <OngoingOrderCard item={item} index={index} /> :
                            <HistoryOrderCard item={item} index={index} />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 70 }}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        ListEmptyComponent={() => (
                            <MotiView
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'timing', duration: 400 }}
                                className="flex-1 items-center justify-center px-8 py-20"
                            >
                                <Text className="text-6xl mb-4">🍽️</Text>
                                <Text className="text-xl font-bold text-gray-900 mb-2">No Orders Found</Text>
                                <Text className="text-gray-600 text-center">
                                    {activeTab === 'ongoing'
                                        ? "You don't have any ongoing orders right now."
                                        : "You haven't placed any orders yet."
                                    }
                                </Text>
                            </MotiView>
                        )}
                    />
                </View>
            )}

            {/* Cancel Confirmation Modal */}
            <CancelConfirmationModal />
        </SafeAreaView>
    )
}

export default MyOrders