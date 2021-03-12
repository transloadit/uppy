import React from 'react' // eslint-disable-line no-unused-vars
import { Text, TouchableHighlight, StyleSheet } from 'react-native'

export default function SelectFiles (props) {
  return (
    <TouchableHighlight
      onPress={props.showFilePicker}
      style={styles.button}
    >
      <Text style={styles.text}>Select files</Text>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#cc0077',
    padding: 15
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 17
  }
})
