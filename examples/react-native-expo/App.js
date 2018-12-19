import Expo from 'expo'
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
import XHRUpload from '@uppy/xhr-upload'
// import Tus from '@uppy/tus'
import UppyFilePicker from './react-native/file-picker'
import testUploadFileWithTus from './tus-test.js'

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
    this.addFile = this.addFile.bind(this)
    this.showFilePicker = this.showFilePicker.bind(this)
    this.hideFilePicker = this.hideFilePicker.bind(this)

    console.log('Is this React Native?', this.isReactNative)
    // this.createAndUploadTextFileWithTus()
    this.uppy = Uppy({ autoProceed: false, debug: true })
    this.uppy.use(XHRUpload, {
      // endpoint: 'http://192.168.1.7:7000/',
      endpoint: 'http://api2.transloadit.com/'
    })
    // this.uppy.use(Tus, { endpoint: 'https://master.tus.io/files/' })
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

  createAndUploadTextFileWithTus () {
    const string = 'Hello, how are you doing? ' + Date.now()
    Expo.FileSystem.writeAsStringAsync(Expo.FileSystem.documentDirectory + '/myfile.txt', string)
      .then(() => {
        const path = Expo.FileSystem.documentDirectory + '/myfile.txt'
        const file = {
          uri: path
        }
        testUploadFileWithTus(file)
          .then((url) => {
            this.setState({
              status: `Upload successful: ${url}`
            })
          })
          .catch((err) => {
            this.setState({
              status: `Error: ${err}`
            })
          })
      })
  }

  addFile (file) {
    console.log(file)
    var photo = {
      uri: file.uri,
      type: file.type,
      name: 'photo.jpg'
    }

    this.setState({
      status: 'Uploading...'
    })

    testUploadFileWithTus(photo)
      .then((url) => {
        this.setState({
          status: `Upload successful`,
          uploadUrl: url
        })
      })
      .catch((err) => {
        this.setState({
          status: `Error: ${err}`
        })
      })

    // this.uppy.addFile({
    //   source: 'React Native',
    //   name: 'photo.jpg',
    //   type: file.type,
    //   data: photo
    // })
  }

  selectPhotoTapped () {
    console.log('Selecting photo...')

    // Expo.DocumentPicker.getDocumentAsync({
    //   copyToCacheDirectory: false
    // })
    //   .then((result) => {
    //     console.log(result)
    //     if (!result.cancelled) {
    //       this.setState({ file: result })
    //       this.addFile(result)
    //     }
    //   })

    Permissions.askAsync(Permissions.CAMERA_ROLL).then((isAllowed) => {
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
          onRequestClose={this.hideFilePicker} />
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
      {/* <Button
        onPress={props.startUpload}
        title="Start Upload"
        color="#841584"
        accessibilityLabel="Start uploading a file"
      /> */}
      <TouchableHighlight
        onPress={() => {
          props.showFilePicker(true)
        }}>
        <Text>Select files from Uppy</Text>
      </TouchableHighlight>
    </View>
  )
}
