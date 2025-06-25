import React, { useState } from 'react'
import {
    FlatList,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { useRouter } from 'expo-router'
import Receipt from './receipt'
import Cancel from './cancel'

// Define the Order type
interface Order {
    id: number;
    orderNumber: string;
    foodName: string;
    price: string;
    quantity: number;
    image: string;
    status: string;
    orderTime?: string;
    estimatedTime?: string;
    orderDate?: string;
    completedTime?: string;
}

const MyOrders = () => {
    const [activeTab, setActiveTab] = useState('ongoing')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const router = useRouter()

    const ongoingOrders: Order[] = [
        {
            id: 1,
            orderNumber: '#ORD-001',
            foodName: 'Grilled Chicken',
            price: '$18.99',
            quantity: 2,
            image: '🍖',
            status: 'processing',
            orderTime: '2:30 PM',
            estimatedTime: '25-30 min'
        },
        {
            id: 2,
            orderNumber: '#ORD-002',
            foodName: 'Caesar Salad',
            price: '$12.99',
            quantity: 1,
            image: '🥗',
            status: 'placed',
            orderTime: '2:45 PM',
            estimatedTime: '10-15 min'
        },
        {
            id: 3,
            orderNumber: '#ORD-003',
            foodName: 'Beef Burger',
            price: '$15.99',
            quantity: 3,
            image: '🍔',
            status: 'processing',
            orderTime: '3:00 PM',
            estimatedTime: '20-25 min'
        },
        {
            id: 4,
            orderNumber: '#ORD-004',
            foodName: 'Fresh Orange Juice',
            price: '$4.99',
            quantity: 2,
            image: '🧃',
            status: 'placed',
            orderTime: '3:15 PM',
            estimatedTime: '5 min'
        }
    ]

    const orderHistory: Order[] = [
        {
            id: 5,
            orderNumber: '#ORD-005',
            foodName: 'Pasta Carbonara',
            price: '$16.99',
            quantity: 1,
            image: '🍝',
            status: 'completed',
            orderDate: 'Yesterday',
            completedTime: '7:30 PM'
        },
        {
            id: 6,
            orderNumber: '#ORD-006',
            foodName: 'Fish & Chips',
            price: '$19.99',
            quantity: 2,
            image: '🍟',
            status: 'completed',
            orderDate: '2 days ago',
            completedTime: '6:45 PM'
        },
        {
            id: 7,
            orderNumber: '#ORD-007',
            foodName: 'Chicken Wings',
            price: '$8.99',
            quantity: 1,
            image: '🍗',
            status: 'completed',
            orderDate: '3 days ago',
            completedTime: '8:15 PM'
        },
        {
            id: 8,
            orderNumber: '#ORD-008',
            foodName: 'Iced Coffee',
            price: '$3.99',
            quantity: 3,
            image: '☕',
            status: 'completed',
            orderDate: '1 week ago',
            completedTime: '2:20 PM'
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'placed':
                return 'bg-blue-100 text-blue-800'
            case 'processing':
                return 'bg-yellow-100 text-yellow-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
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
            default:
                return 'Unknown'
        }
    }

    const navigateToReceipt = (item: Order) => {
        router.push({
            pathname: '/(tabs)/orders/receipt',
            params: {
                id: item.id.toString(),
                orderNumber: item.orderNumber,
                foodName: item.foodName,
                price: item.price,
                quantity: item.quantity.toString(),
                image: item.image,
                status: item.status,
                orderTime: item.orderTime || '',
                orderDate: item.orderDate || '',
                completedTime: item.completedTime || ''
            }
        })
    }

    const handleCancelPress = (item: Order) => {
        setSelectedOrder(item)
        setShowCancelModal(true)
    }

    const handleCancelConfirm = () => {
        if (!selectedOrder) return;

        setShowCancelModal(false)
        router.push({
            pathname: '/(tabs)/orders/cancel',
            params: {
                id: selectedOrder.id.toString(),
                orderNumber: selectedOrder.orderNumber,
                foodName: selectedOrder.foodName,
                price: selectedOrder.price,
                quantity: selectedOrder.quantity.toString(),
                image: selectedOrder.image,
                status: selectedOrder.status,
                orderTime: selectedOrder.orderTime || '',
            }
        })
    }

    const CancelConfirmationModal = () => (
        <Modal
            visible={showCancelModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCancelModal(false)}
        >
            <View className="flex-1 bg-black bg-opacity-50 justify-center items-center px-4">
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

                    {/* Order Info - Only render if selectedOrder exists */}
                    {selectedOrder && (
                        <View className="bg-gray-50 rounded-xl p-4 mb-6">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-yellow-100 rounded-xl items-center justify-center mr-3">
                                    <Text className="text-xl">{selectedOrder.image}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-900">{selectedOrder.foodName}</Text>
                                    <Text className="text-sm text-gray-600">{selectedOrder.orderNumber}</Text>
                                    <Text className="text-sm font-medium text-yellow-600">{selectedOrder.price}</Text>
                                </View>
                            </View>
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
                        >
                            <Text className="text-center font-medium text-white">Yes, Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Modal>
    )

    const OngoingOrderCard = ({ item, index }: { item: Order; index: number }) => (
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
            {/* Order Number */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-bold text-gray-900">{item.orderNumber}</Text>
                <Text className="text-xs text-gray-500">{item.orderTime}</Text>
            </View>

            {/* Food Item Details */}
            <View className="flex-row mb-4">
                <View className="w-16 h-16 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
                    <Text className="text-2xl">{item.image}</Text>
                </View>

                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{item.foodName}</Text>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-yellow-600">{item.price}</Text>
                        <Text className="text-sm text-gray-600">Qty: {item.quantity}</Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">Est. {item.estimatedTime}</Text>
                </View>
            </View>

            {/* Status and Action Buttons */}
            <View className="flex-row items-center justify-between">
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                </View>

                <View className="flex-row">
                    <TouchableOpacity className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
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

    const HistoryOrderCard = ({ item, index }: { item: Order; index: number }) => (
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
            {/* Order Number */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-bold text-gray-900">{item.orderNumber}</Text>
                <Text className="text-xs text-gray-500">{item.orderDate}</Text>
            </View>

            {/* Food Item Details */}
            <View className="flex-row mb-4">
                <View className="w-16 h-16 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
                    <Text className="text-2xl">{item.image}</Text>
                </View>

                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{item.foodName}</Text>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-yellow-600">{item.price}</Text>
                        <Text className="text-sm text-gray-600">Qty: {item.quantity}</Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">Completed at {item.completedTime}</Text>
                </View>
            </View>

            {/* Status and Action Buttons */}
            <View className="flex-row items-center justify-between">
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                </View>

                <View className="flex-row">
                    <TouchableOpacity className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
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

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <TouchableOpacity className="p-2">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">My Orders</Text>
                <View className="w-10" />
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

            {/* Orders List */}
            <View className="flex-1">
                {activeTab === 'ongoing' ? (
                    <FlatList
                        data={ongoingOrders}
                        renderItem={({ item, index }) => (
                            <OngoingOrderCard item={item} index={index} />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 70 }}
                    />
                ) : (
                    <FlatList
                        data={orderHistory}
                        renderItem={({ item, index }) => (
                            <HistoryOrderCard item={item} index={index} />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 70 }}
                    />
                )}
            </View>

            {/* Empty State */}
            {((activeTab === 'ongoing' && ongoingOrders.length === 0) ||
                (activeTab === 'history' && orderHistory.length === 0)) && (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 400 }}
                        className="flex-1 items-center justify-center px-8"
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

            {/* Cancel Confirmation Modal */}
            <CancelConfirmationModal />
        </SafeAreaView>
    )
}

export default MyOrders