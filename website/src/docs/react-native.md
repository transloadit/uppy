---
title: "React Native"
type: docs
module: "@uppy/react-native"
permalink: docs/react/native/
order: 8
category: "React"
---

⚠️ In Beta

`@uppy/react-native` is a basic Uppy component for React Native with Expo. This plugin is still in development, and is not fully featured. You can select local images or videos, take pictures with a camera or add any files from [remote urls](/docs/url) with the help of a server-side component, [Uppy Companion](/docs/companion).

Make sure to check out the example in [examples/react-native-expo](https://github.com/transloadit/uppy/tree/master/examples/react-native-expo).

<img width="400" src="/images/2019-04-11-react-native-ui-1.png">

## Installation

Install from NPM:

```shell
npm install @uppy/react-native
```

```js
import React from 'react'
import UppyFilePicker from '@uppy/react-native'

export default function MyComponent (props) {
  return (
    <UppyFilePicker
      uppy={props.uppy}
      show={props.isFilePickerVisible}
      onRequestClose={props.hideFilePicker}
      companionUrl="https://server.uppy.io"
    />
  )
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
