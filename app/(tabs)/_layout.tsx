import React, { memo, ReactElement } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { CartProvider } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { AntDesign, MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons';
import CustomNativeLoader from '../../components/CustomNativeLoader';

interface TabIconProps {
    focused: boolean;
    icon: ReactElement;
}

const TabIcon = memo(({ focused, icon }: TabIconProps) => {
    return (
        <View
            style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? '#EBB22F20' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {React.cloneElement(icon, { color: focused ? '#EBB22F' : '#32343E', size: 28 })}
        </View>
    );
});

const TabsLayout = () => {
    const { user, isLoading } = useAuth();

    // Wait for auth check to finish
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#EBB22F" />
            </View>
        );
    }

    // If no user, force redirect to login
    if (!user) {
        return <Redirect href="/auth/login" />;
    }

    return (
        <CartProvider>
            <View style={{ flex: 1 }}>
                <Tabs
                    screenOptions={{
                        tabBarShowLabel: false,
                        lazy: true,
                        tabBarStyle: {
                            height: 70,
                            backgroundColor: '#ffffff',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -3 },
                            shadowOpacity: 0.05,
                            shadowRadius: 5,
                            elevation: 5,
                            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                            paddingTop: 10,
                        },
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            headerShown: false,
                            tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={<AntDesign name="home" size={28} />} />,
                        }}
                    />
                    <Tabs.Screen
                        name="orders"
                        options={{
                            headerShown: false,
                            tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={<MaterialIcons name="receipt-long" size={28} />} />,
                        }}
                    />
                    <Tabs.Screen
                        name="wallet"
                        options={{
                            headerShown: false,
                            tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={<Feather name="credit-card" size={28} />} />,
                        }}
                    />
                    <Tabs.Screen
                        name="cart"
                        options={{
                            headerShown: false,
                            tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={<AntDesign name="shoppingcart" size={28} />} />,
                        }}
                    />
                    <Tabs.Screen
                        name="profile"
                        options={{
                            headerShown: false,
                            tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={<FontAwesome name="user-circle" size={28} />} />,
                        }}
                    />
                </Tabs>
            </View>
        </CartProvider>
    );
};

export default TabsLayout;
