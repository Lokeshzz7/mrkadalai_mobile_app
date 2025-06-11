import React from "react";

import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity
} from "react-native";

import { MotiView, MotiText } from "moti";


const transactionHistory = () => {
    const transaction = [
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

    const TransactionHistoryCard = ({ item, index }: any) => (
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
            <View
                className="flex-row justify-between items-start mb-2"
            >
                <View
                    className="flex-1"
                >
                    <Text
                        className="text-lg font-bold text-gray-900 mb-1"
                    >
                        ${item.amount.toFixed(2)}
                    </Text>
                    <Text>
                        {item.date} • {item.time}
                    </Text>

                </View>
                <View
                    className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}
                >
                    <Text className="text-xs font-medium">
                        {item.status}
                    </Text>
                </View>
            </View>
        </MotiView>
    )


    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
            >
                <TouchableOpacity className="p-2">
                    <Text className="text-2xl">
                        ←
                    </Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">
                    Transaction History
                </Text>
            </View>

            <ScrollView
                className="flex-1" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 70 }}
            >
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 600, delay: 400 }}
                    className="px-4 mb-6"
                >
                    <View
                        className="flex-1 pb-6"
                    >
                        {transaction.map((item, index) => (
                            <TransactionHistoryCard key={item.id} item={item} index={index} />
                        ))}
                    </View>
                </MotiView>
            </ScrollView>

        </SafeAreaView>
    )
}