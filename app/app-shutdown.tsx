import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppShutdown() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>App Temporarily Closed</Text>
            <Text style={styles.subtitle}>
                The app is currently unavailable. Please visit the shop to place your order.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center' },
});
