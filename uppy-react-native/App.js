/* eslint-disable */

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  Image } from 'react-native'
import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'
import { ImagePicker, Permissions } from 'expo'
// import ImagePicker from 'react-native-image-picker'
// import Tus from '@uppy/tus'

function urlToBlob (url) {
  return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.onerror = reject
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          resolve(xhr.response)
        }
      };
      xhr.open('GET', url)
      xhr.responseType = 'blob' // convert type
      xhr.send()
  })
}

export default class App extends React.Component {
  constructor () {
    super()

    this.state = {
      progress: 0,
      total: 0,
      file: null
    }

    this.startUpload = this.startUpload.bind(this)
    this.selectPhotoTapped = this.selectPhotoTapped.bind(this)
    this.addFileToUppy = this.addFileToUppy.bind(this)
  }

  componentDidMount () {
    this.uppy = Uppy({ autoProceed: false, debug: true })
    this.uppy.use(XHRUpload, {
      endpoint: 'http://192.168.1.7:7000/',
    })
    // this.uppy.use(Tus, { endpoint: 'https://master.tus.io/files/' })
    this.uppy.on('upload-progress', (file, progress) => {
      this.setState({
        progress: progress.bytesUploaded,
        total: progress.bytesTotal
      })
    })
    this.uppy.on('complete', (ev) => {
      this.setState({
        status: 'Upload complete ✅'
      })
      console.log('tadada!')
      console.log(this.uppy.state.files)
    })
  }

  addFileToUppy (file) {
    console.log(file)
    var photo = {
      uri: file.uri,
      type: file.type,
      name: 'photo.jpg',
    }

    this.uppy.addFile({
      source: 'React Native',
      name: 'photo.jpg',
      type: file.type,
      data: photo
    })
  }

  // uploadFileDirecrly (file) {
  //     var photo = {
  //       uri: file.uri,
  //       type: file.type,
  //       name: 'photo.jpg',
  //     };

  //     var data = new FormData();
  //     data.append('photo', photo);

  //     // Create the config object for the POST
  //     // You typically have an OAuth2 token that you use for authentication
  //     const config = {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'multipart/form-data;'
  //       },
  //       body: data
  //     };

  //     fetch('http://192.168.1.7:7000/', config)
  //       .then(responseData => {
  //         // Log the response form the server
  //         // Here we get what we sent to Postman back
  //         console.log(responseData);
  //       })
  //       .catch(err => {
  //         console.log(err);
  //       });
  // }

  selectPhotoTapped () {
    console.log('SELECT PHOTO')

    Permissions.askAsync(Permissions.CAMERA_ROLL).then((isAllowed) => {
      if (!isAllowed) return

      ImagePicker.launchImageLibraryAsync({})
      .then((result) => {
        console.log(result)
        if (!result.cancelled) {
          this.setState({ file: result })
          // this.uploadFileDirecrly(result)
          this.addFileToUppy(result)
        }
      })
    })

    // ImagePicker.showImagePicker(options, (response) => {
    //   console.log('Response = ', response);

    //   if (response.didCancel) {
    //     console.log('User cancelled photo picker');
    //   }
    //   else if (response.error) {
    //     console.log('ImagePicker Error: ', response.error);
    //   }
    //   else if (response.customButton) {
    //     console.log('User tapped custom button: ', response.customButton);
    //   }
    //   else {
    //     let source = { uri: response.uri };

    //     // You can also display the image using data:
    //     // let source = { uri: 'data:image/jpeg;base64,' + response.data };

    //     this.setState({
    //       ImageSource: source
    //     });
    //   }
    // })
  }

  startUpload () {
    this.setState({
      status: 'Uploading...'
    })
    this.uppy.upload()
  }

  render () {
    return (
      <View style={styles.container}>
        <Text>Uppy running in React Native</Text>
        <TouchableOpacity onPress={this.selectPhotoTapped}>
          { this.state.file === null 
            ? <Text>Select a Photo</Text> 
            : <Image
                style={{ width: 200, height: 200 }}
                source={{ uri: this.state.file.uri }}
              />
          }
        </TouchableOpacity>
        <Text>Status: {this.state.status}</Text>
        <Text>{this.state.progress} of {this.state.total}</Text>
        <Button
          onPress={this.startUpload}
          title="Start Upload"
          color="#841584"
          accessibilityLabel="Start uploading a file"
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
