import React, { useState } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity
} from "react-native";
import { MotiView, MotiText } from "moti";
import { router } from "expo-router";

// Sample ticket data
const ticketData = {
    ongoing: [
        {
            id: "TKT001",
            ticketNumber: "TKT-2024-001",
            progress: "In Progress",
            progressPercentage: 60,
            dateIssued: "2024-06-28",
            description: "Unable to reset password using the forgot password feature",
            issueType: "Account Issues",
            status: "open"
        },
        {
            id: "TKT002",
            ticketNumber: "TKT-2024-002",
            progress: "Under Review",
            progressPercentage: 30,
            dateIssued: "2024-06-29",
            description: "Payment failed but amount was deducted from my account",
            issueType: "Payment Problems",
            status: "open"
        },
        {
            id: "TKT003",
            ticketNumber: "TKT-2024-003",
            progress: "Waiting for Response",
            progressPercentage: 80,
            dateIssued: "2024-06-30",
            description: "Order was delivered but items are missing from the package",
            issueType: "Order Issues",
            status: "open"
        }
    ],
    completed: [
        {
            id: "TKT004",
            ticketNumber: "TKT-2024-004",
            progress: "Resolved",
            progressPercentage: 100,
            dateIssued: "2024-06-25",
            description: "App crashes when trying to view order history",
            issueType: "Technical Support",
            status: "closed",
            resolvedDate: "2024-06-27"
        },
        {
            id: "TKT005",
            ticketNumber: "TKT-2024-005",
            progress: "Completed",
            progressPercentage: 100,
            dateIssued: "2024-06-20",
            description: "Need help updating profile information",
            issueType: "Account Issues",
            status: "closed",
            resolvedDate: "2024-06-22"
        }
    ]
};

const myTicket = () => {
    const [activeTab, setActiveTab] = useState("ongoing");

    const getProgressColor = (progress) => {
        switch (progress.toLowerCase()) {
            case "in progress":
                return "#3B82F6"; // Blue
            case "under review":
                return "#F59E0B"; // Yellow
            case "waiting for response":
                return "#EF4444"; // Red
            case "resolved":
            case "completed":
                return "#10B981"; // Green
            default:
                return "#6B7280"; // Gray
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const TicketCard = ({ ticket }) => (
        <MotiView
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
                        // Navigate to ticket details with ticket ID
                        console.log("View details for ticket:", ticket.ticketNumber);
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
        </MotiView>
    );

    const TabButton = ({ title, isActive, onPress }) => (
        <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg mx-1 ${isActive ? 'bg-[#EBB22F]' : 'bg-gray-200'
                }`}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text className={`text-center font-semibold ${isActive ? 'text-white' : 'text-gray-600'
                }`}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const EmptyState = ({ message }) => (
        <MotiView
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
        </MotiView>
    );

    const currentTickets = activeTab === "ongoing" ? ticketData.ongoing : ticketData.completed;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl text-gray-700">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">My Tickets</Text>

                <View className="flex-row">
                    <TouchableOpacity className="p-1" onPress={() => router.push("/(tabs)")}>
                        <Text className="text-sm text-[#EBB22F] font-semibold">Home</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab Buttons */}
            <View className="px-4 py-4 bg-white border-b border-gray-100">
                <View className="flex-row">
                    <TabButton
                        title={`Ongoing (${ticketData.ongoing.length})`}
                        isActive={activeTab === "ongoing"}
                        onPress={() => setActiveTab("ongoing")}
                    />
                    <TabButton
                        title={`Completed (${ticketData.completed.length})`}
                        isActive={activeTab === "completed"}
                        onPress={() => setActiveTab("completed")}
                    />
                </View>
            </View>

            {/* Tickets List */}
            <ScrollView
                className="flex-1 px-4 py-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 70 }}
            >
                {currentTickets.length > 0 ? (
                    currentTickets.map((ticket, index) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))
                ) : (
                    <EmptyState
                        message={
                            activeTab === "ongoing"
                                ? "You don't have any ongoing tickets at the moment."
                                : "You don't have any completed tickets yet."
                        }
                    />
                )}

                {/* Add some bottom padding */}
                <View className="h-6" />
            </ScrollView>

            {/* Floating Action Button for new ticket */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-[#EBB22F] w-14 h-14 rounded-full items-center justify-center shadow-lg"
                onPress={() => {
                    // Navigate to raise ticket screen
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