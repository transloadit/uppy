import React from 'react'
import { StyleSheet, Text, TouchableHighlight } from 'react-native'

export default function PauseResumeButton ({ uploadStarted, uploadComplete, isPaused, onPress }) {
  if (!uploadStarted || uploadComplete) {
    return null
  }

  return (
    <TouchableHighlight
      onPress={onPress}
      style={styles.button}
    >
      <Text
        style={styles.text}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </Text>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#cc0077',
    padding: 10,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 17,
  },
})
