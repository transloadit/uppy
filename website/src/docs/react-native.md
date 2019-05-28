---
title: "React Native"
type: docs
permalink: docs/react/native/
order: 7
category: 'React'
---

⚠️ In Beta

`@uppy/react-native` is a basic Uppy component for React Native with Expo. It is in Beta, and is not full-featured. You can select local images or videos, take pictures with a camera or add any files from [remote urls](/docs/url) with the help of a server-side component, [Uppy Companion](/docs/companion).

Make sure to check out the example in [examples/react-native-expo](https://github.com/transloadit/uppy/tree/master/examples/react-native-expo).

<img width="400" src="/images/2019-04-11-react-native-ui-1.png">

## Installation

Install from NPM:

```shell
npm install @uppy/react-native
```

```js
import UppyFilePicker from '@uppy/react-native'

render () {
  <UppyFilePicker
    uppy={this.uppy}
    show={this.state.isFilePickerVisible}
    onRequestClose={this.hideFilePicker}
    companionUrl="https://server.uppy.io" />
}
```

## Initializing Uppy

Your Uppy instance must be initialized before passing it to an `uppy={}` prop, and should be cleaned up using `uppy.close()` when you are done with it. A simple approach is to initialize it in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

> ⚠ Uppy instances are stateful, so the same instance must be used across different renders.
> Do **NOT** initialize Uppy in a `render()` method!
> Do **NOT** initialize Uppy in a function component!

```js
class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isFilePickerVisible: false
    }
    this.uppy = Uppy()
      .use(Transloadit, {})
  }

  componentWillUnmount () {
    this.uppy.close()
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
    return <UppyFilePicker
      show={this.state.isFilePickerVisible}
      uppy={this.uppy}
      onRequestClose={this.hideFilePicker}
      companionUrl="https://companion.uppy.io" />
  }
}
```

## Props

The `<UppyFilePicker>` component supports the following props:

### uppy

The uppy instance. Initialize in constructor, add all the nessesary plugins, set up event listeners, before passing as a prop.

### show

Boolean — the `<UppyFilePicker>` modal component will be rendered when set to `true`.

### onRequestClose

A callback that’s called when a file is picked or a “close” button is pressed. Use it to hide `<UppyFilePicker>`, like in the example above.

### companionUrl

[Uppy Companion](/docs/companion/) url.
