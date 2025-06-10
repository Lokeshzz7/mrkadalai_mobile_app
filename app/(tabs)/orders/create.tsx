import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import React from 'react'

const create = () => {
    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background">
            <Text className="text-3xl font-bold">Create a New Notes</Text>
        </SafeAreaView>
    )
}

export default create
