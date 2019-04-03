import React from 'react' // eslint-disable-line no-unused-vars
import { Text, TouchableHighlight } from 'react-native'

export default function SelectFiles (props) {
  return (
    <TouchableHighlight
      onPress={props.showFilePicker}
      style={{
        backgroundColor: '#006bb7',
        padding: 15
      }}>
      <Text
        style={{
          color: '#fff',
          textAlign: 'center',
          fontSize: 17
        }}>Select files</Text>
    </TouchableHighlight>
  )
}
