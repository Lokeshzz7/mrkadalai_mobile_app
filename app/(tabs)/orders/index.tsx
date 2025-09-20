import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
    Alert,
    RefreshControl
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { useRouter } from 'expo-router'
import { apiRequest } from '../../../utils/api'
import Receipt from './receipt'
import Cancel from './cancel'
import Toast from 'react-native-toast-message'

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
    deliveryDate: string;     // raw deliveryDate from backend
    deliverySlot: string;
}

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
    orderTime?: string;       // formatted order time
    orderDate?: string;       // formatted order date (e.g., Yesterday)
    completedTime?: string;
    outlet?: {
        id: number;
        name: string;
        address: string;
    };
    createdAt: string;        // raw createdAt for formatting
    deliveryDate: string;     // raw deliveryDate from backend
    deliverySlot: string;     // delivery slot from backend
}


interface OngoingOrderCardProps {
    item: TransformedOrder;
    index: number;
    onViewReceipt: (item: TransformedOrder) => void;
    onCancel: (item: TransformedOrder) => void;
}

interface HistoryOrderCardProps {
    item: TransformedOrder;
    index: number;
    onViewReceipt: (item: TransformedOrder) => void;
}

interface TabButtonProps {
    title: string;
    isActive: boolean;
    onPress: () => void
}

interface CancelConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    order: TransformedOrder | null;
    loading: boolean;
}

const getStatusColor = (status: string) => {
    const key = (status || '').toLowerCase();

    switch (key) {
        case 'pending':
            return 'bg-blue-100 text-blue-800';
        case 'processing':
            return 'bg-yellow-100 text-yellow-800';
        case 'completed':
        case 'delivered':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
        case 'canceled':
        case 'partial_cancel':
            return 'bg-red-100 text-red-800';
        case 'partially_delivered':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusText = (status: string) => {
    const key = (status || '').toLowerCase();

    switch (key) {
        case 'pending':
            return 'Order Placed';
        case 'processing':
            return 'On Processing';
        case 'completed':
        case 'delivered':
            return 'Delivered';
        case 'cancelled':
        case 'canceled':
            return 'Cancelled';
        case 'partial_cancel':
            return 'Partially Cancelled';
        case 'partially_delivered':
            return 'Partially Delivered';
        default:
            return 'Unknown';
    }
};


const getProductImage = (product?: { imageUrl?: string; name?: string }) => {
    if (product?.imageUrl) {
        return product.imageUrl
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        product?.name || 'Food'
    )}&background=random`
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};


const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatSlot = (slot: string) => {
    // Example: "SLOT_14_15"
    const match = slot.match(/SLOT_(\d{1,2})_(\d{1,2})/);
    if (!match) return slot;

    const start24 = parseInt(match[1], 10);
    const end24 = parseInt(match[2], 10);

    const formatHour = (h: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12} ${period}`;
    }

    return `${formatHour(start24)} - ${formatHour(end24)}`;
}



const OngoingOrderCard = React.memo(
    ({ item, index, onViewReceipt, onCancel }: OngoingOrderCardProps) => (
        <View className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100">
            <View className="flex-row">
                {/* LEFT → First Product Image */}
                <View className="w-20 h-20 mr-4 relative">
                    <Image
                        source={{ uri: item.items[0].image }}
                        className="w-full h-full rounded-xl"
                        resizeMode="cover"
                    />
                    {item.items.length > 1 && (
                        <View className="absolute bottom-0 right-0 bg-black/60 px-2 py-1 rounded-full">
                            <Text className="text-xs text-white font-medium">
                                +{item.items.length - 1}
                            </Text>
                        </View>
                    )}
                </View>

                {/* RIGHT → Order Info */}
                <View className="flex-1 justify-between">
                    {/* Top Row → Order Number + Order Date */}
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-bold text-gray-900">
                            {item.orderNumber}
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                        </Text>
                    </View>

                    {/* Order Summary */}
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        {item.items[0].foodName}
                        {item.items.length > 1 && ` +${item.items.length - 1} more`}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-1">
                        Total: {item.totalPrice}
                    </Text>

                    {/* Delivery Date */}
                    <Text className="text-sm text-gray-500 mb-2">
                        Delivery: {formatDate(item.deliveryDate)}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2">
                        SLOT : {formatSlot(item.deliverySlot)}
                    </Text>

                    {/* Bottom Row → Status + Actions */}
                    <View className="flex-row justify-between items-center">
                        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                            <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                        </View>

                        <View className="flex-row">
                            <TouchableOpacity
                                className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
                                onPress={() => onViewReceipt(item)}
                            >
                                <Text className="text-xs font-medium text-gray-700">Receipt</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-red-100 px-3 py-2 rounded-lg"
                                onPress={() => onCancel(item)}
                            >
                                <Text className="text-xs font-medium text-red-700">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
);


// ✅ History Order Card
const HistoryOrderCard = React.memo(
    ({ item, index, onViewReceipt }: HistoryOrderCardProps) => (
        <View className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-md border border-gray-100">
            <View className="flex-row">
                {/* LEFT → First Product Image */}
                <View className="w-20 h-20 mr-4">
                    <Image
                        source={{ uri: getProductImage(item.items[0]?.product) }}
                        className="w-full h-full rounded-xl"
                        resizeMode="cover"
                    />
                    {item.items.length > 1 && (
                        <View className="absolute bottom-0 right-0 bg-black/60 px-2 py-1 rounded-full">
                            <Text className="text-xs text-white font-medium">
                                +{item.items.length - 1}
                            </Text>
                        </View>
                    )}
                </View>

                {/* RIGHT → Order Info */}
                <View className="flex-1 justify-between">
                    {/* Top Row → Order Number + Date */}
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-bold text-gray-900">
                            {item.orderNumber}
                        </Text>
                        <Text className="text-xs text-gray-500">{item.orderDate}</Text>
                    </View>

                    {/* Order Summary */}
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        {item.items[0]?.foodName}
                        {item.items.length > 1 && ` +${item.items.length - 1} more`}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2">
                        Total: {item.totalPrice}
                    </Text>

                    {/* Bottom Row → Status + Actions */}
                    <View className="flex-row justify-between items-center">
                        <View
                            className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}
                        >
                            <Text className="text-xs font-medium">
                                {getStatusText(item.status)}
                            </Text>
                        </View>
                        <View className="flex-row">
                            <TouchableOpacity
                                className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
                                onPress={() => onViewReceipt(item)}
                            >
                                <Text className="text-xs font-medium text-gray-700">
                                    Receipt
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-yellow-400 px-3 py-2 rounded-lg">
                                <Text className="text-xs font-medium text-gray-900">
                                    Re-order
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
)


const TabButton = React.memo(({ title, isActive, onPress }: TabButtonProps) => (
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
))

// This component should only use props passed to it, not functions from the parent.
// Cancel Confirmation Modal
// Corrected CancelConfirmationModal Component


// Corrected CancelConfirmationModal Component
const CancelConfirmationModal = React.memo(
    ({ visible, onClose, onConfirm, order, loading }: CancelConfirmationModalProps) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    // zIndex: 9999, // <--- THIS LINE WAS REMOVED
                }}
            >
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 16,
                        padding: 24,
                        width: '100%',
                        maxWidth: 350,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                >
                    {/* Header */}
                    <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
                        Cancel Order
                    </Text>
                    <Text className="text-sm text-gray-600 mb-6 text-center">
                        Are you sure you want to cancel{" "}
                        <Text className="font-semibold">{order?.orderNumber}</Text>?
                        This action cannot be undone.
                    </Text>

                    {/* Order Summary */}
                    {order && (
                        <View className="bg-gray-50 rounded-xl p-4 mb-6">
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="font-semibold text-gray-900">{order.orderNumber}</Text>
                                <Text className="font-medium text-yellow-600">{order.totalPrice}</Text>
                            </View>
                            <Text className="text-xs text-gray-500">
                                {order.items.slice(0, 2).map(i => i.foodName).join(", ")}
                                {order.items.length > 2 && ` +${order.items.length - 2} more`}
                            </Text>
                        </View>
                    )}

                    {/* Actions */}
                    <View className="flex-row justify-between">
                        <TouchableOpacity
                            className="flex-1 bg-gray-100 py-3 rounded-xl mr-2"
                            onPress={onClose}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <Text className="text-center font-medium text-gray-700">Keep Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-xl ${loading ? "bg-red-300" : "bg-red-500"}`}
                            onPress={onConfirm}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <Text className="text-center font-medium text-white">
                                {loading ? "Cancelling..." : "Yes, Cancel"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Modal>
    )
);


const MyOrders = () => {
    const [activeTab, setActiveTab] = useState('ongoing')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<TransformedOrder | null>(null)
    const [ongoingOrders, setOngoingOrders] = useState<TransformedOrder[]>([])
    const [orderHistory, setOrderHistory] = useState<TransformedOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [cancelLoading, setCancelLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false)
    const router = useRouter()

    // Get random food emoji for items
    const emojis = ['🍖', '🥗', '🧃', '🍔', '🍟', '🥤', '🍕', '🍗', '🍞', '🍝', '🍰', '☕', '🐟', '🥬', '🍋', '🍣', '🍜', '🍵', '🫘']
    const getStableFoodEmoji = (foodName: string) => {
        let hash = 0;
        for (let i = 0; i < foodName.length; i++) {
            hash = foodName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % emojis.length);
        return emojis[index];
    };

    // Transform backend order to frontend format
    const transformOrder = useCallback((order: Order): TransformedOrder => {
        const transformedItems: TransformedOrderItem[] = order.items.map(item => ({
            id: item.id,
            foodName: item.product.name,
            price: `${item.product.price.toFixed(2)}`,
            quantity: item.quantity,
            image: getProductImage(item.product)
        }));

        const orderDate = new Date(order.createdAt);

        const displayDate = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')
            }/${orderDate.getFullYear()}`;
        return {
            id: order.id,
            orderNumber: `#ORD-${order.id.toString().padStart(3, '0')}`,
            items: transformedItems,
            totalPrice: `$${order.totalAmount.toFixed(2)}`,
            status: order.status.toLowerCase(),
            orderTime: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            orderDate: displayDate,                   // formatted date
            completedTime: new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            outlet: order.outlet,
            createdAt: order.createdAt,
            deliveryDate: order.deliveryDate,          // raw delivery date from backend
            deliverySlot: order.deliverySlot           // slot
        };
    }, []);





    // Fetch ongoing orders
    const fetchOngoingOrders = useCallback(async () => {
        try {
            const data = await apiRequest('/customer/outlets/customer-ongoing-order/', {
                method: 'GET',
            })

            console.log("Full backend raw data:", JSON.stringify(data.debugOrders, null, 2));
            console.log("orer data : ", data.orders);
            data.orders.forEach((order, i) => {
                console.log(`Order #${i + 1} items:`, order.items);
            });
            const transformedOrders = data.orders.map(transformOrder)
            setOngoingOrders(transformedOrders)

        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching ongoing orders:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to fetch ongoing orders. Please try again.',
                    position: 'top',
                    topOffset: 200,       // adjust vertical position if needed
                    visibilityTime: 4000, // 4 seconds
                    autoHide: true,
                    onPress: () => Toast.hide(), // tap anywhere to close
                });
            } else {
                console.error('Unknown error:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'An unexpected error occurred.',
                    position: 'top',
                    topOffset: 200,
                    visibilityTime: 4000,
                    autoHide: true,
                    onPress: () => Toast.hide(),
                });
            }
        }
    }, [transformOrder]);

    // Fetch order history
    const fetchOrderHistory = useCallback(async () => {
        try {
            const data = await apiRequest('/customer/outlets/customer-order-history/', {
                method: 'GET',
            })
            console.log("raw data : ", data.orders);
            const transformedOrders = data.orders.map(transformOrder)
            setOrderHistory(transformedOrders)
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching orders history:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to fetch orders history. Please try again.',
                    position: 'top',
                    topOffset: 200,
                    visibilityTime: 4000,
                    autoHide: true,
                    onPress: () => Toast.hide(),
                });
            } else {
                console.error('Unknown error:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'An unexpected error occurred.',
                    position: 'top',
                    topOffset: 200,
                    visibilityTime: 4000,
                    autoHide: true,
                    onPress: () => Toast.hide(),
                });
            }
        }
    }, [transformOrder]);

    // Load orders based on active tab
    const loadOrders = useCallback(async (showLoader = true) => {
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
    }, [activeTab, fetchOngoingOrders, fetchOrderHistory]);

    // Refresh orders
    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await loadOrders(false)
        setRefreshing(false)
    }, [loadOrders]);

    // Load orders when component mounts or tab changes
    useEffect(() => {
        loadOrders()
    }, [loadOrders])

    const navigateToReceipt = useCallback((item: TransformedOrder) => {
        router.push({
            pathname: '/(tabs)/orders/receipt',
            params: {
                orderData: JSON.stringify(item)
            }
        })
    }, [router])


    const handleCancelPress = useCallback((item: TransformedOrder) => {
        console.log("Cancel Pressed for:", item.orderNumber)
        setSelectedOrder(item)
        setShowCancelModal(true)
    }, []);

    const handleCancelConfirm = useCallback(async () => {
        if (!selectedOrder) return;

        try {
            setCancelLoading(true);

            const response = await apiRequest(
                `/customer/outlets/customer-cancel-order/${selectedOrder.id}`,
                { method: "PUT" }
            );

            setShowCancelModal(false);

            Alert.alert(
                "Order Cancelled",
                `Order ${selectedOrder.orderNumber} has been cancelled successfully.${response.refundAmount ? ` $${response.refundAmount.toFixed(2)} refunded.` : ""
                }`
            );

            await loadOrders(false);
        } catch (error) {
            console.error("Error cancelling order:", error);
            Alert.alert(
                "Cancellation Failed",
                error instanceof Error ? error.message : "Failed to cancel order. Please try again."
            );
        } finally {
            setCancelLoading(false);
        }
    }, [selectedOrder, loadOrders]);



    const currentOrders = useMemo(() =>
        activeTab === 'ongoing' ? ongoingOrders : orderHistory,
        [activeTab, ongoingOrders, orderHistory]
    );

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
            <View style={{ flex: 1 }}>
                {/* Loading State */}
                {loading && (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#FCD34D" />
                        <Text className="text-gray-600 mt-2">Loading orders...</Text>
                    </View>
                )}

                {/* Orders List */}
                {!loading && (
                    <FlatList
                        data={currentOrders}
                        renderItem={({ item, index }) => (
                            activeTab === 'ongoing' ?
                                <OngoingOrderCard item={item} index={index} onViewReceipt={navigateToReceipt} onCancel={handleCancelPress} /> :
                                <HistoryOrderCard item={item} index={index} onViewReceipt={navigateToReceipt} />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 70 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
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

                )}
            </View>

            <CancelConfirmationModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelConfirm}
                order={selectedOrder}
                loading={cancelLoading}
            />
        </SafeAreaView>
    )
}

export default MyOrders