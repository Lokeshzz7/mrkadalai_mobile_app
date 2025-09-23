import React, { useCallback, useState } from "react";
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, Image,
    ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { apiRequest } from "../../utils/api";
import Toast from "react-native-toast-message";

interface IssueType {
    id: number;
    label: string;
    value: string;
    priority: string;
}

interface UploadedImage {
    uri: string;
    width: number;
    height: number;
    type: string;
    fileName?: string;
}

interface RadioButtonProps {
    selected: boolean;
    onPress: () => void;
    label: string;
}

const issueTypes = [
    { id: 1, label: "Account Issues", value: "account", priority: "MEDIUM" },
    { id: 2, label: "Payment Problems", value: "payment", priority: "HIGH" },
    { id: 3, label: "Order Issues", value: "order", priority: "HIGH" },
    { id: 4, label: "Technical Support", value: "technical", priority: "MEDIUM" },
    { id: 5, label: "Others", value: "others", priority: "LOW" }
];

const RadioButton = React.memo(({ selected, onPress, label }: RadioButtonProps) => (
    <TouchableOpacity
        className="flex-row items-center mb-4"
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${selected ? 'border-[#EBB22F]' : 'border-gray-300'}`}>
            {selected && (
                <View className="w-3 h-3 rounded-full bg-[#EBB22F]" />
            )}
        </View>
        <Text className={`text-base ${selected ? 'text-[#EBB22F] font-semibold' : 'text-gray-700'}`}>
            {label}
        </Text>
    </TouchableOpacity>
));

const raiseTicket = () => {
    const [selectedIssue, setSelectedIssue] = useState("");
    const [customIssue, setCustomIssue] = useState("");
    const [description, setDescription] = useState("");
    const [uploadedImage, setUploadedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageUpload = useCallback(async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Toast.show({
                    type: 'error',
                    text1: 'Permission Required',
                    text2: 'Permission to access camera roll is required!',
                    position: 'top',
                    visibilityTime: 4000,
                    autoHide: true,
                    onPress: () => Toast.hide(),
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setUploadedImage(result.assets[0]);
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to pick image',
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        // Validation
        if (!selectedIssue) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select an issue type',
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return;
        }

        if (selectedIssue === "others" && !customIssue.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please specify your issue',
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return;
        }

        if (!description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please provide a detailed description',
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const selectedIssueData = issueTypes.find(issue => issue.value === selectedIssue);
            const issueTypeLabel = selectedIssue === "others"
                ? customIssue.trim()
                : selectedIssueData?.label;

            const title = issueTypeLabel; // Use issue type as title
            const priority = selectedIssue === "others" ? "LOW" : selectedIssueData?.priority;

            const ticketData = {
                title: title,
                description: description.trim(),
                priority: priority,
                issueType: issueTypeLabel
            };

            const response = await apiRequest('/customer/outlets/tickets/create', {
                method: 'POST',
                body: ticketData
            });

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: "Your ticket has been submitted successfully! We'll get back to you soon.",
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onHide: () => {
                    router.push("/ticket/myTicket"); // Navigate after toast disappears
                },
            });

        } catch (error: any) {
            console.error('Error creating ticket:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to submit ticket. Please try again.',
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                onPress: () => Toast.hide(),
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedIssue, customIssue, description]);

    const handleIssueSelect = useCallback((issueValue: string) => {
        setSelectedIssue(issueValue);
        if (issueValue !== "others") {
            setCustomIssue("");
        }
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity className="p-2" onPress={() => router.back()}>
                    <Text className="text-2xl text-gray-700">←</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">Raise a Ticket</Text>

                <TouchableOpacity className="p-1" onPress={() => router.push("/ticket/myTicket")}>
                    <Text className="text-sm text-[#EBB22F] font-semibold">My Tickets</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-4 py-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled" // Improves TextInput interaction
            >
                {/* Issue Type Selection */}
                <View
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    className="bg-white rounded-xl p-5 mb-6 shadow-sm"
                >
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        Select Issue Type
                    </Text>

                    {issueTypes.map((issue) => (
                        <RadioButton
                            key={issue.id}
                            selected={selectedIssue === issue.value}
                            onPress={() => handleIssueSelect(issue.value)}
                            label={issue.label}
                        />
                    ))}

                    {/* Custom Issue Input for "Others" */}
                    {selectedIssue === "others" && (
                        <View
                            from={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ type: 'timing', duration: 300 }}
                            className="mt-2"
                        >
                            <TextInput
                                className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 bg-gray-50"
                                placeholder="Please specify your issue"
                                placeholderTextColor="#9CA3AF"
                                value={customIssue}
                                onChangeText={setCustomIssue}
                                multiline={false}
                            />
                        </View>
                    )}
                </View>

                {/* Description */}
                <View
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 100 }}
                    className="bg-white rounded-xl p-5 mb-6 shadow-sm"
                >
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        Detailed Description
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 bg-gray-50 min-h-[120px]"
                        placeholder="Please provide detailed information about your issue..."
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        textAlignVertical="top"
                    />
                </View>

                {/* Image Upload */}
                <View
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 200 }}
                    className="bg-white rounded-xl p-5 mb-6 shadow-sm"
                >
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        Attach Image (Optional)
                    </Text>

                    <TouchableOpacity
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center justify-center bg-gray-50"
                        onPress={handleImageUpload}
                        activeOpacity={0.7}
                    >
                        {uploadedImage ? (
                            <View className="items-center">
                                <Image
                                    source={{ uri: uploadedImage.uri }}
                                    className="w-32 h-32 rounded-lg mb-3"
                                    resizeMode="cover"
                                />
                                <Text className="text-green-600 font-semibold">Image Uploaded</Text>
                                <Text className="text-gray-500 text-sm mt-1">Tap to change</Text>
                            </View>
                        ) : (
                            <View className="items-center">
                                <Text className="text-4xl text-gray-400 mb-2">📷</Text>
                                <Text className="text-[#EBB22F] font-semibold text-base">Upload Image</Text>
                                <Text className="text-gray-500 text-sm mt-1">Tap to select from gallery</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <View
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 300 }}
                    className="mb-8"
                >
                    <TouchableOpacity
                        className={`bg-[#EBB22F] rounded-xl py-4 px-6 items-center justify-center shadow-lg ${isSubmitting ? 'opacity-70' : ''}`}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <View className="flex-row items-center">
                                <Text className="text-white text-lg font-bold mr-2">Submitting...</Text>
                                <ActivityIndicator color="white" />
                            </View>
                        ) : (
                            <Text className="text-white text-lg font-bold">Submit Ticket</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default raiseTicket;