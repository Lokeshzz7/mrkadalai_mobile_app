import React, { useState } from 'react'
import {
    FlatList,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal
} from 'react-native'
import { MotiView, MotiText } from 'moti'

const Wallet = () => {
    const [rechargeAmount, setRechargeAmount] = useState('')
    const [showOptionsModal, setShowOptionsModal] = useState(false)
    const [walletBalance, setWalletBalance] = useState(245.50)
    const [bonusCredits, setBonusCredits] = useState(35.00)

    const rechargeHistory = [
        {
            id: 1,
            amount: 100.00,
            date: '2024-06-09',
            time: '02:30 PM',
            status: 'successful',
            transactionId: 'TXN123456789'
        },
        {
            id: 2,
            amount: 50.00,
            date: '2024-06-08',
            time: '11:45 AM',
            status: 'successful',
            transactionId: 'TXN123456788'
        },
        {
            id: 3,
            amount: 75.00,
            date: '2024-06-07',
            time: '08:20 PM',
            status: 'failed',
            transactionId: 'TXN123456787'
        },
        {
            id: 4,
            amount: 200.00,
            date: '2024-06-06',
            time: '03:15 PM',
            status: 'successful',
            transactionId: 'TXN123456786'
        },
        {
            id: 5,
            amount: 25.00,
            date: '2024-06-05',
            time: '12:30 PM',
            status: 'pending',
            transactionId: 'TXN123456785'
        },
        {
            id: 6,
            amount: 150.00,
            date: '2024-06-04',
            time: '07:45 AM',
            status: 'successful',
            transactionId: 'TXN123456784'
        }
    ]

    const quickRechargeAmounts = [50, 100, 200, 500]

    const getStatusColor = (status) => {
        switch (status) {
            case 'successful':
                return 'bg-green-100 text-green-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'successful':
                return 'Successful'
            case 'failed':
                return 'Failed'
            case 'pending':
                return 'Pending'
            default:
                return 'Unknown'
        }
    }

    const handleRecharge = () => {
        if (rechargeAmount && parseFloat(rechargeAmount) > 0) {
            // Simulate successful recharge
            const newTransaction = {
                id: Date.now(),
                amount: parseFloat(rechargeAmount),
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                status: 'successful',
                transactionId: `TXN${Date.now()}`
            }

            // Add to history (in real app, this would be handled by state management)
            setWalletBalance(prev => prev + parseFloat(rechargeAmount))
            setRechargeAmount('')

            // Show success message or navigate
            alert('Recharge successful!')
        } else {
            alert('Please enter a valid amount')
        }
    }

    const RechargeHistoryCard = ({ item, index }) => (
        <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: 'timing',
                duration: 300,
                delay: index * 100,
            }}
            className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-md border border-gray-100"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                        ${item.amount.toFixed(2)}
                    </Text>
                    <Text className="text-sm text-gray-600">
                        {item.date} • {item.time}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                </View>
            </View>

            <View className="border-t border-gray-100 pt-2 mt-2">
                <Text className="text-xs text-gray-500">
                    Transaction ID: {item.transactionId}
                </Text>
            </View>
        </MotiView>
    )

    const OptionsModal = () => (
        <Modal
            visible={showOptionsModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowOptionsModal(false)}
        >
            <TouchableOpacity
                className="flex-1 bg-black bg-opacity-50 justify-center items-center"
                activeOpacity={1}
                onPress={() => setShowOptionsModal(false)}
            >
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 200 }}
                    className="bg-white rounded-2xl p-4 mx-8 shadow-lg"
                >
                    <TouchableOpacity
                        className="py-4 border-b border-gray-100"
                        onPress={() => {
                            setShowOptionsModal(false)
                            // Navigate to transaction history
                        }}
                    >
                        <Text className="text-gray-900 font-medium text-center">
                            📊 Transaction History
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="py-4"
                        onPress={() => {
                            setShowOptionsModal(false)
                            // Navigate to recharge history (current page)
                        }}
                    >
                        <Text className="text-gray-900 font-medium text-center">
                            💳 Recharge History
                        </Text>
                    </TouchableOpacity>
                </MotiView>
            </TouchableOpacity>
        </Modal>
    )

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <TouchableOpacity className="p-2">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Wallet</Text>
                <TouchableOpacity
                    className="p-2"
                    onPress={() => setShowOptionsModal(true)}
                >
                    <Text className="text-2xl">⋮</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 70 }} // Add padding for tab bar
            >
                {/* Wallet Balance Section */}
                <MotiView
                    from={{ opacity: 0, translateY: -30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600 }}
                    className="px-4 py-6"
                >
                    {/* Wallet Balance */}
                    <View className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-6 mb-4 shadow-lg">
                        <Text className="text-gray-800 text-lg font-medium mb-2">
                            Wallet Balance
                        </Text>
                        <Text className="text-gray-900 text-4xl font-bold mb-4">
                            ${walletBalance.toFixed(2)}
                        </Text>

                        <View className="border-t border-yellow-300 pt-3">
                            <Text className="text-gray-700 text-sm font-medium mb-1">
                                Bonus Credits
                            </Text>
                            <Text className="text-gray-800 text-xl font-bold">
                                ${bonusCredits.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Recharge Section */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600, delay: 200 }}
                    className="px-4 mb-6"
                >
                    <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            💳 Recharge Wallet
                        </Text>

                        {/* Quick Amount Buttons */}
                        <View className="flex-row justify-between mb-4">
                            {quickRechargeAmounts.map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    className="bg-yellow-100 px-4 py-2 rounded-xl flex-1 mx-1"
                                    onPress={() => setRechargeAmount(amount.toString())}
                                >
                                    <Text className="text-center font-medium text-gray-800">
                                        ${amount}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Amount Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-medium mb-2">Enter Amount</Text>
                            <TextInput
                                className="border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium"
                                placeholder="$0.00"
                                value={rechargeAmount}
                                onChangeText={setRechargeAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Pay Button */}
                        <TouchableOpacity
                            className="bg-yellow-400 py-4 rounded-xl"
                            onPress={handleRecharge}
                        >
                            <Text className="text-center font-bold text-gray-900 text-lg">
                                💰 Pay Now
                            </Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>

                {/* Caution Notice */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 600, delay: 400 }}
                    className="px-4 mb-6"
                >
                    <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <Text className="text-red-800 font-medium mb-2">
                            ⚠️ Important Notice
                        </Text>
                        <Text className="text-red-700 text-sm leading-5">
                            • Wallet recharges are non-refundable
                        </Text>
                        <Text className="text-red-700 text-sm leading-5">
                            • Bonus credits expire after 90 days
                        </Text>
                        <Text className="text-red-700 text-sm leading-5">
                            • Processing fees may apply for certain payment methods
                        </Text>
                        <Text className="text-red-700 text-sm leading-5 mt-2">
                            By proceeding, you agree to our Terms of Service and Refund Policy.
                        </Text>
                    </View>
                </MotiView>

                {/* Recharge History */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        📈 Recharge History
                    </Text>
                </View>

                {/* History List */}
                <View className="flex-1 pb-6">
                    {rechargeHistory.map((item, index) => (
                        <RechargeHistoryCard key={item.id} item={item} index={index} />
                    ))}
                </View>

                {/* Empty State */}
                {rechargeHistory.length === 0 && (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 400 }}
                        className="flex-1 items-center justify-center px-8 py-12"
                    >
                        <Text className="text-6xl mb-4">💳</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-2">No Transactions</Text>
                        <Text className="text-gray-600 text-center">
                            Your recharge history will appear here once you make your first transaction.
                        </Text>
                    </MotiView>
                )}
            </ScrollView>

            {/* Options Modal */}
            <OptionsModal />
        </SafeAreaView>
    )
}

export default Wallet