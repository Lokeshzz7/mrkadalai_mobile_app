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


type RechargeHistoryItem = {
    id: string;
    amount: number;
    date: string;
    time: string;
    status: 'completed' | 'pending' | 'failed' | 'successful';
    transactionId: string;
};

type TransactionHistoryItem = {
    id: string;
    amount: number;
    date: string;
    time: string;
    type: 'debit' | 'credit';
    description: string;
    transactionId: string;
};

// Union type for FlatList data
type HistoryItem = RechargeHistoryItem | TransactionHistoryItem;

type RechargeHistoryCardProps = {
    item: RechargeHistoryItem;
    index: number;
};


const Wallet = () => {
    const [activeTab, setActiveTab] = useState('recharge')
    const [showAllRecharge, setShowAllRecharge] = useState(false)
    const [showAllTransaction, setShowAllTransaction] = useState(false)

    const [rechargeAmount, setRechargeAmount] = useState('')
    const [showOptionsModal, setShowOptionsModal] = useState(false)
    const [walletBalance, setWalletBalance] = useState(245.50)
    const [bonusCredits, setBonusCredits] = useState(35.00)

    const rechargeHistory: RechargeHistoryItem[] = [
        {
            id: '1',
            amount: 100.00,
            date: '2024-06-09',
            time: '02:30 PM',
            status: 'successful',
            transactionId: 'TXN123456789'
        },
        {
            id: '2',
            amount: 50.00,
            date: '2024-06-08',
            time: '11:45 AM',
            status: 'successful',
            transactionId: 'TXN123456788'
        },
        {
            id: '3',
            amount: 75.00,
            date: '2024-06-07',
            time: '08:20 PM',
            status: 'failed',
            transactionId: 'TXN123456787'
        },
        {
            id: '4',
            amount: 200.00,
            date: '2024-06-06',
            time: '03:15 PM',
            status: 'successful',
            transactionId: 'TXN123456786'
        },
        {
            id: '5',
            amount: 25.00,
            date: '2024-06-05',
            time: '12:30 PM',
            status: 'pending',
            transactionId: 'TXN123456785'
        },
        {
            id: '6',
            amount: 150.00,
            date: '2024-06-04',
            time: '07:45 AM',
            status: 'successful',
            transactionId: 'TXN123456784'
        },
        {
            id: '7',
            amount: 300.00,
            date: '2024-06-03',
            time: '09:30 AM',
            status: 'successful',
            transactionId: 'TXN123456783'
        },
        {
            id: '8',
            amount: 80.00,
            date: '2024-06-02',
            time: '06:15 PM',
            status: 'failed',
            transactionId: 'TXN123456782'
        },
        {
            id: '9',
            amount: 120.00,
            date: '2024-06-01',
            time: '01:45 PM',
            status: 'successful',
            transactionId: 'TXN123456781'
        },
        {
            id: '10',
            amount: 90.00,
            date: '2024-05-31',
            time: '10:20 AM',
            status: 'pending',
            transactionId: 'TXN123456780'
        }
    ]

    const transactionHistory: TransactionHistoryItem[] = [
        {
            id: '1',
            amount: 45.50,
            date: '2024-06-09',
            time: '03:15 PM',
            type: 'debit',
            description: 'Food Order - Pizza Palace',
            transactionId: 'TXN987654321'
        },
        {
            id: '2',
            amount: 100.00,
            date: '2024-06-09',
            time: '02:30 PM',
            type: 'credit',
            description: 'Wallet Recharge',
            transactionId: 'TXN123456789'
        },
        {
            id: '3',
            amount: 25.75,
            date: '2024-06-08',
            time: '07:45 PM',
            type: 'debit',
            description: 'Grocery Store Purchase',
            transactionId: 'TXN987654320'
        },
        {
            id: '4',
            amount: 15.30,
            date: '2024-06-08',
            time: '02:20 PM',
            type: 'debit',
            description: 'Coffee Shop',
            transactionId: 'TXN987654319'
        },
        {
            id: '5',
            amount: 50.00,
            date: '2024-06-08',
            time: '11:45 AM',
            type: 'credit',
            description: 'Wallet Recharge',
            transactionId: 'TXN123456788'
        },
        {
            id: '6',
            amount: 35.20,
            date: '2024-06-07',
            time: '09:30 PM',
            type: 'debit',
            description: 'Online Shopping',
            transactionId: 'TXN987654318'
        },
        {
            id: '7',
            amount: 200.00,
            date: '2024-06-06',
            time: '03:15 PM',
            type: 'credit',
            description: 'Wallet Recharge',
            transactionId: 'TXN123456786'
        },
        {
            id: '8',
            amount: 18.90,
            date: '2024-06-06',
            time: '01:10 PM',
            type: 'debit',
            description: 'Restaurant Payment',
            transactionId: 'TXN987654317'
        },
        {
            id: '9',
            amount: 60.40,
            date: '2024-06-05',
            time: '05:25 PM',
            type: 'debit',
            description: 'Gas Station',
            transactionId: 'TXN987654316'
        },
        {
            id: '10',
            amount: 150.00,
            date: '2024-06-04',
            time: '07:45 AM',
            type: 'credit',
            description: 'Wallet Recharge',
            transactionId: 'TXN123456784'
        }
    ]

    const quickRechargeAmounts = [50, 100, 200, 500]

    const getStatusColor = (status: string) => {
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

    const getStatusText = (status: string) => {
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

    const getTransactionTypeColor = (type: string) => {
        return type === 'credit' ? 'text-green-600' : 'text-red-600'
    }

    const getTransactionIcon = (type: string) => {
        return type === 'credit' ? '↗️' : '↙️'
    }

    const handleRecharge = () => {
        if (rechargeAmount && parseFloat(rechargeAmount) > 0) {
            // Simulate successful recharge
            const newTransaction: RechargeHistoryItem = {
                id: Date.now().toString(),
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

    // Type guard to check if item is RechargeHistoryItem
    const isRechargeHistoryItem = (item: HistoryItem): item is RechargeHistoryItem => {
        return 'status' in item;
    }

    const RechargeHistoryCard = ({ item, index }: { item: RechargeHistoryItem; index: number }) => (
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

    const TransactionHistoryCard = ({ item, index }: { item: TransactionHistoryItem; index: number }) => (
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
                    <View className="flex-row items-center mb-1">
                        <Text className="text-lg mr-2">{getTransactionIcon(item.type)}</Text>
                        <Text className={`text-lg font-bold ${getTransactionTypeColor(item.type)}`}>
                            {item.type === 'credit' ? '+' : '-'}${item.amount.toFixed(2)}
                        </Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-900 mb-1">
                        {item.description}
                    </Text>
                    <Text className="text-sm text-gray-600">
                        {item.date} • {item.time}
                    </Text>
                </View>
            </View>

            <View className="border-t border-gray-100 pt-2 mt-2">
                <Text className="text-xs text-gray-500">
                    Transaction ID: {item.transactionId}
                </Text>
            </View>
        </MotiView>
    )

    const handleSeeAll = () => {
        if (activeTab === 'recharge') {
            setShowAllRecharge(!showAllRecharge)
        } else {
            setShowAllTransaction(!showAllTransaction)
        }
    }

    const getCurrentData = (): HistoryItem[] => {
        if (activeTab === 'recharge') {
            return showAllRecharge ? rechargeHistory : rechargeHistory.slice(0, 3)
        } else {
            return showAllTransaction ? transactionHistory : transactionHistory.slice(0, 3)
        }
    }

    const getCurrentShowAll = () => {
        return activeTab === 'recharge' ? showAllRecharge : showAllTransaction
    }

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

    const TabButton = ({ title, isActive, onPress }: any) => (
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
                <Text className="text-xl font-bold text-gray-900">Wallet</Text>
                <View className="w-10" />
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
                    <View className="bg-white rounded-3xl p-6 mb-4 shadow-xl border border-gray-100" style={{
                        shadowColor: '#FCD34D',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 12
                    }}>
                        {/* Header with Icon */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-yellow-100 rounded-2xl items-center justify-center mr-3">
                                    <Text className="text-yellow-600 text-xl">💰</Text>
                                </View>
                                <Text className="text-gray-800 text-lg font-semibold">
                                    Wallet Balance
                                </Text>
                            </View>
                            <View className="w-8 h-8 bg-yellow-50 rounded-full items-center justify-center">
                                <View className="w-2 h-2 bg-yellow-400 rounded-full" />
                            </View>
                        </View>

                        {/* Main Balance Amount */}
                        <View className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-4 mb-4">
                            <Text className="text-yellow-700 text-sm font-medium mb-1 opacity-80">
                                Available Balance
                            </Text>
                            <Text className="text-gray-900 text-4xl font-bold mb-2">
                                ${walletBalance.toFixed(2)}
                            </Text>
                            <View className="flex-row items-center">
                                <View className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2" />
                                <Text className="text-gray-600 text-xs font-medium">
                                    Active • Last updated now
                                </Text>
                            </View>
                        </View>

                        {/* Bonus Credits Section */}
                        <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <Text className="text-yellow-600 text-sm mr-2">🎁</Text>
                                        <Text className="text-yellow-800 text-sm font-semibold">
                                            Bonus Credits
                                        </Text>
                                    </View>
                                    <Text className="text-gray-900 text-xl font-bold">
                                        ${bonusCredits.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-yellow-600 text-xs font-medium mb-1">
                                        Expires in
                                    </Text>
                                    <Text className="text-gray-700 text-sm font-semibold">
                                        90 days
                                    </Text>
                                </View>
                            </View>
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

                {/* Tab Buttons */}
                <View className="flex-row px-4 py-4">
                    <TabButton
                        title="Recharge History"
                        isActive={activeTab === 'recharge'}
                        onPress={() => {
                            setActiveTab('recharge')
                            setShowAllRecharge(false)
                            setShowAllTransaction(false)
                        }}
                    />
                    <TabButton
                        title="Transaction History"
                        isActive={activeTab === 'transaction'}
                        onPress={() => {
                            setActiveTab('transaction')
                            setShowAllRecharge(false)
                            setShowAllTransaction(false)
                        }}
                    />
                </View>

                {/* See All Button */}
                <View className="flex-row justify-end px-4 mb-4">
                    <TouchableOpacity
                        onPress={handleSeeAll}
                        className={`px-4 py-2 rounded-lg border ${getCurrentShowAll()
                            ? 'bg-yellow-400 border-yellow-500'
                            : 'bg-gray-100 border-gray-300'
                            }`}
                    >
                        <Text className={`font-medium ${getCurrentShowAll()
                            ? 'text-gray-900'
                            : 'text-gray-700'
                            }`}>
                            {getCurrentShowAll() ? '✓ All Displayed' : 'See All'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* History List */}
                <View className="flex-1">
                    <FlatList<HistoryItem>
                        data={getCurrentData()}
                        renderItem={({ item, index }) =>
                            isRechargeHistoryItem(item) ? (
                                <RechargeHistoryCard item={item} index={index} />
                            ) : (
                                <TransactionHistoryCard item={item} index={index} />
                            )
                        }
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 70 }}
                        scrollEnabled={false}
                    />
                </View>

                {/* Empty State */}
                {getCurrentData().length === 0 && (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 400 }}
                        className="flex-1 items-center justify-center px-8 py-12"
                    >
                        <Text className="text-6xl mb-4">💳</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-2">No Transactions</Text>
                        <Text className="text-gray-600 text-center">
                            Your {activeTab === 'recharge' ? 'recharge' : 'transaction'} history will appear here once you make your first transaction.
                        </Text>
                    </MotiView>
                )}
            </ScrollView>

            {/* Options Modal */}
            {/* <OptionsModal /> */}
        </SafeAreaView>
    )
}

export default Wallet