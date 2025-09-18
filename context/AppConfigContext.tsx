import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/utils/api';

type AppConfig = {
    APP: boolean;
    UPI: boolean;
    LIVE_COUNTER: boolean;
    COUPONS: boolean;
    loading: boolean;
};

type AppConfigContextType = {
    config: AppConfig;
    updateConfig: (newConfig: Partial<AppConfig>) => void;
};

export const AppConfigContext = createContext<AppConfigContextType>({
    config: { APP: true, UPI: false, LIVE_COUNTER: false, COUPONS: false, loading: true },
    updateConfig: () => { },
});

type Props = { children: ReactNode };

export const AppConfigProvider = ({ children }: Props) => {
    const [config, setConfig] = useState<AppConfig>({
        APP: true,
        UPI: false,
        LIVE_COUNTER: false,
        COUPONS: false,
        loading: true,
    });
    const [appState, setAppState] = useState(AppState.currentState);
    const router = useRouter();

    const fetchConfig = async () => {
        try {
            const outletId = await AsyncStorage.getItem('outletId');
            if (!outletId) return console.error('Outlet ID not found in storage.');

            const data = await apiRequest(`/superadmin/outlets/app-features/${outletId}`);
            if (data && data.data) {
                const configData = data.data;
                // console.log("CNfig data  : ", configData);

                const completeConfig = {
                    APP: configData.APP ?? false,
                    UPI: configData.UPI ?? false,
                    LIVE_COUNTER: configData.LIVE_COUNTER ?? false,
                    COUPONS: configData.COUPONS ?? false,
                };

                await AsyncStorage.setItem('appConfig', JSON.stringify(completeConfig));
                setConfig({ ...completeConfig, loading: false });

                if (!completeConfig.APP) router.replace('/app-shutdown');
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                fetchConfig();
            }
            setAppState(nextAppState);
        });
        return () => subscription.remove();
    }, [appState]);

    const updateConfig = async (newConfig: Partial<AppConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        await AsyncStorage.setItem('appConfig', JSON.stringify(updatedConfig));
        setConfig(updatedConfig);
        if (newConfig.APP === false) router.replace('/app-shutdown');
    };

    return (
        <AppConfigContext.Provider value={{ config, updateConfig }}>
            {children}
        </AppConfigContext.Provider>
    );
};
