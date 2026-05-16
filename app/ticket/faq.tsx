import React, { useCallback, useState } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity,
    FlatList
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";

const faqData = [
    {
        id: 1,
        question: "How do I reset my password?",
        answer: "To reset your password, go to the login screen and tap 'Forgot Password'. Enter your email address and we'll send you a reset link. Follow the instructions in the email to create a new password."
    },
    {
        id: 2,
        question: "How can I update my profile information?",
        answer: "You can update your profile by going to Settings > Profile. From there, you can edit your name, email, phone number, and other personal information. Don't forget to save your changes."
    },
    {
        id: 3,
        question: "Where can I view my order history?",
        answer: "Your order history is available in the 'Orders' section of your account. You can access it from the main menu or your profile page. Here you'll see all past orders with their status and details."
    },
    {
        id: 4,
        question: "How do I contact Customer Support?",
        answer: "You can contact support by clicking on the \"Raise a ticket\" button. You can also reach out to our team through mrkadalaishop@gmail.com on email or mr.kadalai on Instagram"
    },
    {
        id: 5,
        question: "What payment methods do you accept?",
        answer: "We accept the major payment methods, including: UPI and Cash"
    }
];

interface FaqDataItem {
    id: number;
    question: string;
    answer: string;
}


interface FAQItemProps {
    item: FaqDataItem;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const FAQItem = React.memo<FAQItemProps>(({ item, isExpanded, onToggleExpand }) => (
    <View
        className="bg-white rounded-lg mb-3 overflow-hidden"
        style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        }}
    >
        {/* Question */}
        <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            onPress={onToggleExpand}
            activeOpacity={0.7}
        >
            <Text className="flex-1 text-base font-semibold text-black pr-3">
                {item.question}
            </Text>
            <View
                style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
            >
                <Text className="text-xl font-bold" style={{ color: '#EBB22F' }}>↓</Text>
            </View>
        </TouchableOpacity>

        {/* Answer */}
        {isExpanded && (
            <View
                style={{ overflow: 'hidden' }}
            >
                <View className="px-4 pb-4 border-t border-gray-100">
                    <Text className="text-gray-700 text-sm leading-6 mt-3">
                        {item.answer}
                    </Text>
                </View>
            </View>
        )}
    </View>
));

const FAQ = () => {
    const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({});
    const toggleExpand = useCallback((id: number) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }, []);

    const handleRaiseTicket = useCallback(() => {
        router.push("/ticket/raiseTicket");
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 shadow-sm active:bg-gray-100"
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color="#374151" className="mr-0.5" />
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">FAQ</Text>

                <TouchableOpacity className="p-1" onPress={() => router.push('/ticket/myTicket')}>
                    <Text className="text-sm text-[#EBB22F] font-semibold">My Ticket</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ OPTIMIZATION: Use FlatList for the FAQ items */}
            <FlatList
                data={faqData}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <FAQItem
                        item={item}
                        isExpanded={!!expandedItems[item.id]}
                        onToggleExpand={() => toggleExpand(item.id)}
                    />
                )}
                ListFooterComponent={
                    <>
                        {/* Raise Ticket Button */}
                        <View className="pt-4 pb-8">
                            <TouchableOpacity
                                className="rounded-lg py-4 px-6 shadow-md"
                                style={{ backgroundColor: '#EBB22F' }}
                                onPress={handleRaiseTicket}
                                activeOpacity={0.8}
                            >
                                <Text className="text-center text-white text-lg font-bold">
                                    Raise a Ticket
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Help Text */}
                        <View className="pb-6">
                            <Text className="text-center text-gray-500 text-sm">
                                Still have questions? Our support team is here to help!
                            </Text>
                        </View>
                    </>
                }
            />
        </SafeAreaView>
    );
};

export default FAQ;