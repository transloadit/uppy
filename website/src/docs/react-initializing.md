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

With React Hooks, the `useRef` hook can be used to create an instance once and remember it for all rerenders. The `useEffect` hook can close the Uppy instance when the component unmounts.

```js
const MyComponent = () => {
  const uppy = useRef(null);
  if (uppy.current === null) {
    uppy.current = new Uppy()
      .use(Transloadit, {})
  }

  React.useEffect(() => {
    return () => uppy.current.close()
  }, [])

  return <DashboardModal uppy={uppy} />
}
```

With useRef you must call `current` to access the Uppy instance and its functions. useEffect must receive the `[]` dependency array parameter, or the Uppy instance will be destroyed every time the component rerenders. To make sure you never forget these requirements, a custom hook could be used:
```js
function useUppy(uppyInstance) {
  const uppy = React.useRef(uppyInstance)
  React.useEffect(() => {
    return () => uppy.current.close()
  }, [])
  return uppy.current
}

// Then use it as:
const uppy = useUppy(
  new Uppy()
    .use(Tus, {})
)
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
