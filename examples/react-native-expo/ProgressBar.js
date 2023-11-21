import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const colorGreen = '#0b8600'
const colorBlue = '#006bb7'

export default function ProgressBar ({ progress }) {
  return (
    <View style={styles.root}>
      <View
        style={styles.wrapper}
      >
        <View style={[styles.bar, {
          backgroundColor: progress === 100 ? colorGreen : colorBlue,
          width: `${progress}%`,
        }]}
        />
      </View>
      <Text>{progress ? `${progress}%` : null}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginTop: 15,
    marginBottom: 15,
  },
  wrapper:{
    height: 5,
    overflow: 'hidden',
    backgroundColor: '#dee1e3',
  },
  bar: {
    height: 5,
  },
})
