import React from 'react'
import Expo from 'expo'
import {
  // StyleSheet,
  Modal,
  Text,
  // View,
  ScrollView,
  // Button,
  // Image
  TouchableOpacity } from 'react-native'
import takePicture from './takePicture'
import selectImage from './selectImage'
import selectDocument from './selectDocument'
import Provider from './provider'
// import ProviderGrid from './provider-grid'

export default class UppyReactNativeFilePicker extends React.Component {
  constructor () {
    super()

    this.state = {
      providers: [
        { id: 'LocalImages', title: 'Pick Local Images/Videos' },
        { id: 'LocalDocuments', title: 'Pick Documents' },
        { id: 'LocalCamera', title: 'Take a Picture' },
        { id: 'Url', title: 'Url' },
        { id: 'GoogleDrive', title: 'Google Drive' },
        { id: 'Instagram', title: 'Instagram' }
      ],
      openProvider: null
    }

    this.takePicture = this.takePicture.bind(this)
    this.selectImage = this.selectImage.bind(this)
    this.selectDocument = this.selectDocument.bind(this)
  }

  componentDidMount () {
    this.uppy = this.props.uppy

    this.uppy.on('info-visible', () => {
      const info = this.uppy.getState().info
      console.log('uppy-info', info)
    })
  }

  takePicture () {
    takePicture().then((file) => {
      this.uppy.addFile({
        source: 'React Native',
        name: `media_${Date.now()}.jpg`,
        type: file.type,
        data: file
      })
      this.props.onRequestClose()
    })
  }

  selectImage () {
    selectImage().then((file) => {
      this.uppy.addFile({
        source: 'React Native',
        name: `media_${Date.now()}.jpg`,
        type: file.type,
        data: file
      })
      this.uppy.upload()
      this.props.onRequestClose()
    })
  }

  selectDocument () {
    selectDocument().then((file) => {
      this.uppy.addFile({
        source: 'React Native',
        name: `media_${Date.now()}.jpg`,
        type: file.type,
        data: file
      })
      this.props.onRequestClose()
    })
  }

  openProvider (id) {
    console.log('OPEN PROVIDER:', id)
    this.setState({
      openProvider: id
    })
  }

  chooseProvider (id) {
    console.log('PROVIDER SELECTED:', id)

    switch (id) {
      case 'LocalImages':
        this.selectImage()
        return
      case 'LocalDocuments':
        this.selectDocument()
        return
      case 'LocalCamera':
        this.takePicture()
        return
      default:
        this.openProvider(id)
    }
  }

  renderSourceList () {
    return (
      <ScrollView
        contentContainerStyle={{
          flex: '1',
          marginTop: 22,
          justifyContent: 'center'
        }}>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            backgroundColor: '#c6e1f3',
            marginBottom: 10,
            padding: 10
          }}
          onPress={ev => this.props.onRequestClose()}>
          <Text>Close</Text>
        </TouchableOpacity>
        {this.state.providers.map((item, index) => {
          return (
            <TouchableOpacity
              style={{
                alignItems: 'center',
                backgroundColor: '#c6e1f3',
                marginBottom: 10,
                padding: 10
              }}
              key={index}
              onPress={ev => this.chooseProvider(item.id)}>
              <Text>{item.title}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    )
  }

  render () {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={this.props.show}
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => {
          Expo.Alert.alert('Modal has been closed.')
          this.props.onRequestClose()
        }}>
        {this.state.openProvider
          ? <Provider
            providerID={this.state.openProvider}
            uppy={this.uppy}
            onSuccess={() => {
              this.setState({
                openProvider: null
              })
              this.props.onRequestClose()
            }}
            {...this.props} />
          : this.renderSourceList()
        }
      </Modal>
    )
  }
}
