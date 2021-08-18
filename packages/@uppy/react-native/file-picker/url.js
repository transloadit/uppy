import React from 'react'

import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  View,
} from 'react-native'
import Url from '@uppy/url'

export default class UppyRNUrl extends React.Component {
  constructor () {
    super()

    this.state = {
      url: null,
    }

    this.onPressImport = this.onPressImport.bind(this)
  }

  componentDidMount () {
    const { uppy } = this.props
    const options = {
      id: 'uppyRN:Url',
      ...this.props,

    }
    delete options.uppy

    uppy.use(Url, options)
    this.plugin = uppy.getPlugin(options.id)
  }

  componentWillUnmount () {
    const { uppy } = this.props
    uppy.removePlugin(this.plugin)
  }

  onPressImport () {
    this.plugin.addFile(this.state.url)
      .then(this.props.onDone)
      .catch((err) => {
        // eslint-disable-next-line no-console
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
            url: text,
          })}
          placeholder="Enter URL to import a file"
        />
        <TouchableOpacity
          style={styles.buttonImport}
          onPress={this.onPressImport}
        >
          <Text style={styles.buttonImportText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonCancel}
          onPress={ev => this.props.onDone()}
        >
          <Text style={styles.buttonCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '90%',
    height: 40,
    borderColor: '#7f8a93',
    borderWidth: 1,
    padding: 5,
    borderRadius: 4,
    marginBottom: 15,
  },
  buttonImport: {
    alignItems: 'center',
    backgroundColor: '#2275d7',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonCancel: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  buttonImportText: {
    color: '#fff',
  },
  buttonCancelText: {
    color: '#0077cc',
  },
})
