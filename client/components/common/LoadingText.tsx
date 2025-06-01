import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '@/context/ThemeContext'

const LoadingText = ({text}: {text: string}) => {
    const { colors } = useTheme();
  return (
    <View style={[styles.loadingInfo, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.hint }]}>
            {text}
          </Text>
        </View>
  )
}

export default LoadingText

const styles = StyleSheet.create({
    loadingInfo: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        margin: 10,
        borderRadius: 8,
      },
      loadingText: {
        fontSize: 12,
        marginLeft: 8,
      },
})