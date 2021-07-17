---
title: "Initializing Uppy"
type: docs
module: "@uppy/react"
permalink: docs/react/initializing/
alias: docs/react/initializing/
order: 1
category: "React"
---

When using Uppy's React components, an Uppy instance must be passed in to the `uppy={}` prop from the outside. This Uppy instance must be initialized before passing it to the desired component, and be cleaned up using `uppy.close()` when you are done with it.

## Functional Components

Functional components are re-run on every render. This makes it very easy to accidentally recreate a fresh Uppy instance every time, causing state to be reset and resources to be wasted.

The `@uppy/react` package provides a hook `useUppy()` that can manage an Uppy instance's lifetime for you. It will be created when your component is first rendered, and destroyed when your component unmounts.

```js
import Uppy from '@uppy/core'
import React from 'react'
import Tus from '@uppy/tus'
import { DashboardModal, useUppy } from '@uppy/react'

function MyComponent () {
  const uppy = useUppy(() => {
    return new Uppy()
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files' })
  })

  return <DashboardModal uppy={uppy} />
}
```

Importantly, the `useUppy()` hook takes a *function* that returns an Uppy instance. This way, the `useUppy()` hook can decide when to create it. Otherwise you would still be creating an unused Uppy instance on every render.

## Class Components

A simple approach is to create an Uppy instance in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

> ⚠ Uppy instances are stateful, so the same instance must be used across different renders.
> Do **NOT** initialize Uppy in a `render()` method!

```js
import React from 'react'
import { DashboardModal } from '@uppy/react'

class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.uppy = new Uppy()
      .use(Transloadit, {})
  }

  componentWillUnmount () {
    this.uppy.close()
  }

  render () {
    return <DashboardModal uppy={this.uppy} />
  }
}
```
