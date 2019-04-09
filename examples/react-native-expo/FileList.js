import React from 'react' // eslint-disable-line no-unused-vars
import { StyleSheet, View, FlatList, Text, Image } from 'react-native'

function truncateString (str) {
  const maxChars = 20
  if (str.length > maxChars) {
    return str.substring(0, 25) + '...'
  }
}

function FileIcon () {
  return <View style={styles.itemIconContainer}>
    <Image
      style={styles.itemIcon}
      source={require('./assets/file-icon.png')}
    />
  </View>
}

export default function FileList (props) {
  const uppyFiles = props.uppy.state.files
  const uppyFilesArray = Object.keys(uppyFiles).map((id) => uppyFiles[id])

  return (
    <View style={styles.container}>
      <FlatList
        data={uppyFilesArray}
        keyExtractor={(item, index) => item.id}
        numColumns={2}
        renderItem={({item}) => {
          return (
            <View style={styles.item}>
              {item.type === 'image'
                ? <Image
                  style={styles.itemImage}
                  source={{ uri: item.data.uri }} />
                : <FileIcon />
              }
              <Text style={styles.itemName}>{truncateString(item.name)}</Text>
              <Text style={styles.itemType}>{item.type}</Text>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
    flex: 1,
    justifyContent: 'center'
  },
  item: {
    width: 100,
    marginTop: 5,
    marginBottom: 5,
    marginRight: 15
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 5
  },
  itemIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: '#cfd3d6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemIcon: {
    width: 42,
    height: 56
  },
  itemName: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600'
  },
  itemType: {
    fontWeight: '600',
    fontSize: 12,
    color: '#95a5a6'
  }
})
