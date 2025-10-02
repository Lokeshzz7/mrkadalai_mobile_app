import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const CustomNativeLoader = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    const dot4 = useRef(new Animated.Value(0)).current;
    const dot5 = useRef(new Animated.Value(0)).current;
    const dot6 = useRef(new Animated.Value(0)).current;
    const dot7 = useRef(new Animated.Value(0)).current;
    const dot8 = useRef(new Animated.Value(0)).current;
    const overlay = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot, delay) => {
            return Animated.timing(dot, {
                toValue: 1,
                duration: 300,
                delay: delay,
                useNativeDriver: true,
            });
        };

        const animateOverlay = () => {
            return Animated.timing(overlay, {
                toValue: 1,
                duration: 400,
                delay: 2400,
                useNativeDriver: true,
            });
        };

        const sequence = Animated.sequence([
            animateDot(dot1, 0),
            animateDot(dot2, 200),
            animateDot(dot3, 200),
            animateDot(dot4, 200),
            animateDot(dot5, 200),
            animateDot(dot6, 200),
            animateDot(dot7, 200),
            animateDot(dot8, 200),
            animateOverlay(),
        ]);

        const loop = Animated.loop(
            Animated.sequence([
                sequence,
                Animated.delay(200),
                Animated.parallel([
                    Animated.timing(dot1, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot2, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot3, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot4, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot5, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot6, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot7, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(dot8, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(overlay, { toValue: 0, duration: 0, useNativeDriver: true }),
                ]),
            ])
        );

        loop.start();

        return () => loop.stop();
    }, []);

    const getDotStyle = (animatedValue) => ({
        opacity: animatedValue,
        transform: [
            {
                scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                }),
            },
        ],
    });

    return (
        <View style={styles.container}>
            <View style={styles.loader}>
                {/* Striped background container */}
                <View style={styles.shakerBody}>
                    <View style={styles.stripedBackground} />

                    {/* Dots */}
                    <Animated.View style={[styles.dot, styles.dot1, getDotStyle(dot1)]} />
                    <Animated.View style={[styles.dot, styles.dot2, getDotStyle(dot2)]} />
                    <Animated.View style={[styles.dot, styles.dot3, getDotStyle(dot3)]} />
                    <Animated.View style={[styles.dot, styles.dot4, getDotStyle(dot4)]} />
                    <Animated.View style={[styles.dot, styles.dot5, getDotStyle(dot5)]} />
                    <Animated.View style={[styles.dot, styles.dot6, getDotStyle(dot6)]} />
                    <Animated.View style={[styles.dot, styles.dot7, getDotStyle(dot7)]} />
                    <Animated.View style={[styles.dot, styles.dot8, getDotStyle(dot8)]} />

                    {/* Overlay fade effect */}
                    <Animated.View
                        style={[
                            styles.overlay,
                            {
                                opacity: overlay,
                            }
                        ]}
                    />
                </View>

                {/* Cap at bottom */}
                <View style={styles.cap} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loader: {
        width: 45,
        height: 90,
        position: 'relative',
    },
    shakerBody: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 20,
        borderRadius: 15,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#91d2e2',
    },
    stripedBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#91d2e2',
        backgroundImage: 'repeating-linear-gradient(-45deg, #91d2e2 0, #91d2e2 8px, #1296a7 8px, #1296a7 20px)',
    },
    dot: {
        position: 'absolute',
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: '#000',
    },
    dot1: {
        top: -10,
        left: -10,
    },
    dot2: {
        top: -14,
        right: 5,
    },
    dot3: {
        top: -6,
        left: 9,
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    dot4: {
        top: 9,
        left: -12,
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    dot5: {
        top: 9,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    dot6: {
        bottom: 7,
        right: -8,
    },
    dot7: {
        bottom: -1,
        left: -8,
    },
    dot8: {
        top: 18,
        left: 10,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#91d2e2',
    },
    cap: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        marginLeft: -4,
        width: 8,
        height: 45,
        backgroundColor: '#e0a267',
        borderRadius: 50,
    },
});

export default CustomNativeLoader;