import getFileTypeIcon from '@uppy/dashboard/lib/utils/getFileTypeIcon.js'
import renderStringFromJSX from 'preact-render-to-string'
import { FlatList, Image, StyleSheet, Text, View } from 'react-native'

const fileIcon = require('./assets/file-icon.png')

const truncateString = (str) => {
  const maxChars = 20
  if (str.length > maxChars) {
    return `${str.substring(0, 25)}...`
  }

  return str
}

function FileIcon() {
  return (
    <View style={styles.itemIconContainer}>
      <Image style={styles.itemIcon} source={fileIcon} />
    </View>
  )
}

function UppyDashboardFileIcon({ type }) {
  const icon = renderStringFromJSX(getFileTypeIcon(type).icon)
  if (!icon) {
    return <FileIcon />
  }
  const { color } = getFileTypeIcon(type)
  return (
    <View
      style={{
        ...styles.itemIconContainer,
        backgroundColor: color,
      }}
    >
      <Text style={styles.itemType}>logo</Text>
    </View>
  )
}

export default function FileList({ uppy }) {
  const uppyFiles = uppy.store.state.files
  const uppyFilesArray = Object.keys(uppyFiles).map((id) => uppyFiles[id])

  return (
    <View style={styles.container}>
      <FlatList
        data={uppyFilesArray}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => {
          return (
            <View style={styles.item}>
              {item.type === 'image'
                ? <Image
                    style={styles.itemImage}
                    source={{ uri: item.data.uri }}
                  />
                : <UppyDashboardFileIcon type={item.type} />}
              <Text style={styles.itemName}>
                {truncateString(item.name, 20)}
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -25,
  },
  item: {
    width: 100,
    marginTop: 5,
    marginBottom: 15,
    marginRight: 25,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 5,
  },
  itemIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: '#cfd3d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    width: 42,
    height: 56,
  },
  itemIconSVG: {
    width: 50,
    height: 50,
  },
  itemName: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
  itemType: {
    fontWeight: '600',
    fontSize: 12,
    color: '#95a5a6',
  },
})
