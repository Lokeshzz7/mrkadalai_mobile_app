import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View } from 'react-native';
import { FlatList, Pressable, Text, Dimensions } from 'react-native';

import Timeline from './Timeline';

const ITEM_WIDTH = 55;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 9;
const HORIZONTAL_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDaysInMonth = (month: number, year: number) => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= totalDays; i++) {
        const date = new Date(year, month, i);
        days.push({
            fullDate: formatDate(date),
            dateObj: date,
            isToday: formatDate(date) === formatDate(new Date()),
        });
    }
    return days;
};

const DaysOfMonth = ({ mode, selectedMonth, selectedYear, selectedDate, setSelectedDate }: any) => {
    const [days, setDays] = useState(getDaysInMonth(selectedMonth, selectedYear));
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const updatedDays = getDaysInMonth(selectedMonth, selectedYear);
        setDays(updatedDays);
        const todayIndex = updatedDays.findIndex(d => d.isToday);
        if (todayIndex >= 0) {
            setSelectedDate(updatedDays[todayIndex].fullDate);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: todayIndex,
                    animated: true,
                    viewPosition: 0.5,
                });
            }, 100);
        }
    }, [selectedMonth, selectedYear]);

    const handlePress = (item: any, index: number) => {
        setSelectedDate(item.fullDate);
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
        });
    };

    return (

        <View className='flex-1' >

            <View>
                <FlatList
                    ref={flatListRef}
                    data={days}
                    keyExtractor={(item) => item.fullDate}
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
                    renderItem={({ item, index }) => {
                        const dayName = item.dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                        });
                        const dayNumber = item.dateObj.getDate();
                        const isSelected = item.fullDate === selectedDate;
                        const isToday = item.isToday;

                        return (
                            <Pressable
                                onPress={() => handlePress(item, index)}
                                className={` w-[55px] m-[9px] p-2 items-center justify-center border-b-2 ${isSelected ? 'border-blue-600' : 'border-transparent'}`}
                            >
                                <Text
                                    className={`
                text-lg font-bold 
                ${isSelected ? 'text-blue-600' : isToday ? 'text-purple-600' : 'text-gray-800'}`}
                                >
                                    {dayName}
                                </Text>
                                <Text
                                    className={`text-lg font-bold ${isSelected ? 'text-blue-600' : isToday ? 'text-purple-600' : 'text-gray-800'}`}
                                >
                                    {dayNumber}
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

export default DaysOfMonth;
