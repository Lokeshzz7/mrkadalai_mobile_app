import React, { useState } from 'react'
import {
    FlatList,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native'
import { MotiView, MotiText } from 'moti'

const Cart = () => {
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'Chicken Burger',
            description: 'Juicy grilled chicken with fresh lettuce',
            price: 12.99,
            quantity: 2,
            icon: '🍔'
        },
        {
            id: 2,
            name: 'Pizza Margherita',
            description: 'Classic Italian pizza with tomato and basil',
            price: 15.50,
            quantity: 1,
            icon: '🍕'
        },
        {
            id: 3,
            name: 'Caesar Salad',
            description: 'Fresh romaine lettuce with caesar dressing',
            price: 8.99,
            quantity: 3,
            icon: '🥗'
        }
    ])

    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)

    const timeSlots = [
        { id: 1, time: '11:00 AM - 12:00 PM', available: true },
        { id: 2, time: '12:00 PM - 1:00 PM', available: true },
        { id: 3, time: '1:00 PM - 2:00 PM', available: false },
        { id: 4, time: '2:00 PM - 3:00 PM', available: true },
        { id: 5, time: '3:00 PM - 4:00 PM', available: true },
        { id: 6, time: '4:00 PM - 5:00 PM', available: true }
    ]

    const updateQuantity = (itemId: any, change: any) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === itemId) {
                    const newQuantity = Math.max(0, item.quantity + change)
                    return { ...item, quantity: newQuantity }
                }
                return item
            }).filter(item => item.quantity > 0)
        )
    }

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    }

    const calculateTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0)
    }

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart first')
            return
        }
        if (!selectedTimeSlot) {
            Alert.alert('Select Time Slot', 'Please select a delivery time slot')
            return
        }
        Alert.alert(
            'Checkout Successful',
            `Order placed for ${calculateTotalItems()} items\nTotal: $${calculateTotal().toFixed(2)}\nDelivery: ${timeSlots.find(slot => slot.id === selectedTimeSlot)?.time}`
        )
    }

    const CartItem = ({ item, index }: any) => (
        <MotiView
            from={{ opacity: 0, translateX: -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
                type: 'timing',
                duration: 300,
                delay: index * 100,
            }}
            className="bg-white mx-4 mb-1 px-4 py-4 flex-row items-center"
        >
            {/* Food Icon */}
            <View className="w-16 h-16 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
                <Text className="text-2xl">{item.icon}</Text>
            </View>

            {/* Item Details */}
            <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {item.name}
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                    {item.description}
                </Text>
                <Text className="text-lg font-bold text-green-600">
                    ${item.price.toFixed(2)}
                </Text>
            </View>

            {/* Quantity Controls */}
            <View className="items-center">
                <View className="flex-row items-center bg-gray-100 rounded-full px-1">
                    <TouchableOpacity
                        onPress={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-lg">−</Text>
                    </TouchableOpacity>

                    <Text className="mx-4 text-lg font-semibold text-gray-900 min-w-8 text-center">
                        {item.quantity}
                    </Text>

                    <TouchableOpacity
                        onPress={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 bg-green-500 rounded-full items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-lg">+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </MotiView>
    )

    const TimeSlotItem = ({ slot, index }: any) => (
        <TouchableOpacity
            onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
            activeOpacity={0.7}
            disabled={!slot.available}
        >
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                    type: 'timing',
                    duration: 300,
                    delay: index * 50,
                }}
                className={`mx-4 mb-2 px-4 py-3 rounded-2xl border-2 ${selectedTimeSlot === slot.id
                    ? 'bg-yellow-100 border-yellow-400'
                    : slot.available
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-100 border-gray-200'
                    }`}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className={`w-4 h-4 rounded-full mr-3 ${selectedTimeSlot === slot.id
                            ? 'bg-yellow-500'
                            : slot.available
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                            }`} />
                        <Text className={`text-base font-medium ${slot.available ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                            {slot.time}
                        </Text>
                    </View>
                    {!slot.available && (
                        <Text className="text-sm text-red-500 font-medium">Unavailable</Text>
                    )}
                </View>
            </MotiView>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">Cart</Text>

                <View className="flex-row items-center">
                    <View className="bg-red-500 rounded-full min-w-6 h-6 items-center justify-center mr-2">
                        <Text className="text-white text-xs font-bold">
                            {calculateTotalItems()}
                        </Text>
                    </View>

                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 70 }}
            >
                {/* Cart Summary */}
                <MotiView
                    from={{ opacity: 0, translateY: -30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600 }}
                    className="mx-4 mt-6 mb-6"
                >
                    <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
                            <View className="bg-yellow-100 px-3 py-1 rounded-full">
                                <Text className="text-yellow-800 text-sm font-medium">
                                    {calculateTotalItems()} items
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                            <Text className="text-lg font-semibold text-gray-700">Total Amount</Text>
                            <Text className="text-2xl font-bold text-green-600">
                                ${calculateTotal().toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Cart Items */}
                {cartItems.length > 0 ? (
                    <View className="bg-white rounded-2xl mx-4 mb-6 shadow-md border border-gray-100 overflow-hidden">
                        {cartItems.map((item, index) => (
                            <View key={item.id}>
                                <CartItem item={item} index={index} />
                                {index < cartItems.length - 1 && (
                                    <View className="h-px bg-gray-200 mx-4" />
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 600 }}
                        className="mx-4 mb-6"
                    >
                        <View className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 items-center">
                            <Text className="text-6xl mb-4">🛒</Text>
                            <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
                            <Text className="text-gray-600 text-center">Add some delicious items to get started!</Text>
                        </View>
                    </MotiView>
                )}

                {/* Delivery Time Selection */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600, delay: 400 }}
                    className="mx-4 mb-6"
                >
                    <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                <Text className="text-lg">🕐</Text>
                            </View>
                            <Text className="text-xl font-bold text-gray-900">Select Delivery Time</Text>
                        </View>

                        <Text className="text-gray-600 mb-4">Choose your preferred delivery time slot</Text>

                        {timeSlots.map((slot, index) => (
                            <TimeSlotItem key={slot.id} slot={slot} index={index} />
                        ))}
                    </View>
                </MotiView>

                {/* Checkout Button */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600, delay: 600 }}
                    className="mx-4 mb-8"
                >
                    <TouchableOpacity
                        onPress={handleCheckout}
                        activeOpacity={0.8}
                        className={`rounded-2xl p-4 shadow-md ${cartItems.length > 0 && selectedTimeSlot
                            ? 'bg-yellow-400'
                            : 'bg-gray-300'
                            }`}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-xl">🛍️</Text>
                            <Text className={`text-lg font-bold ml-2 ${cartItems.length > 0 && selectedTimeSlot
                                ? 'text-gray-900'
                                : 'text-gray-500'
                                }`}>
                                Proceed to Checkout • ${calculateTotal().toFixed(2)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </MotiView>

                {/* App Version */}
                <View className="items-center pb-8">
                    <Text className="text-gray-500 text-sm">Secure Checkout</Text>
                    <Text className="text-gray-400 text-xs mt-1">🔒 Your payment is protected</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Cart