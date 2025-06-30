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

const MyOrders = () => {
    const [activeTab, setActiveTab] = useState('ongoing')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const router = useRouter()

    const ongoingOrders: Order[] = [
        {
            id: 1,
            orderNumber: '#ORD-001',
            items: [
                { id: 1, foodName: 'Grilled Chicken', price: '$18.99', quantity: 2, image: '🍖' },
                { id: 2, foodName: 'Caesar Salad', price: '$12.99', quantity: 1, image: '🥗' },
                { id: 3, foodName: 'Fresh Orange Juice', price: '$4.99', quantity: 2, image: '🧃' }
            ],
            totalPrice: '$55.96',
            status: 'processing',
            orderTime: '2:30 PM',
            estimatedTime: '25-30 min'
        },
        {
            id: 2,
            orderNumber: '#ORD-002',
            items: [
                { id: 4, foodName: 'Beef Burger', price: '$15.99', quantity: 3, image: '🍔' },
                { id: 5, foodName: 'French Fries', price: '$6.99', quantity: 2, image: '🍟' },
                { id: 6, foodName: 'Cola', price: '$2.99', quantity: 3, image: '🥤' }
            ],
            totalPrice: '$70.94',
            status: 'placed',
            orderTime: '2:45 PM',
            estimatedTime: '20-25 min'
        },
        {
            id: 3,
            orderNumber: '#ORD-003',
            items: [
                { id: 7, foodName: 'Margherita Pizza', price: '$22.99', quantity: 1, image: '🍕' },
                { id: 8, foodName: 'Chicken Wings', price: '$8.99', quantity: 2, image: '🍗' },
                { id: 9, foodName: 'Garlic Bread', price: '$5.99', quantity: 1, image: '🍞' }
            ],
            totalPrice: '$46.96',
            status: 'processing',
            orderTime: '3:00 PM',
            estimatedTime: '30-35 min'
        }
    ]

    const orderHistory: Order[] = [
        {
            id: 4,
            orderNumber: '#ORD-004',
            items: [
                { id: 10, foodName: 'Pasta Carbonara', price: '$16.99', quantity: 1, image: '🍝' },
                { id: 11, foodName: 'Tiramisu', price: '$7.99', quantity: 2, image: '🍰' },
                { id: 12, foodName: 'Iced Coffee', price: '$3.99', quantity: 1, image: '☕' }
            ],
            totalPrice: '$36.96',
            status: 'completed',
            orderDate: 'Yesterday',
            completedTime: '7:30 PM'
        },
        {
            id: 5,
            orderNumber: '#ORD-005',
            items: [
                { id: 13, foodName: 'Fish & Chips', price: '$19.99', quantity: 2, image: '🐟' },
                { id: 14, foodName: 'Coleslaw', price: '$4.99', quantity: 1, image: '🥬' },
                { id: 15, foodName: 'Lemon Tart', price: '$6.99', quantity: 2, image: '🍋' }
            ],
            totalPrice: '$58.95',
            status: 'completed',
            orderDate: '2 days ago',
            completedTime: '6:45 PM'
        },
        {
            id: 6,
            orderNumber: '#ORD-006',
            items: [
                { id: 16, foodName: 'Sushi Platter', price: '$32.99', quantity: 1, image: '🍣' },
                { id: 17, foodName: 'Miso Soup', price: '$4.99', quantity: 2, image: '🍜' },
                { id: 18, foodName: 'Green Tea', price: '$2.99', quantity: 1, image: '🍵' },
                { id: 19, foodName: 'Edamame', price: '$5.99', quantity: 1, image: '🫘' }
            ],
            totalPrice: '$51.95',
            status: 'completed',
            orderDate: '3 days ago',
            completedTime: '8:15 PM'
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
                orderData: JSON.stringify(item)
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
                orderData: JSON.stringify(selectedOrder)
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