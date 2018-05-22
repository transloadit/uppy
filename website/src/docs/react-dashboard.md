---
title: "&lt;Dashboard />"
type: docs
permalink: docs/react/dashboard/
order: 54
---

The `<Dashboard />` component wraps the [Dashboard][] plugin. It only renders the Dashboard inline. To use the Dashboard modal (`inline: false`), use the [`<DashboardModal />`](/docs/react/dashboard-modal) component.

```js
import Dashboard from 'uppy/lib/react/Dashboard';
```

## Props

The `<Dashboard />` component supports all [Dashboard][] options as props.

The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins like [Webcam][]. To use other plugins like [Webcam][] with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

```js
// Do this wherever you initialize Uppy, eg. in a React component's constructor method.
// Do NOT do it in `render()` or any other method that is called more than once!
uppy.use(Webcam) // `id` defaults to "Webcam"
uppy.use(Webcam, { id: 'MyWebcam' }) // `id` is… "MyWebcam"
```

Then in `render()` do:

```js
<Dashboard
  plugins={['Webcam']}
  {...props}
/>
```

[Dashboard]: /docs/dashboard/
[Webcam]: /docs/webcam/
