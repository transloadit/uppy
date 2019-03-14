import React from 'react'

import {
  // StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  View } from 'react-native'
import Url from '@uppy/url'

export default class UppyRNUrl extends React.Component {
  constructor () {
    super()

    this.state = {
      url: null
    }

    this.onPressImport = this.onPressImport.bind(this)
  }

  componentDidMount () {
    this.uppy = this.props.uppy
    this.uppy.use(Url, {
      id: 'uppyRN:Url',
      serverUrl: 'http://localhost:3020'
    })
    this.plugin = this.uppy.getPlugin('uppyRN:Url')
  }

  componentWillUnmount () {
    this.uppy.removePlugin(this.plugin)
  }

  onPressImport () {
    this.plugin.addFile(this.state.url)
      .then(() => {
        console.log('success')
      })
      .catch((err) => {
        console.log(err)
      })
  }

  render () {
    return (
      <View style={{
        flex: '1',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <TextInput
          style={{
            width: '90%',
            height: 40,
            borderColor: '#7f8a93',
            borderWidth: 1,
            padding: 5,
            marginBottom: 15
          }}
          onChangeText={(text) => this.setState({
            url: text
          })}
          placeholder="Enter URL to import a file"
        />
        <TouchableOpacity
          style={{
            alignItems: 'center',
            backgroundColor: '#2275d7',
            paddingHorizontal: 15,
            paddingVertical: 8
          }}
          onPress={this.onPressImport}>
          <Text style={{ color: '#fff' }}>Import</Text>
        </TouchableOpacity>
        <Text>{this.state.text}</Text>
      </View>
    )
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
