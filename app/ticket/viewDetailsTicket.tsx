import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { apiRequest } from "../../utils/api";
import CustomNativeLoader from "@/components/CustomNativeLoader";

export interface TicketData {
    id: string;
    ticketNumber: string;
    progress: string;
    progressPercentage: number;
    dateIssued: string;
    description: string;
    issueType: string;
    status: "open" | "closed";
    priority: "High" | "Medium" | "Low";
    assignedTo: string;
    dateAccepted: string | null;
    resolvedDate: string | null;
    title: string;
    resolutionNote: string | null;
}

export interface TimelineItemProps {
    step: number;
    title: string;
    date: string | null;
    isCompleted: boolean;
    isLast: boolean;
}

const formatDate = (dateString: string) => {
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

const getStatusColor = (status: string) => {
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

const getPriorityColor = (priority: string) => {
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

const TimelineItem = React.memo<TimelineItemProps>(({ step, title, date, isCompleted, isLast }: any) => (
    <View className="flex-row items-start">
        {/* Timeline Circle and Line */}
        <View className="items-center mr-4">
            <View
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'timing', duration: 500, delay: step * 200 }}
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isCompleted
                    ? 'bg-[#EBB22F] border-[#EBB22F]'
                    : 'bg-white border-gray-300'
                    }`}
            >
                {isCompleted && (
                    <View
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'timing', duration: 300, delay: step * 200 + 200 }}
                    >
                        <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                )}
            </View>

            {/* Vertical Line */}
            {!isLast && (
                <View
                    from={{ height: 0 }}
                    animate={{ height: 60 }}
                    transition={{ type: 'timing', duration: 400, delay: step * 200 + 100 }}
                    className={`w-0.5 mt-1 ${isCompleted ? 'bg-[#EBB22F]' : 'bg-gray-300'
                        }`}
                />
            )}
        </View>

        {/* Timeline Content */}
        <View
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
        </View>
    </View>
));


const viewDetailsTicket = () => {
    const params = useLocalSearchParams<{ ticketId: string }>();
    const [ticketData, setTicketData] = useState<TicketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTicketDetails = useCallback(async () => {
        try {
            const ticketId = params.ticketId;
            if (!ticketId) {
                setError("No ticket ID provided");
                return;
            }

            const response = await apiRequest(`/customer/outlets/tickets/${ticketId}`, {
                method: 'GET'
            });

            if (response.ticket) {
                setTicketData(response.ticket);
            } else {
                setError("Ticket not found");
            }
        } catch (err: any) {
            console.error('Error fetching ticket details:', err);
            setError(err.message || "Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    }, [params.ticketId]);

    useEffect(() => {
        fetchTicketDetails();
    }, [fetchTicketDetails]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                {/* <Text className="text-lg text-gray-500">Loading ticket details...</Text> */}
                <CustomNativeLoader />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <Text className="text-lg text-red-500">{error}</Text>
                <TouchableOpacity
                    className="mt-4 px-6 py-2 bg-[#EBB22F] rounded-lg"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!ticketData) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <Text className="text-lg text-gray-500">No ticket data available</Text>
            </SafeAreaView>
        );
    }





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
                <View
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
                                <Text className="text-sm text-gray-500 mb-1">Title</Text>
                                <Text className="text-base font-semibold text-gray-700">
                                    {ticketData.title}
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

                        {ticketData.resolutionNote && (
                            <View>
                                <Text className="text-sm text-gray-500 mb-2">Resolution Note</Text>
                                <Text className="text-base text-gray-700 leading-6">
                                    {ticketData.resolutionNote}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Timeline Section */}
                <View
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
                            <View
                                from={{ width: '0%' }}
                                animate={{ width: `${ticketData.progressPercentage}%` }}
                                transition={{ type: 'timing', duration: 1000, delay: 800 }}
                                className="h-2 bg-[#EBB22F] rounded-full"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default viewDetailsTicket;