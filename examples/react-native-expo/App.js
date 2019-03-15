import * as Expo from 'expo'
import React from 'react'
import {
  Text,
  View,
  Button,
  TouchableOpacity,
  TouchableHighlight,
  Image,
  Linking } from 'react-native'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import UppyFilePicker from './react-native/file-picker'

export default class App extends React.Component {
  constructor () {
    super()

    this.state = {
      progress: 0,
      total: 0,
      file: null,
      uploadURL: null,
      isFilePickerVisible: false
    }

    this.isReactNative = (typeof navigator !== 'undefined' &&
      typeof navigator.product === 'string' &&
      navigator.product.toLowerCase() === 'reactnative')

    this.startUpload = this.startUpload.bind(this)
    this.selectPhotoTapped = this.selectPhotoTapped.bind(this)
    this.showFilePicker = this.showFilePicker.bind(this)
    this.hideFilePicker = this.hideFilePicker.bind(this)

    console.log('Is this React Native?', this.isReactNative)
    this.uppy = Uppy({ autoProceed: true, debug: true })
    this.uppy.use(Tus, { endpoint: 'https://master.tus.io/files/' })
    this.uppy.on('upload-progress', (file, progress) => {
      this.setState({
        progress: progress.bytesUploaded,
        total: progress.bytesTotal
      })
    })
    this.uppy.on('complete', (result) => {
      this.setState({
        status: 'Upload complete ✅',
        uploadURL: result.successful[0].uploadURL
      })
      console.log('Upload complete:')
      console.log(this.uppy.state.files)
    })
  }

  selectPhotoTapped () {
    console.log('Selecting photo...')

    Expo.Permissions.askAsync(Expo.Permissions.CAMERA_ROLL).then((isAllowed) => {
      if (!isAllowed) return

      Expo.ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'All'
      })
        .then((result) => {
          console.log(result)
          if (!result.cancelled) {
            this.setState({ file: result })
            this.addFile(result)
          }
        })
    })
  }

  startUpload () {
    this.setState({
      status: 'Uploading...'
    })
  }

  showFilePicker () {
    this.setState({
      isFilePickerVisible: true
    })
  }

  hideFilePicker () {
    this.setState({
      isFilePickerVisible: false
    })
  }

  render () {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <SelectAndUploadFileWithUppy
          state={this.state}
          selectPhotoTapped={this.selectPhotoTapped}
          showFilePicker={this.showFilePicker} />
        <UppyFilePicker
          show={this.state.isFilePickerVisible}
          uppy={this.uppy}
          onRequestClose={this.hideFilePicker}
          serverUrl="http://localhost:3020" />
      </View>
    )
  }
}

function SelectAndUploadFileWithUppy (props) {
  return (
    <View style={{
      flex: 1,
      paddingVertical: 100
    }}>
      <Text>Uppy running in React Native</Text>
      <TouchableOpacity onPress={props.selectPhotoTapped}>
        { props.state.file === null
          ? <Text>Select a Photo</Text>
          : <Image
            style={{ width: 200, height: 200 }}
            source={{ uri: props.state.file.uri }} />
        }
        { props.state.uploadURL !== null &&
          <Button
            onPress={(ev) => {
              Linking.openURL(props.state.uploadURL)
            }}
            title="Show Uploaded File"
            accessibilityLabel="Open uploaded file"
          />
        }
      </TouchableOpacity>
      <Text>Status: {props.state.status}</Text>
      <Text>{props.state.progress} of {props.state.total}</Text>
      <TouchableHighlight
        onPress={() => {
          props.showFilePicker(true)
        }}>
        <Text>Select files from Uppy</Text>
      </TouchableHighlight>
    </View>
  )
}
