import React, { useState, useEffect } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity
} from "react-native";
import { MotiView, MotiText } from "moti";
import { router, useLocalSearchParams } from "expo-router";

// Extended ticket data with additional fields for timeline
const extendedTicketData = {
    "TKT001": {
        id: "TKT001",
        ticketNumber: "TKT-2024-001",
        progress: "In Progress",
        progressPercentage: 60,
        dateIssued: "2024-06-28",
        description: "Unable to reset password using the forgot password feature. I have tried multiple times but the reset link is not working properly. Please help me resolve this issue as soon as possible.",
        issueType: "Account Issues",
        status: "open",
        priority: "High",
        assignedTo: "Admin Team",
        dateAccepted: "2024-06-29",
        resolvedDate: null
    },
    "TKT002": {
        id: "TKT002",
        ticketNumber: "TKT-2024-002",
        progress: "Under Review",
        progressPercentage: 30,
        dateIssued: "2024-06-29",
        description: "Payment failed but amount was deducted from my account. The transaction shows as successful on my bank statement but the order was not processed. I need immediate assistance to resolve this payment issue.",
        issueType: "Payment Problems",
        status: "open",
        priority: "High",
        assignedTo: "Payment Team",
        dateAccepted: "2024-06-30",
        resolvedDate: null
    },
    "TKT003": {
        id: "TKT003",
        ticketNumber: "TKT-2024-003",
        progress: "Waiting for Response",
        progressPercentage: 80,
        dateIssued: "2024-06-30",
        description: "Order was delivered but items are missing from the package. I ordered 5 items but only received 3. The delivery person confirmed all items were in the package but some are clearly missing. Please investigate and send the missing items.",
        issueType: "Order Issues",
        status: "open",
        priority: "Medium",
        assignedTo: "Support Team",
        dateAccepted: "2024-06-30",
        resolvedDate: null
    },
    "TKT004": {
        id: "TKT004",
        ticketNumber: "TKT-2024-004",
        progress: "Resolved",
        progressPercentage: 100,
        dateIssued: "2024-06-25",
        description: "App crashes when trying to view order history. Every time I try to access my order history, the app closes unexpectedly. This makes it impossible to track my previous orders and deliveries.",
        issueType: "Technical Support",
        status: "closed",
        priority: "Medium",
        assignedTo: "Tech Team",
        dateAccepted: "2024-06-26",
        resolvedDate: "2024-06-27"
    },
    "TKT005": {
        id: "TKT005",
        ticketNumber: "TKT-2024-005",
        progress: "Completed",
        progressPercentage: 100,
        dateIssued: "2024-06-20",
        description: "Need help updating profile information. I want to change my contact number and email address but the update button is not working properly. Please help me update my profile details.",
        issueType: "Account Issues",
        status: "closed",
        priority: "Low",
        assignedTo: "Support Team",
        dateAccepted: "2024-06-21",
        resolvedDate: "2024-06-22"
    }
};

const viewDetailsTicket = () => {
    const params = useLocalSearchParams();
    const [ticketData, setTicketData] = useState(null);

    useEffect(() => {
        // Get ticket ID from navigation params
        const ticketId = params.ticketId;
        if (ticketId && extendedTicketData[ticketId]) {
            setTicketData(extendedTicketData[ticketId]);
        } else {
            // Fallback to first ticket if no ID provided
            setTicketData(extendedTicketData["TKT001"]);
        }
    }, [params]);

    if (!ticketData) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <Text className="text-lg text-gray-500">Loading ticket details...</Text>
            </SafeAreaView>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
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

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "#EF4444";
            case "medium":
                return "#F59E0B";
            case "low":
                return "#10B981";
            default:
                return "#6B7280";
        }
    };

    const TimelineItem = ({ step, title, date, isCompleted, isLast }: any) => (
        <View className="flex-row items-start">
            {/* Timeline Circle and Line */}
            <View className="items-center mr-4">
                <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'timing', duration: 500, delay: step * 200 }}
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isCompleted
                        ? 'bg-[#EBB22F] border-[#EBB22F]'
                        : 'bg-white border-gray-300'
                        }`}
                >
                    {isCompleted && (
                        <MotiView
                            from={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: step * 200 + 200 }}
                        >
                            <Text className="text-white text-xs font-bold">✓</Text>
                        </MotiView>
                    )}
                </MotiView>

                {/* Vertical Line */}
                {!isLast && (
                    <MotiView
                        from={{ height: 0 }}
                        animate={{ height: 60 }}
                        transition={{ type: 'timing', duration: 400, delay: step * 200 + 100 }}
                        className={`w-0.5 mt-1 ${isCompleted ? 'bg-[#EBB22F]' : 'bg-gray-300'
                            }`}
                    />
                )}
            </View>

            {/* Timeline Content */}
            <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: step * 200 + 300 }}
                className="flex-1 pb-6"
            >
                <Text className={`text-base font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {title}
                </Text>
                {date && (
                    <Text className="text-sm text-gray-500 mt-1">
                        {formatDate(date)}
                    </Text>
                )}
            </MotiView>
        </View>
    );

    const isCompleted = ticketData.status === "closed";
    const hasBeenAccepted = ticketData.dateAccepted !== null;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl text-gray-700">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">Ticket Details</Text>

                <TouchableOpacity className="p-1" onPress={() => router.push("/(tabs)")}>
                    <Text className="text-sm text-[#EBB22F] font-semibold">Home</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-4 py-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Ticket Information Card */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100"
                >
                    {/* Ticket Header */}
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-2xl font-bold text-gray-900 mb-2">
                                {ticketData.ticketNumber}
                            </Text>
                            <View className="flex-row items-center">
                                <View
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: getStatusColor(ticketData.progress) }}
                                />
                                <Text
                                    className="text-sm font-semibold"
                                    style={{ color: getStatusColor(ticketData.progress) }}
                                >
                                    {ticketData.progress}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text
                                className="text-sm font-bold px-3 py-1 rounded-full"
                                style={{
                                    backgroundColor: getPriorityColor(ticketData.priority) + '20',
                                    color: getPriorityColor(ticketData.priority)
                                }}
                            >
                                {ticketData.priority} Priority
                            </Text>
                        </View>
                    </View>

                    {/* Ticket Details Grid */}
                    <View className="space-y-4">
                        <View className="flex-row justify-between">
                            <View className="flex-1 mr-4">
                                <Text className="text-sm text-gray-500 mb-1">Issue Type</Text>
                                <Text className="text-base font-semibold text-[#EBB22F]">
                                    {ticketData.issueType}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm text-gray-500 mb-1">Assigned To</Text>
                                <Text className="text-base font-semibold text-gray-700">
                                    {ticketData.assignedTo}
                                </Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-500 mb-1">Date Issued</Text>
                            <Text className="text-base font-semibold text-gray-700">
                                {formatDate(ticketData.dateIssued)}
                            </Text>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-500 mb-2">Description</Text>
                            <Text className="text-base text-gray-700 leading-6">
                                {ticketData.description}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Timeline Section */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 200 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                    {/* Timeline Header */}
                    <View className="flex-row items-center mb-6">
                        <View className="w-1 h-6 bg-[#EBB22F] rounded-full mr-3" />
                        <Text className="text-lg font-bold text-gray-900">
                            Ticket Progress Timeline
                        </Text>
                    </View>

                    {/* Timeline Items */}
                    <View className="ml-2">
                        <TimelineItem
                            step={1}
                            title="Ticket Created"
                            date={ticketData.dateIssued}
                            isCompleted={true}
                            isLast={false}
                        />

                        <TimelineItem
                            step={2}
                            title="Accepted by Admin"
                            date={ticketData.dateAccepted}
                            isCompleted={hasBeenAccepted}
                            isLast={false}
                        />

                        <TimelineItem
                            step={3}
                            title="Ticket Resolved"
                            date={ticketData.resolvedDate}
                            isCompleted={isCompleted}
                            isLast={true}
                        />
                    </View>

                    {/* Progress Summary */}
                    <View className="mt-6 pt-4 border-t border-gray-100">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-gray-500">Overall Progress</Text>
                            <Text className="text-sm font-semibold text-gray-700">
                                {ticketData.progressPercentage}%
                            </Text>
                        </View>
                        <View className="w-full h-2 bg-gray-200 rounded-full mt-2">
                            <MotiView
                                from={{ width: '0%' }}
                                animate={{ width: `${ticketData.progressPercentage}%` }}
                                transition={{ type: 'timing', duration: 1000, delay: 800 }}
                                className="h-2 bg-[#EBB22F] rounded-full"
                            />
                        </View>
                    </View>
                </MotiView>

                {/* Action Buttons */}
                {!isCompleted && (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 500, delay: 400 }}
                        className="flex-row justify-between mt-6 space-x-3"
                    >
                        <TouchableOpacity
                            className="flex-1 bg-gray-100 py-4 rounded-xl mr-2"
                            activeOpacity={0.8}
                        >
                            <Text className="text-center text-gray-700 font-semibold">
                                Add Comment
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-[#EBB22F] py-4 rounded-xl ml-2"
                            activeOpacity={0.8}
                        >
                            <Text className="text-center text-white font-semibold">
                                Update Ticket
                            </Text>
                        </TouchableOpacity>
                    </MotiView>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default viewDetailsTicket;