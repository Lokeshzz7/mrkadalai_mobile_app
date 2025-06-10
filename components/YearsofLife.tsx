import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View } from 'react-native';
import { FlatList, Pressable, Text, Dimensions } from 'react-native';

import Timeline from './Timeline';



const YearsofLife = ({ mode, selectedMonth, selectedYear, selectedDate, setSelectedDate }: any) => {
    const flatListRef = useRef<FlatList>(null);

    return (

        <View className='flex-1' >

            <View className="flex-1 mb-5">
                <Timeline mode={mode} selectedDate={selectedDate} />
            </View>



        </View>
    );
};

export default YearsofLife;
