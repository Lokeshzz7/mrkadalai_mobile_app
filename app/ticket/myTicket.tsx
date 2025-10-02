import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
    FlatList,
    RefreshControl
} from "react-native";
import { router } from "expo-router";
import { apiRequest } from "../../utils/api";
import Toast from "react-native-toast-message";
import CustomNativeLoader from "@/components/CustomNativeLoader";

interface Ticket {
    id: string;
    ticketNumber: string;
    progress: string;
    progressPercentage: number;
    dateIssued: string;
    description: string;
    issueType: string;
    status: string;
    resolvedDate?: string;
    title: string;
    priority: string;
    resolutionNote?: string;
}

interface TicketCardProps {
    ticket: Ticket;
}

interface TabButtonProps {
    title: string;
    isActive: boolean;
    onPress: () => void;
}

interface EmptyStateProps {
    message: string;
}

const getProgressColor = (progress: string) => {
    switch (progress.toLowerCase()) {
        case "in progress":
            return "#3B82F6";
        case "under review":
            return "#F59E0B";
        case "waiting for response":
            return "#EF4444";
        case "resolved":
        case "completed":
            return "#10B981";
        default:
            return "#6B7280";
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const TicketCard = React.memo(({ ticket }: TicketCardProps) => (
    <View
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
    >
        {/* Ticket Header */}
        <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">
                    {ticket.ticketNumber}
                </Text>
                <View className="flex-row items-center">
                    <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getProgressColor(ticket.progress) }}
                    />
                    <Text
                        className="text-sm font-semibold"
                        style={{ color: getProgressColor(ticket.progress) }}
                    >
                        {ticket.progress}
                    </Text>
                </View>
            </View>
            <View className="items-end">
                <Text className="text-xs text-gray-500 mb-1">
                    Issue Type
                </Text>
                <Text className="text-sm font-semibold text-[#EBB22F]">
                    {ticket.issueType}
                </Text>
            </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs text-gray-500">Progress</Text>
                <Text className="text-xs font-semibold text-gray-700">
                    {ticket.progressPercentage}%
                </Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
                <View
                    className="h-2 rounded-full"
                    style={{
                        width: `${ticket.progressPercentage}%`,
                        backgroundColor: getProgressColor(ticket.progress)
                    }}
                />
            </View>
        </View>

        {/* Date Information */}
        <View className="flex-row justify-between items-center mb-3">
            <View>
                <Text className="text-xs text-gray-500 mb-1">Date Issued</Text>
                <Text className="text-sm font-semibold text-gray-700">
                    {formatDate(ticket.dateIssued)}
                </Text>
            </View>
            {ticket.resolvedDate && (
                <View>
                    <Text className="text-xs text-gray-500 mb-1">Resolved Date</Text>
                    <Text className="text-sm font-semibold text-green-600">
                        {formatDate(ticket.resolvedDate)}
                    </Text>
                </View>
            )}
        </View>

        {/* Description */}
        <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Description</Text>
            <Text className="text-sm text-gray-700 leading-5" numberOfLines={2}>
                {ticket.description}
            </Text>
        </View>

        {/* View Details Button */}
        <View className="flex-row justify-end">
            <TouchableOpacity
                className="bg-[#EBB22F] px-4 py-2 rounded-lg"
                onPress={() => {
                    router.push({
                        pathname: "/ticket/viewDetailsTicket",
                        params: { ticketId: ticket.id }
                    });
                }}
                activeOpacity={0.8}
            >
                <Text className="text-white text-sm font-semibold">
                    View Details
                </Text>
            </TouchableOpacity>
        </View>
    </View>
));

const TabButton = React.memo(({ title, isActive, onPress }: TabButtonProps) => (
    <TouchableOpacity
        className={`flex-1 py-3 px-4 rounded-lg mx-1 ${isActive ? 'bg-[#EBB22F]' : 'bg-gray-200'}`}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <Text className={`text-center font-semibold ${isActive ? 'text-white' : 'text-gray-600'}`}>
            {title}
        </Text>
    </TouchableOpacity>
));

const EmptyState = React.memo(({ message }: EmptyStateProps) => (
    <View
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        className="flex-1 items-center justify-center py-20"
    >
        <Text className="text-6xl mb-4">🎫</Text>
        <Text className="text-lg font-semibold text-gray-600 mb-2">
            No Tickets Found
        </Text>
        <Text className="text-sm text-gray-500 text-center px-8">
            {message}
        </Text>
    </View>
));

const myTicket = () => {
    const [activeTab, setActiveTab] = useState("ongoing");
    const [tickets, setTickets] = useState<{ ongoing: Ticket[]; completed: Ticket[] }>({
        ongoing: [],
        completed: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTickets = useCallback(async () => {
        try {
            const response = await apiRequest('/customer/outlets/tickets', {
                method: 'GET',
            });

            setTickets(response.tickets);
        } catch (error: any) {
            console.error('Error fetching tickets:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to fetch tickets',
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTickets();
    }, [fetchTickets]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#EBB22F" />
                <Text className="text-gray-600 mt-4">Loading tickets...</Text>
                {/* <CustomNativeLoader /> */}
            </SafeAreaView>
        );
    }

    const currentTickets = activeTab === "ongoing" ? tickets.ongoing : tickets.completed;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl text-gray-700">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">My Tickets</Text>

                <TouchableOpacity className="p-1" onPress={() => router.push("/(tabs)")}>
                    <Text className="text-sm text-[#EBB22F] font-semibold">Home</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Buttons */}
            <View className="px-4 py-4 bg-white border-b border-gray-100">
                <View className="flex-row">
                    <TabButton
                        title={`Ongoing (${tickets.ongoing.length})`}
                        isActive={activeTab === "ongoing"}
                        onPress={() => setActiveTab("ongoing")}
                    />
                    <TabButton
                        title={`Completed (${tickets.completed.length})`}
                        isActive={activeTab === "completed"}
                        onPress={() => setActiveTab("completed")}
                    />
                </View>
            </View>

            {/* Tickets List - Replaced with FlatList for performance */}
            <FlatList
                data={currentTickets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TicketCard ticket={item} />}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        message={
                            activeTab === "ongoing"
                                ? "You don't have any ongoing tickets at the moment."
                                : "You don't have any completed tickets yet."
                        }
                    />
                }
            />

            {/* Floating Action Button for new ticket */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-[#EBB22F] w-14 h-14 rounded-full items-center justify-center shadow-lg"
                onPress={() => {
                    router.push("/ticket/raiseTicket");
                }}
                activeOpacity={0.8}
            >
                <Text className="text-white text-2xl font-bold">+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default myTicket;