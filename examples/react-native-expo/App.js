// import * as Expo from 'expo'
import React from 'react'
import {
  Text,
  View,
  AsyncStorage,
  // TouchableOpacity,
  TouchableHighlight
  // Image,
  // Linking
} from 'react-native'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import UppyFilePicker from './react-native/file-picker'

function hashCode (str) {
  var hash = 0
  if (str.length === 0) {
    return hash
  }
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

function customFingerprint (file, options) {
  console.log('_____________________')
  console.log('FILE:')
  console.log(file)
  console.log('_____________________')
  let exifHash = 'noexif'
  if (file.exif) {
    exifHash = hashCode(JSON.stringify(file.exif))
  }
  console.log(exifHash)
  const fingerprint = ['tus', file.name || 'noname', file.size || 'nosize', exifHash].join('/')
  console.log(fingerprint)
  return fingerprint
}

export default class App extends React.Component {
  constructor () {
    super()

    this.state = {
      progress: 0,
      total: 0,
      file: null,
      uploadURL: null,
      isFilePickerVisible: false,
      isPaused: false,
      uploadStarted: false,
      uploadComplete: false
    }

    this.isReactNative = (typeof navigator !== 'undefined' &&
      typeof navigator.product === 'string' &&
      navigator.product.toLowerCase() === 'reactnative')

    this.startUpload = this.startUpload.bind(this)
    // this.selectPhotoTapped = this.selectPhotoTapped.bind(this)
    this.showFilePicker = this.showFilePicker.bind(this)
    this.hideFilePicker = this.hideFilePicker.bind(this)
    this.togglePauseResume = this.togglePauseResume.bind(this)

    console.log('Is this React Native?', this.isReactNative)
    this.uppy = Uppy({ autoProceed: true, debug: true })
    this.uppy.use(Tus, {
      endpoint: 'https://master.tus.io/files/',
      urlStorage: AsyncStorage,
      fingerprint: customFingerprint
    })
    this.uppy.on('upload-progress', (file, progress) => {
      this.setState({
        progress: progress.bytesUploaded,
        total: progress.bytesTotal,
        uploadStarted: true
      })
    })
    this.uppy.on('upload-success', (file, response) => {
      console.log(file.name, response)
    })
    this.uppy.on('complete', (result) => {
      this.setState({
        status: 'Upload complete ✅',
        uploadURL: result.successful[0].uploadURL,
        uploadComplete: true,
        uploadStarted: false
      })
      // console.log('Upload complete:')
      // console.log(result)
    })
  }

  // selectPhotoTapped () {
  //   console.log('Selecting photo...')

  //   Expo.Permissions.askAsync(Expo.Permissions.CAMERA_ROLL).then((isAllowed) => {
  //     if (!isAllowed) return

  //     Expo.ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: 'All'
  //     })
  //       .then((result) => {
  //         console.log(result)
  //         if (!result.cancelled) {
  //           this.setState({ file: result })
  //           this.uppy.addFile({
  //             source: 'React Native',
  //             name: 'photo.jpg',
  //             type: result.type,
  //             data: result
  //           })
  //         }
  //       })
  //   })
  // }

  startUpload () {
    this.setState({
      status: 'Uploading...'
    })
  }

  showFilePicker () {
    this.setState({
      isFilePickerVisible: true,
      uploadStarted: false,
      uploadComplete: false
    })
  }

  hideFilePicker () {
    this.setState({
      isFilePickerVisible: false
    })
  }

  togglePauseResume () {
    if (this.state.isPaused) {
      this.uppy.resumeAll()
      this.setState({
        isPaused: false
      })
    } else {
      this.uppy.pauseAll()
      this.setState({
        isPaused: true
      })
    }
  }

  resumeAll () {
    this.uppy.resumeAll()
    this.setState({
      isPaused: false
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
          showFilePicker={this.showFilePicker}
          togglePauseResume={this.togglePauseResume} />
        <UppyFilePicker
          show={this.state.isFilePickerVisible}
          uppy={this.uppy}
          onRequestClose={this.hideFilePicker}
          serverUrl="http://localhost:3020" />
      </View>
    )
  }
}

function ProgressBar (props) {
  const progress = props.progress || 0
  const total = props.total || 0
  const percentage = Math.round(progress / total * 100)

  const colorGreen = '#0b8600'
  const colorBlue = '#006bb7'

  return (
    <View style={{
      marginTop: 15,
      marginBottom: 15
    }}>
      <View
        style={{
          height: 5,
          overflow: 'hidden',
          backgroundColor: '#dee1e3'
        }}>
        <View style={{
          height: 5,
          backgroundColor: percentage === 100 ? colorGreen : colorBlue,
          width: percentage + '%'
        }} />
      </View>
      <Text>{percentage ? percentage + '%' : null}</Text>
    </View>
  )
}

function PauseResumeButton (props) {
  if (!props.uploadStarted || props.uploadComplete) {
    return null
  }

  // return (
  //   <Button
  //     onPress={props.onPress}
  //     color="#bb00cc"
  //     title={props.isPaused ? 'Resume' : 'Pause'}
  //     accessibilityLabel={props.isPaused ? 'Resume' : 'Pause'}
  //   />
  // )

  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={{
        backgroundColor: '#006bb7',
        padding: 10
      }}>
      <Text
        style={{
          color: '#fff',
          textAlign: 'center',
          fontSize: 17
        }}>{props.isPaused ? 'Resume' : 'Pause'}</Text>
    </TouchableHighlight>
  )
}

function SelectFiles (props) {
  return (
    <TouchableHighlight
      onPress={props.showFilePicker}
      style={{
        backgroundColor: '#006bb7',
        padding: 15
      }}>
      <Text
        style={{
          color: '#fff',
          textAlign: 'center',
          fontSize: 17
        }}>Select files</Text>
    </TouchableHighlight>
  )
}

function SelectAndUploadFileWithUppy (props) {
  return (
    <View>
      <Text style={{
        fontSize: 25,
        marginBottom: 20
      }}>Uppy in React Native</Text>
      {/* <TouchableOpacity onPress={props.selectPhotoTapped}>
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
      </TouchableOpacity> */}
      <SelectFiles showFilePicker={props.showFilePicker} />
      <ProgressBar
        progress={props.state.progress}
        total={props.state.total}
      />
      <PauseResumeButton
        isPaused={props.state.isPaused}
        onPress={props.togglePauseResume}
        uploadStarted={props.state.uploadStarted}
        uploadComplete={props.state.uploadComplete} />
      <Text>{props.state.status ? 'Status: ' + props.state.status : null}</Text>
      <Text>{props.state.progress} of {props.state.total}</Text>
    </View>
  )
}
