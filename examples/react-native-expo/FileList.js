import React from 'react' // eslint-disable-line no-unused-vars
import { StyleSheet, View, FlatList, Text, Image } from 'react-native'

export default function FileList (props) {
  const uppyFiles = props.uppy.state.files
  const uppyFilesArray = Object.keys(uppyFiles).map((id) => uppyFiles[id])

  return (
    // <ScrollView style={styles.container}>
    //   {Object.keys(uppyFiles).map((id, index) => {
    //     return <View style={styles.item} key={index}>
    //       {uppyFiles[id].type === 'image'
    //         ? <Image
    //           style={{ width: 100, height: 100, borderRadius: 5, marginBottom: 5 }}
    //           source={{ uri: uppyFiles[id].data.uri }} />
    //         : null
    //       }
    //       <Text style={styles.itemName}>{uppyFiles[id].name}</Text>
    //       <Text style={styles.itemType}>{uppyFiles[id].type}</Text>
    //     </View>
    //   })}
    // </ScrollView>

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
                : null
              }
              <Text style={styles.itemName}>{item.name}</Text>
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
