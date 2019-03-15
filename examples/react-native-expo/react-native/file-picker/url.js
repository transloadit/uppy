import React from 'react'

import {
  StyleSheet,
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
    const uppy = this.props.uppy
    const options = Object.assign(
      { id: 'uppyRN:Url' },
      this.props,
      { }
    )
    delete options.uppy

    uppy.use(Url, options)
    this.plugin = uppy.getPlugin(options.id)
  }

  componentWillUnmount () {
    const uppy = this.props.uppy
    uppy.removePlugin(this.plugin)
  }

  onPressImport () {
    this.plugin.addFile(this.state.url)
      .then(this.props.onSuccess)
      .catch((err) => {
        console.log(err)
      })
  }

  render () {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          autoFocus
          onChangeText={(text) => this.setState({
            url: text
          })}
          placeholder="Enter URL to import a file"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={this.onPressImport}>
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
        <Text>{this.state.text}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    width: '90%',
    height: 40,
    borderColor: '#7f8a93',
    borderWidth: 1,
    padding: 5,
    borderRadius: 4,
    marginBottom: 15
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2275d7',
    paddingHorizontal: 15,
    paddingVertical: 8
  },
  buttonText: {
    color: '#fff'
  }
})
