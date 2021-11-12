import React from 'react'
import {
  AsyncStorage,
  View,
  FlatList,
  Image,
  WebView,
} from 'react-native'
import Instagram from '@uppy/instagram'

function getQueryParamValueFromUrl (name, url) {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]')
  const regexS = `[\\?&]${name}=([^&#]*)`
  const regex = new RegExp(regexS)
  const results = regex.exec(url)
  return results == null ? null : results[1]
}

// how instagram provider can be render, not ready
export default class UppyRNInstagram extends React.Component {
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
          { caption: Date.now(), url: 'http://lorempixel.com/200/200/' },
        ],
      },
    }
  }

  componentDidMount () {
    const { uppy } = this.props
    const options = {
      id: 'uppyRN:Instagram',
      ...this.props,
      storage: AsyncStorage,
    }
    delete options.uppy
    uppy.use(Instagram, options)
    this.plugin = uppy.getPlugin(options.id)

    this.setState({
      authUrl: this.plugin.provider.authUrl(),
    })
  }

  componentWillUnmount () {
    const { uppy } = this.props
    uppy.removePlugin(this.plugin)
  }

  renderGrid (items) {
    return (
      <View style={styles.container}>
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <View style={{ flex: 1, flexDirection: 'column', margin: 1 }}>
              <Image style={styles.item} source={{ uri: item.url }} />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
        />
      </View>
    )
  }

  renderInstagram () {
    return (
      <WebView
        source={{ uri: this.state.authUrl }}
        style={{ marginTop: 20 }}
        onNavigationStateChange={(ev) => {
          const { url } = ev
          const token = getQueryParamValueFromUrl('uppyAuthToken', url)
          this.plugin.provider.setAuthToken(token)
          // return this.renderGrid(this.state.instagram.items)
        }}
      />
    )
  }

  render () {
    return this.renderInstagram()
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flex: 1,
    paddingTop: 30,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
})
