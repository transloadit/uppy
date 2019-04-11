import React from 'react' // eslint-disable-line no-unused-vars
import { View, Text } from 'react-native'

export default function ProgressBar (props) {
  const progress = props.progress

  const colorGreen = '#0b8600'
  const colorBlue = '#006bb7'

  return (
    <View style={{
      marginTop: 15,
      marginBottom: 15
    }}>
      <View
        style={{
          height: 5,
          overflow: 'hidden',
          backgroundColor: '#dee1e3'
        }}>
        <View style={{
          height: 5,
          backgroundColor: progress === 100 ? colorGreen : colorBlue,
          width: progress + '%'
        }} />
      </View>
      <Text>{progress ? progress + '%' : null}</Text>
    </View>
  )
}
