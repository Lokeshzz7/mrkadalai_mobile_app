import { View, Text, ImageBackground } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { images } from '@/constants/images'
import { Image } from 'react-native';
import { icons } from '@/constants/icons';
import Colors from '@/constants/theme/colors';

const TabIcon = ({ focused, icon, title }: any) => {
    if (focused) {
        return (
            <ImageBackground
                className='flex flex-row w-full flex-1 min-w-[80px] min-h-[52px] mt-3 justify-center items-center overflow-hidden bg-button_color '
            >
                <Image
                    source={icon} tintColor={Colors.secondary}
                    className="size-7"
                />

            </ImageBackground>
        )

    }

    return (
        <View className='size-full justify-center items-center mt-3'>

            <Image source={icon}
                tintColor={Colors.light[200]}
                className="size-7" />
        </View>
    )

}

const _layout = () => {
    return (
        <Tabs
            screenOptions={{

                tabBarShowLabel: false,
                tabBarItemStyle: {
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center'
                },
                tabBarStyle: {
                    backgroundColor: Colors.dark[200],
                    height: 52,
                    position: 'absolute',
                    overflow: 'hidden',
                    borderColor: Colors.light[200],
                }
            }}
        >

            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }: any) => (
                        <TabIcon
                            focused={focused}
                            icon={icons.home}
                            title="Home"
                        />
                    )
                }}

            />

            {/* Notes Screen */}
            <Tabs.Screen
                name='orders'
                options={{

                    title: 'Notes',
                    headerShown: false,
                    tabBarIcon: ({ focused }: any) => (
                        <TabIcon
                            focused={focused}
                            icon={icons.notes}
                            title="Notes"
                        />
                    )
                }}

            />

            {/* Calendar Screen */}
            <Tabs.Screen
                name='wallet'
                options={{

                    title: 'Calendar',
                    headerShown: false,
                    tabBarIcon: ({ focused }: any) => (
                        <TabIcon
                            focused={focused}
                            icon={icons.calendar}
                            title="Search"
                        />
                    )
                }}

            />

            {/* Profile Screen */}
            <Tabs.Screen
                name='profile'
                options={{

                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ focused }: any) => (
                        <TabIcon
                            focused={focused}
                            icon={icons.person}
                            title="Profile"
                        />
                    )
                }}
            />

        </Tabs>
    )
}

export default _layout