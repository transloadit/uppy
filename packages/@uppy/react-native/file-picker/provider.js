import React from 'react'
import Url from './url.js'

// container wrapper for providers, only Url for now
export default class UppyRNProvider extends React.Component {
  render () {
    if (this.props.providerID === 'Url') {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Url {...this.props} />
    }
    // return this.renderInstagram()
    return undefined
  }
}
