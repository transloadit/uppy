import React from 'react' // eslint-disable-line no-unused-vars
import { StyleSheet, Text, TouchableHighlight } from 'react-native'

export default function PauseResumeButton (props) {
  if (!props.uploadStarted || props.uploadComplete) {
    return null
  }

  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={styles.button}>
      <Text
        style={styles.text}>{props.isPaused ? 'Resume' : 'Pause'}</Text>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#006bb7',
    padding: 10
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 17
  }
})
