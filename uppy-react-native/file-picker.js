/* eslint-disable */

import React from 'react'
import {
  StyleSheet,
  Modal,
  Text,
  View,
  ScrollView,
  Button,
  TouchableOpacity,
  Image } from 'react-native'

export default class App extends React.Component {
  constructor () {
    super()

    this.state = {
      providers: [
        { id: 'Local', name: 'Local' },
        { id: 'GoogleDrive', name: 'Google Drive' },
        { id: 'Instagram', name: 'Instagram' }
      ],
      openProvider: null
    }
  }

  componentDidMount () {

  }

  openProvider (id) {
    console.log('OPEN PROVIDER:', id)
  }

  render () {
    if (this.state.openProvider) {
      return 'show provider'
    }

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={this.props.show}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
        }}>
        <ScrollView
          contentContainerStyle={{
            flex: '1',
            marginTop: 22,
            // alignItems: 'center',
            justifyContent: 'center'
          }}>
          {this.state.providers.map((item, index) => {
            return (
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  backgroundColor: '#DDDDDD',
                  marginBottom: 10,
                  padding: 10
                }}
                key={index}
                onPress={this.openProvider.bind(this, item.id)}>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </Modal>
    )
  }
}
