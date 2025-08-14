import React, { useState, useEffect } from 'react'
import {
    FlatList,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native'
import { MotiView, MotiText } from 'moti'
import { apiRequest } from '../../../utils/api'
import RazorpayCheckout from 'react-native-razorpay';

interface RequestOptions extends RequestInit {
    body?: any;
}

// Wallet API Services
const walletAPI = {
    // 1. Create a Razorpay order before payment
    createRechargeOrder: async (amount: number) => {
        return apiRequest('/customer/outlets/create-wallet-recharge-order', {
            method: 'POST',
            body: { amount }
        });
    },

    // 2. Verify the payment after the user completes it on Razorpay
    verifyRechargePayment: async (paymentData: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => {
        return apiRequest('/customer/outlets/verify-wallet-recharge', {
            method: 'POST',
            body: paymentData
        });
    },

    // 3. Get recent transactions (all transactions)
    getRecentTransactions: async () => {
        return apiRequest('/customer/outlets/get-recent-recharge', {
            method: 'GET'
        });
    },

    // 4. Get wallet details
    getWalletDetails: async () => {
        return apiRequest('/customer/outlets/get-wallet-details', {
            method: 'GET'
        });
    },

    // 5. Get recharge history only
    getRechargeHistory: async () => {
        return apiRequest('/customer/outlets/get-recharge-history', {
            method: 'GET'
        });
    }
};

type RechargeHistoryItem = {
    id: string;
    amount: number;
    date: string;
    time: string;
    status: 'completed' | 'pending' | 'failed' | 'successful';
    transactionId: string;
    method: string;
    createdAt: string;
};

type TransactionHistoryItem = {
    id: string;
    amount: number;
    date: string;
    time: string;
    type: 'debit' | 'credit';
    description: string;
    transactionId: string;
    method: string;
    status: string;
    createdAt: string;
};

// Union type for FlatList data
type HistoryItem = RechargeHistoryItem | TransactionHistoryItem;

const Wallet = () => {
    const [activeTab, setActiveTab] = useState('recharge')
    const [showAllRecharge, setShowAllRecharge] = useState(false)
    const [showAllTransaction, setShowAllTransaction] = useState(false)

    const [rechargeAmount, setRechargeAmount] = useState('')
    const [showOptionsModal, setShowOptionsModal] = useState(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI')
    const [walletBalance, setWalletBalance] = useState(0)
    const [bonusCredits, setBonusCredits] = useState(0)
    const [totalRecharged, setTotalRecharged] = useState(0)
    const [totalUsed, setTotalUsed] = useState(0)

    // Loading states
    const [isLoading, setIsLoading] = useState(false)
    const [isRecharging, setIsRecharging] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Data states
    const [rechargeHistory, setRechargeHistory] = useState<RechargeHistoryItem[]>([])
    const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([])

    const quickRechargeAmounts = [50, 100, 200, 500]
    const paymentMethods = ['UPI', 'CARD']

    // Transform backend transaction to frontend format
    const transformRechargeTransaction = (transaction: any): RechargeHistoryItem => {
        const date = new Date(transaction.createdAt);
        return {
            id: transaction.id.toString(),
            amount: transaction.walletAmount || 0,
            date: date.toISOString().split('T')[0],
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            status: 'successful',
            transactionId: `TXN${transaction.id}`,
            method: transaction.method,
            createdAt: transaction.createdAt
        };
    };

    const transformAllTransactions = (transaction: any): TransactionHistoryItem => {
        const date = new Date(transaction.createdAt);
        return {
            id: transaction.id.toString(),
            amount: transaction.amount || 0,
            date: date.toISOString().split('T')[0],
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            type: transaction.status === 'RECHARGE' ? 'credit' : 'debit',
            description: transaction.status === 'RECHARGE' ? 'Wallet Recharge' : 'Payment',
            transactionId: `TXN${transaction.id}`,
            method: transaction.method,
            status: transaction.status,
            createdAt: transaction.createdAt
        };
    };

    // Fetch wallet details
    const fetchWalletDetails = async () => {
        try {
            setIsLoading(true);
            const response = await walletAPI.getWalletDetails();

            if (response.wallet) {
                setWalletBalance(response.wallet.balance || 0);
                setTotalRecharged(response.wallet.totalRecharged || 0);
                setTotalUsed(response.wallet.totalUsed || 0);
                // Calculate bonus credits (you can modify this logic)
                setBonusCredits(response.wallet.balance * 0.1); // 10% of balance as bonus
            }
        } catch (error) {
            console.error('Error fetching wallet details:', error);
            Alert.alert('Error', 'Failed to fetch wallet details');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch recharge history
    const fetchRechargeHistory = async () => {
        try {
            const response = await walletAPI.getRechargeHistory();

            if (response.rechargeHistory) {
                const transformedHistory = response.rechargeHistory.map(transformRechargeTransaction);
                setRechargeHistory(transformedHistory);
            }
        } catch (error) {
            console.error('Error fetching recharge history:', error);
            Alert.alert('Error', 'Failed to fetch recharge history');
        }
    };

    // Fetch all transactions
    const fetchAllTransactions = async () => {
        try {
            const response = await walletAPI.getRecentTransactions();

            if (response.transactions) {
                const transformedTransactions = response.transactions.map(transformAllTransactions);
                setTransactionHistory(transformedTransactions);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            Alert.alert('Error', 'Failed to fetch transaction history');
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        await Promise.all([
            fetchWalletDetails(),
            fetchRechargeHistory(),
            fetchAllTransactions()
        ]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadInitialData();
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'successful':
            case 'RECHARGE':
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
            case 'RECHARGE':
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

    const handleRecharge = async () => {
        const amount = parseFloat(rechargeAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
            return;
        }

        setIsRecharging(true);

        try {
            // Step 1: Create an order from your backend
            const orderResponse = await walletAPI.createRechargeOrder(amount);

            if (!orderResponse.order || !orderResponse.order.id) {
                throw new Error(orderResponse.message || 'Failed to create payment order.');
            }

            const { id: order_id, amount: payableAmount } = orderResponse.order; // amount is in paise
            const { serviceCharge } = orderResponse.breakdown;

            // Prepare options for Razorpay Checkout
            const options = {
                description: `Recharge for ₹${amount} (+ ₹${serviceCharge} fee)`,
                currency: 'INR',
                key: 'rzp_test_CqJOLIOhHoCry6', // IMPORTANT: Replace with your actual Razorpay Key ID
                amount: payableAmount, // Amount in paise, from your backend response
                name: 'Delicious Bites Restaurant', // Your application's name
                order_id: order_id, // The unique order_id from your backend
                prefill: {
                    email: 'customer@restaurant.com',
                    name: 'Valued Customer'
                },
                theme: { color: '#FCD34D' }, // Match your app's theme color
            };

            // Step 2: Open Razorpay Checkout and handle the response
            RazorpayCheckout.open(options).then(async (data) => {
                // This block runs when the payment is successful on Razorpay's end
                try {
                    // Step 3: Verify the payment on your backend for security
                    const verificationData = {
                        razorpay_order_id: data.razorpay_order_id,
                        razorpay_payment_id: data.razorpay_payment_id,
                        razorpay_signature: data.razorpay_signature,
                    };

                    const verifyResponse = await walletAPI.verifyRechargePayment(verificationData);

                    if (verifyResponse.wallet) {
                        Alert.alert('Success', 'Wallet recharged successfully!');
                        setRechargeAmount('');

                        // Refresh all wallet data to show the new balance and transaction history
                        await loadInitialData();
                    } else {
                        // Handle cases where verification fails on the server
                        throw new Error(verifyResponse.message || 'Payment verification failed. Please contact support.');
                    }
                } catch (verificationError) {
                    console.error('Verification Error:', verificationError);
                    Alert.alert('Verification Failed', verificationError.message);
                } finally {
                    setIsRecharging(false);
                }
            }).catch((error) => {
                // This block runs if the user cancels or the payment fails
                console.log(`Razorpay Error: ${error.code} | ${error.description}`);
                Alert.alert('Payment Failed', 'The payment was not completed. Please try again.');
                setIsRecharging(false);
            });

        } catch (apiError) {
            // This block catches errors from your API (e.g., failing to create the order)
            console.error('Recharge initiation error:', apiError);
            Alert.alert('Error', apiError.message || 'Could not initiate the recharge process.');
            setIsRecharging(false);
        }
    };

    // Type guard to check if item is RechargeHistoryItem
    const isRechargeHistoryItem = (item: HistoryItem): item is RechargeHistoryItem => {
        return 'status' in item && !('type' in item);
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
                        ₹{item.amount.toFixed(2)}
                    </Text>
                    <Text className="text-sm text-gray-600">
                        {item.date} • {item.time}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        via {item.method}
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
                            {item.type === 'credit' ? '+' : '-'}₹{item.amount.toFixed(2)}
                        </Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-900 mb-1">
                        {item.description}
                    </Text>
                    <Text className="text-sm text-gray-600">
                        {item.date} • {item.time}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        via {item.method}
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
                className={`py-3 rounded-xl mx-1 border ${isActive ? 'border-yellow-400' : 'border-gray-200'}`}
            >
                <Text className={`text-center font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                    {title}
                </Text>
            </MotiView>
        </TouchableOpacity>
    )

    const refreshData = async () => {
        await loadInitialData();
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#FCD34D" />
                <Text className="mt-2 text-gray-600">Loading wallet...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <TouchableOpacity className="p-2">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Wallet</Text>
                <TouchableOpacity onPress={refreshData} className="p-2">
                    <Text className="text-lg">🔄</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 70 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
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
                                ₹{walletBalance.toFixed(2)}
                            </Text>
                            <View className="flex-row items-center">
                                <View className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2" />
                                <Text className="text-gray-600 text-xs font-medium">
                                    Active • Last updated now
                                </Text>
                            </View>
                        </View>

                        {/* Stats Section */}
                        <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <Text className="text-yellow-600 text-sm mr-2">🎁</Text>
                                        <Text className="text-yellow-800 text-sm font-semibold">
                                            Total Recharged
                                        </Text>
                                    </View>
                                    <Text className="text-gray-900 text-xl font-bold">
                                        ₹{totalRecharged.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-yellow-600 text-xs font-medium mb-1">
                                        Total Used
                                    </Text>
                                    <Text className="text-gray-700 text-sm font-semibold">
                                        ₹{totalUsed.toFixed(2)}
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
                                    className={`px-4 py-2 rounded-xl flex-1 mx-1 ${rechargeAmount === amount.toString()
                                        ? 'bg-yellow-400 border-yellow-500'
                                        : 'bg-yellow-100 border-yellow-200'
                                        } border`}
                                    onPress={() => setRechargeAmount(amount.toString())}
                                >
                                    <Text className={`text-center font-medium ${rechargeAmount === amount.toString()
                                        ? 'text-gray-900'
                                        : 'text-gray-800'
                                        }`}>
                                        ₹{amount}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Amount Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-medium mb-2">Enter Amount</Text>
                            <TextInput
                                className="border border-gray-200 rounded-xl px-4 py-3 text-lg font-medium"
                                placeholder="₹0.00"
                                value={rechargeAmount}
                                onChangeText={setRechargeAmount}
                                keyboardType="numeric"
                                editable={!isRecharging}
                            />
                        </View>

                        {/* Payment Method Selection */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-medium mb-2">Payment Method</Text>
                            <View className="flex-row flex-wrap">
                                {paymentMethods.map((method) => (
                                    <TouchableOpacity
                                        key={method}
                                        className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${selectedPaymentMethod === method
                                            ? 'bg-yellow-400 border-yellow-500'
                                            : 'bg-gray-100 border-gray-200'
                                            }`}
                                        onPress={() => setSelectedPaymentMethod(method)}
                                    >
                                        <Text className={`text-sm font-medium ${selectedPaymentMethod === method
                                            ? 'text-gray-900'
                                            : 'text-gray-600'
                                            }`}>
                                            {method}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Pay Button */}
                        <TouchableOpacity
                            className={`py-4 rounded-xl ${isRecharging ? 'bg-yellow-200' : 'bg-yellow-400'}`}
                            onPress={handleRecharge}
                            disabled={isRecharging}
                        >
                            {isRecharging ? (
                                <View className="flex-row items-center justify-center">
                                    <ActivityIndicator size="small" color="#000" />
                                    <Text className="ml-2 text-center font-bold text-gray-900 text-lg">
                                        Processing...
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-center font-bold text-gray-900 text-lg">
                                    💰 Pay ₹{rechargeAmount || '0'}
                                </Text>
                            )}
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
                        title="All Transactions"
                        isActive={activeTab === 'transaction'}
                        onPress={() => {
                            setActiveTab('transaction')
                            setShowAllRecharge(false)
                            setShowAllTransaction(false)
                        }}
                    />
                </View>

                {/* History Section */}
                <View className="px-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-900">
                            {activeTab === 'recharge' ? 'Recent Recharges' : 'Recent Transactions'}
                        </Text>
                        {((activeTab === 'recharge' && rechargeHistory.length > 3) ||
                            (activeTab === 'transaction' && transactionHistory.length > 3)) && (
                                <TouchableOpacity onPress={handleSeeAll}>
                                    <Text className="text-yellow-600 font-medium">
                                        {getCurrentShowAll() ? 'Show Less' : 'See All'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                    </View>

                    {getCurrentData().length === 0 ? (
                        <View className="bg-white rounded-2xl p-8 items-center justify-center">
                            <Text className="text-6xl mb-4">📝</Text>
                            <Text className="text-gray-600 text-center">
                                No {activeTab === 'recharge' ? 'recharge' : 'transaction'} history yet
                            </Text>
                            <Text className="text-gray-500 text-sm text-center mt-2">
                                Your {activeTab === 'recharge' ? 'recharges' : 'transactions'} will appear here
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={getCurrentData()}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => {
                                if (isRechargeHistoryItem(item)) {
                                    return <RechargeHistoryCard item={item} index={index} />
                                } else {
                                    return <TransactionHistoryCard item={item} index={index} />
                                }
                            }}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Wallet;