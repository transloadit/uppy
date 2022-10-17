import React from 'react'
import {
  StyleSheet,
  Modal,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import takePicture from './takePicture.js'
import selectImage from './selectImage.js'
import selectDocument from './selectDocument.js'
import Provider from './provider.js'

const styles = StyleSheet.create({
  providerList: {
    flex: 1,
    marginTop: 22,
    justifyContent: 'center',
  },
  providerButton: {
    alignItems: 'center',
    backgroundColor: '#0077cc',
    marginBottom: 15,
    marginLeft: 50,
    marginRight: 50,
    padding: 10,
    borderRadius: 5,
  },
  providerButtonText: {
    color: '#fff',
  },
  cancelButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0077cc',
    marginBottom: 15,
    marginLeft: 50,
    marginRight: 50,
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#0077cc',
  },
})

export default class UppyReactNativeFilePicker extends React.Component {
  constructor () {
    super()

    this.state = {
      providers: [
        { id: 'LocalImages', title: 'Pick Local Images/Videos' },
        { id: 'LocalDocuments', title: 'Pick Documents' },
        { id: 'LocalCamera', title: 'Take a Picture' },
        { id: 'Url', title: 'Url' },
        // { id: 'GoogleDrive', title: 'Google Drive' },
        // { id: 'Instagram', title: 'Instagram' }
      ],
      openProvider: null,
    }

    this.takePicture = this.takePicture.bind(this)
    this.selectImage = this.selectImage.bind(this)
    this.selectDocument = this.selectDocument.bind(this)
  }

  componentDidMount () {
    this.uppy = this.props.uppy
  }

  takePicture () {
    takePicture().then((file) => {
      this.uppy.addFile({
        source: 'React Native',
        name: `media_${Date.now()}.jpg`,
        type: file.type,
        data: file,
      })
      this.props.onRequestClose()
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err)
    })
  }

  selectImage () {
    selectImage({ exif: true }).then((file) => {
      this.uppy.addFile({
        source: 'React Native',
        name: `media_${Date.now()}.jpg`,
        type: file.type,
        data: file,
      })
      this.props.onRequestClose()
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err)
    })
  }

  selectDocument () {
    selectDocument().then((file) => {
      this.uppy.addFile({
        source: 'React Native',
        name: file.name,
        data: file,
      })
      this.props.onRequestClose()
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err)
    })
  }

  openProvider (id) {
    this.setState({
      openProvider: id,
    })
  }

  chooseProvider (id) {
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
        contentContainerStyle={styles.providerList}
      >
        {this.state.providers.map((item) => {
          return (
            <TouchableOpacity
              style={styles.providerButton}
              key={item.title}
              onPress={() => this.chooseProvider(item.id)}
            >
              <Text style={styles.providerButtonText}>{item.title}</Text>
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => this.props.onRequestClose()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
        onRequestClose={this.props.onRequestClose}
      >
        {this.state.openProvider ? (
          <Provider
            providerID={this.state.openProvider}
            uppy={this.uppy}
            onDone={() => {
              this.setState({
                openProvider: null,
              })
              this.props.onRequestClose()
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...this.props}
          />
        ) : (
          this.renderSourceList()
        )}
      </Modal>
    )
  }
}
