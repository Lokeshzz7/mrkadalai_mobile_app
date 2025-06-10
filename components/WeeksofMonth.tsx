import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { FlatList, Pressable, Text } from 'react-native';

import Timeline from './Timeline';

const ITEM_WIDTH = 70;
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get the first day of the month
const getFirstDayOfMonth = (month: number, year: number): string => {
    return formatDate(new Date(year, month, 1));
};

// Define Mode type based on the Timeline component's requirements
type Mode = 'Day' | 'Week' | 'Month';

interface WeeksofMonthProps {
    mode: Mode;
    selectedMonth: number; // Added this prop to match parent component
    selectedYear: number;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
}

const WeeksofMonth = ({ mode, selectedMonth: initialSelectedMonth, selectedYear, selectedDate, setSelectedDate }: WeeksofMonthProps) => {
    const [selectedMonth, setSelectedMonth] = useState<number>(initialSelectedMonth || new Date().getMonth());
    const flatListRef = useRef<FlatList<{ name: string; index: number }>>(null);

    useEffect(() => {
        // When the component loads or the year changes, select the current month
        const currentMonth = new Date().getMonth();
        setSelectedMonth(initialSelectedMonth !== undefined ? initialSelectedMonth : currentMonth);

        // Set the selected date to the first day of the selected month
        const firstDayOfMonth = getFirstDayOfMonth(
            initialSelectedMonth !== undefined ? initialSelectedMonth : currentMonth,
            selectedYear
        );
        setSelectedDate(firstDayOfMonth);

        // Scroll to the current month
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: initialSelectedMonth !== undefined ? initialSelectedMonth : currentMonth,
                animated: true,
                viewPosition: 0.5,
            });
        }, 100);
    }, [selectedYear, initialSelectedMonth, setSelectedDate]);

    const handleMonthPress = (month: number) => {
        setSelectedMonth(month);
        const firstDayOfMonth = getFirstDayOfMonth(month, selectedYear);
        setSelectedDate(firstDayOfMonth);

        flatListRef.current?.scrollToIndex({
            index: month,
            animated: true,
            viewPosition: 0.5,
        });
    };

    return (
        <View className='flex-1'>
            <View>
                <FlatList
                    ref={flatListRef}
                    data={months.map((name, index) => ({ name, index }))}
                    keyExtractor={(item) => `month-${item.index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: HORIZONTAL_PADDING,
                    }}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({
                                index: info.index,
                                animated: true,
                                viewPosition: 0.5,
                            });
                        }, 300);
                    }}
                    renderItem={({ item }) => {
                        const isSelected = item.index === selectedMonth;
                        const isCurrentMonth = item.index === new Date().getMonth() && selectedYear === new Date().getFullYear();

                        return (
                            <Pressable
                                onPress={() => handleMonthPress(item.index)}
                                className={`w-[70px] m-[9px] p-2 items-center justify-center border-b-2 ${isSelected ? 'border-blue-600' : 'border-transparent'}`}
                            >
                                <Text
                                    className={`text-lg font-bold ${isSelected ? 'text-blue-600' : isCurrentMonth ? 'text-purple-600' : 'text-gray-800'}`}
                                >
                                    {item.name}
                                </Text>
                            </Pressable>
                        );
                    }}
                />
            </View>

            <View className="flex-1 mb-5">
                <Timeline mode={mode} selectedDate={selectedDate} />
            </View>
        </View>
    );
};

export default WeeksofMonth;