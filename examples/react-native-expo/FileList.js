import React from 'react' // eslint-disable-line no-unused-vars
import { StyleSheet, View, Text, Image } from 'react-native'

export default function FileList (props) {
  const uppyFiles = props.uppy.state.files

  return (
    <View style={styles.container}>
      {Object.keys(uppyFiles).map((id, index) => {
        return <View style={styles.item} key={index}>
          <Image
            style={{ width: 100, height: 100, borderRadius: 5, marginBottom: 5 }}
            source={{ uri: uppyFiles[id].data.uri }} />
          <Text style={styles.itemName}>{uppyFiles[id].name}</Text>
          <Text style={styles.itemType}>{uppyFiles[id].type}</Text>
        </View>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20
  },
  item: {
    width: 150,
    height: 150,
    marginTop: 5,
    marginBottom: 5
  },
  itemName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600'
  },
  itemType: {
    fontWeight: '600',
    fontSize: 12,
    color: '#95a5a6'
  }
})
