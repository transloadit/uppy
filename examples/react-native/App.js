/* eslint-disable */

import React from 'react'
import {
  Text,
  View,
  Button,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  Image } from 'react-native'
// import FilePicker from './file-picker.js'
import testUploadFileWithTus from './tus-test.js'
import ImagePicker from 'react-native-image-picker'

export default class App extends React.Component {
  constructor () {
    super()

    this.state = {
      progress: 0,
      total: 0,
      file: null,
      isFilePickerVisible: false
    }

    this.isReactNative = (typeof navigator !== 'undefined' && 
      typeof navigator.product === 'string' && 
      navigator.product.toLowerCase() === 'reactnative')

    this.startUpload = this.startUpload.bind(this)
    this.selectPhotoTapped = this.selectPhotoTapped.bind(this)
    this.addFile = this.addFile.bind(this)
    this.showFilePicker = this.showFilePicker.bind(this)
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

  componentDidMount () {
    console.log('is this React Native?', this.isReactNative)
    // this.createAndUploadTextFileWithTus()
    // this.uppy = Uppy({ autoProceed: false, debug: true })
    // this.uppy.use(XHRUpload, {
    //   // endpoint: 'http://192.168.1.7:7000/',
    //   endpoint: 'http://api2.transloadit.com/',
    // })
    // // this.uppy.use(Tus, { endpoint: 'https://master.tus.io/files/' })
    // this.uppy.on('upload-progress', (file, progress) => {
    //   this.setState({
    //     progress: progress.bytesUploaded,
    //     total: progress.bytesTotal
    //   })
    // })
    // this.uppy.on('complete', (ev) => {
    //   this.setState({
    //     status: 'Upload complete ✅'
    //   })
    //   console.log('tadada!')
    //   console.log(this.uppy.state.files)
    // })
  }

  addFile (file) {
    console.log(file)
    var photo = {
      uri: file.uri,
      type: file.type,
      name: 'photo.jpg',
    }

    this.setState({
      status: 'Uploading...'
    })

    testUploadFileWithTus(photo)
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

    // this.uppy.addFile({
    //   source: 'React Native',
    //   name: 'photo.jpg',
    //   type: file.type,
    //   data: photo
    // })
  }

  selectPhotoTapped () {
    console.log('Selecting photo...')

    // Permissions.askAsync(Permissions.CAMERA_ROLL).then((isAllowed) => {
    //   if (!isAllowed) return

    //   ImagePicker.launchImageLibraryAsync({
    //     mediaTypes: 'All'
    //   })
    //     .then((result) => {
    //       console.log(result)
    //       if (!result.cancelled) {
    //         this.setState({ file: result })
    //         this.addFile(result)
    //       }
    //     })
    // })

    ImagePicker.showImagePicker({}, (response) => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = { 
          uri: response.uri 
        }

        // You can also display the image using data:
        // const source = { uri: 'data:image/jpeg;base64,' + response.data };

        this.setState({
          file: source,
        })
  
        this.addFile(source)
      }
    });
  }

  startUpload () {
    this.setState({
      status: 'Uploading...'
    })
    // this.uppy.upload()
  }

  showFilePicker (visible) {
    this.setState({
      isFilePickerVisible: visible
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
        {/* <FilePicker show={this.state.isFilePickerVisible} /> */}
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

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center'
//   }
// })
