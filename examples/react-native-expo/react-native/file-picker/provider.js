import React from 'react'
// import Expo from 'expo'
import {
  // StyleSheet,
  // FlatList,
  // Image,
  // TouchableOpacity,
  // Text,
  // TextInput,
  // View,
  AsyncStorage,
  WebView } from 'react-native'
import Instagram from '@uppy/instagram'
import Url from './url'

function getQueryParamValueFromUrl (name, url) {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]')
  var regexS = '[\\?&]' + name + '=([^&#]*)'
  var regex = new RegExp(regexS)
  var results = regex.exec(url)
  return results == null ? null : results[1]
}

export default class UppyRNProvider extends React.Component {
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

  componentDidMount () {
    this.uppy = this.props.uppy
    this.uppy.use(Instagram, {
      serverUrl: 'http://localhost:3020',
      storage: AsyncStorage
    })
    this.plugin = this.uppy.getPlugin('Instagram')
    this.setState({
      authUrl: this.plugin.provider.authUrl()
    })
  }

  // renderGrid (items) {
  //   return (
  //     <View style={styles.container}>
  //       <FlatList
  //         data={items}
  //         renderItem={({item}) => (
  //           <View style={{ flex: 1, flexDirection: 'column', margin: 1 }}>
  //             <Image style={styles.item} source={{uri: item.url}} />
  //           </View>
  //         )}
  //         keyExtractor={(item, index) => index.toString()}
  //         numColumns={3}
  //       />
  //     </View>
  //   )
  // }

  renderInstagram () {
    console.log(this.state.authUrl)
    return <WebView
      source={{ uri: this.state.authUrl }}
      style={{ marginTop: 20 }}
      onNavigationStateChange={(ev) => {
        const url = ev.url
        const token = getQueryParamValueFromUrl('uppyAuthToken', url)
        console.log(token)
        this.plugin.provider.setAuthToken(token)
        console.log(this.plugin.provider.list('recent'))
        // return this.renderGrid(this.state.instagram.items)
      }}
    />
  }

  render () {
    if (this.props.id === 'Url') {
      return <Url uppy={this.props.uppy} />
    }

    return this.renderInstagram()
  }
}

// const styles = StyleSheet.create({
//   container: {
//     justifyContent: 'center',
//     flex: 1,
//     paddingTop: 30
//   },
//   item: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: 100
//   }
// })
