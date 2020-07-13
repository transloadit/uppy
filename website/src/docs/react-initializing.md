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

With React Hooks, the `useMemo` hook can be used to create an instance once and remember it for all rerenders. The `useEffect` hook can close the Uppy instance when the component unmounts.

```js
const MyComponent = () => {
  const uppy = React.useMemo(() => {
    // Do all the configuration here
    return Uppy()
      .use(Transloadit, {})
  }, []);

  React.useEffect(() => {
    return () => uppy.close()
  }, [])

  return <DashboardModal uppy={uppy} />
}
```

Both hooks must receive the `[]` dependency array parameter, or the Uppy instance will be recreated and/or destroyed every time the component rerenders. To make sure you never forget that, a custom hook could be used:
```js
function useUppy (factory) {
  const uppy = React.useMemo(factory, [])
  React.useEffect(() => {
    return () => uppy.close()
  }, [])
  return uppy
}

// Then use it as:
const uppy = useUppy(() => {
  return Uppy()
    .use(Tus, {})
})
```

## Class Components

A simple approach is to initialize it in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

> ⚠ Uppy instances are stateful, so the same instance must be used across different renders.
> Do **NOT** initialize Uppy in a `render()` method!

```js
class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.uppy = Uppy()
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
