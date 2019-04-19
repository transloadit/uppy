import React from 'react'
import Url from './url'

// container wrapper for providers, only Url for now
export default class UppyRNProvider extends React.Component {
  render () {
    if (this.props.providerID === 'Url') {
      return <Url {...this.props} />
    }
    // return this.renderInstagram()
  }
}
