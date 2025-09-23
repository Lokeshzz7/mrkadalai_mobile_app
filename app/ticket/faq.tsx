import React, { useCallback, useState } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity,
    FlatList
} from "react-native";
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
        question: "How do I contact customer support?",
        answer: "You can contact our customer support team through multiple channels: use the 'Raise a Ticket' button below, email us at support@company.com, or call our helpline at 1-800-SUPPORT during business hours."
    },
    {
        id: 5,
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through encrypted channels."
    },
    {
        id: 6,
        question: "How long does shipping take?",
        answer: "Standard shipping typically takes 3-5 business days, while express shipping takes 1-2 business days. International orders may take 7-14 business days depending on the destination country."
    },
    {
        id: 7,
        question: "Can I cancel or modify my order?",
        answer: "Orders can be cancelled or modified within 1 hour of placement. After that, please contact customer support immediately. Once an order is shipped, it cannot be modified, but you can return items according to our return policy."
    },
    {
        id: 8,
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for most items. Products must be in original condition with tags attached. Refunds are processed within 5-7 business days after we receive the returned item."
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
                animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
                transition={{ type: 'timing', duration: 150 }}
            >
                <Text className="text-xl font-bold" style={{ color: '#EBB22F' }}>↓</Text>
            </View>
        </TouchableOpacity>

        {/* Answer */}
        {isExpanded && (
            <View
                from={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'timing', duration: 200 }}
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
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl text-gray-700">←</Text>
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