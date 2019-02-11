import React from 'react'
// import Expo from 'expo'
import {
  StyleSheet,
  FlatList,
  View,
  Image } from 'react-native'

export default class UppyReactNativeFilePicker extends React.Component {
  constructor () {
    super()

    this.state = {
      instagram: {
        user: 'bla@gmail.com',
        items: [
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/cats/1' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/cats/2' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/cats/3' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/cats/4' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/cats/5' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/' },
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/' }
        ]
      }
    }
  }

  renderGrid (items) {
    return (
      <View style={styles.container}>
        <FlatList
          data={items}
          renderItem={({item}) => (
            <View style={{ flex: 1, flexDirection: 'column', margin: 1 }}>
              <Image style={styles.item} source={{uri: item.url}} />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
        />
      </View>
    )
  }

  renderRow () {

  }

  render () {
    return this.renderGrid(this.state.instagram.items)
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flex: 1,
    paddingTop: 30
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100
  }
})
