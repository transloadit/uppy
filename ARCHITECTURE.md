# Architecture

Uppy has a lean Core module and Plugins that extend its functionality. Here’s how its currently used:

``` javascript
import { Core, DragDrop, ProgressBar, Tus10 } from 'uppy'

const uppy = new Core({wait: false})
uppy
  .use(DragDrop, {target: '#drop-target'})
  .use(ProgressBar, {target: 'body'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()

uppy.on('core:success', (fileCount) => {
  console.log(`Upload complete. We uploaded ${fileCount} files!`)
})
```

## Core

Core module orchestrates everything in Uppy. Plugins are added to it via `.use(DragDrop, {target: 'body'})` API. Core instances plugins with `new Plugin(this, opts)`, passing options to them, then places them in `plugins` object, nested by plugin’s type: `uploader`, `progressindicator`, `acquirer`, etc.

Core then iterates over its internal `plugins` object and calls `install` on each plugin. In its `install`
method a plugin can extend global state with its state, or do anything needed on initialization.

Then, each time `state` is updated, Core runs `updateAll` that re-renders all of the plugins (components) that have been mounted in the dom somewhere, using the new state.

Core is very lean (at least should be), and acts as a glue that ties together all the plugins with shared data and functionality together. It keeps `state` with `files`, `capabilities` and UI stuff, plus exposes a few methods that can be used by plugins.

*Comment: There is a discussion that these methods could in theory all live in Utils or be standalone modules used by plugins and the user directly, see https://github.com/transloadit/uppy/issues/116#issuecomment-247695921.*

#### getState()

Returns current state.

#### setState({itemToUpdate: data})

Updates state with new state (Object.assign({}, this.state, newState)) and runs `updateAll()`.

#### updateAll()

Iterates over all `plugins` and runs `update` on each of them.

#### updateMeta(data, fileID)

Given `{size: 1200}` adds that metadata to a file.

#### addFile(file)

Adds a new file to `state`, method used by `acquirer` plugins like Drag & Drop and Google Drive,
or can be called by the user on uppy instance directly.

Normalizes that file: tries to figure out file type by extension if mime is missing, use noname if name is missing and so on.

#### removeFile(fileID)

Removes file from `state`.

#### addThumbnail(fileID)

Reads image from file’s data object in base64 and resizes that, using canvas. Then `state` is updated with a file that has thumbnail it it. Thumbnails are used for file previews by plugins like Dashboard.

#### state.capabilities

Core (or plugins) check and set capabilities, like: `resumable: true`, `touch: false`, `dragdrop: true` that could possibly be used by all plugins.

#### log(msg)

Logs stuff to console only if user specified `debug: true`, silent in production.

#### core.on('event', action), core.emit('event'), core.emitter

An event emitter embedded into Core that is passed to plugins and can be used directly on the instance. Event emitter is used for plugins to communicate with other plugins and Core.

For example:

- Core listens for `core:upload-progress` event and calculates speed and ETA for one file, that the event was about, and for all files currently in progress.
- Core checks if browser in offline or online and emits `core:is-offline` or `core:is-online` that other plugins can listen to.
- Any plugin can emit `informer` event that `Informer` plugin can use to display info bubbles. Currently only used in the Dashboard plugin. Example: `core.emitter.emit('informer', 'Connected!', 'success', 3000)`. (Should this be a Core method instead of plugin?).
- Uploader plugins listen to `core:upload` event (can be emitted after a file has been added or when upload button has been pressed), get files via `core.getState().files`, filter those that are not marked as complete and upload them, emitting progress events.

*See discussion about Core and Event Emitter: https://github.com/transloadit/uppy/issues/116#issuecomment-247695921*

## Plugins

Plugins extend the functionality of Core (which itself is very much barebones, does almost nothing).

Each plugin extends `Plugin` class with default methods that can be overwritten:

#### update()

Gets called when state is changes and `updateAll()` is called from Core. Checks if a DOM element (tree) has been created with a reference for it stored in plugin’s `this.el`. If so, crates a new element (tree) `const newEl = this.render(currentState)` on current plugin and then calls `yo.update(this.el, newEl)` to effectively update the existing element to match the new one (morphdom is behind that).

All together now:

``` javascript
const newEl = this.render(currentState)
yo.update(this.el, newEl)
```

#### mount(target, plugin)

Called by the plugin itself if it is a UI plugin that needs to do something in DOM. A `target` is passed as an argument, and then a plugin object itself. There are two possible scenarios for mounting:

1\. If `typeof target === string`, then the element (tree) is rendered and gets mounted to the DOM:

``` javascript
this.el = plugin.render(this.core.state)
document.querySelector(target).appendChild(this.el)
```

2\. If `typeof target === object`, then that plugin is found is plugins object of Core and `addTarget()` is called on that plugin.

``` javascript
const targetPlugin = this.core.getPlugin(targetPluginName)
const selectorTarget = targetPlugin.addTarget(plugin)
```

*This should probably be replaced: we should explicitly pass targets to the target plugin, like so: `.use(Dashboard, {children: [DragDrop, Webcam]})`*.

#### focus()

Called when plugin is in focus, like when that plugin’s tab is selected in the Dashboard.

#### install()

Called by Core when it instantiates new plugins. In `install`
a plugin can extend global state with its own state (like `modal: hidden`), or do anything needed on initialization, including `mount`.

### Plugins are currently of the following types:

#### acquirer

- **DragDrop** — simple DragDrop, once file is dropped on a target, it gets added to state.files. “click here to select” too
- **GoogleDrive** — GoogleDrive UI, uses uppy-server component. Files are downloaded from Google Drive to uppy-server, without having to go through the client, saving bandwidth and space
- **Formtag** — simple input[type=file] element
- **Webcam** — allows to take pictures with your webcam, works in most browsers, except Safari. Flash (ugh) is used for fallback

#### orchestrator

Should probably be called UI.

- **Dashboard** — the full-featured interface for interacting with Uppy. Supports drag & dropping files, provides UI for Google Drive, Webcam and any other plugin, shows selected files, shows progress on them.

#### progressindicator

- **ProgressBar** — tiny progressbar that can be mounted anywhere.

#### uploader

- **Tus10** — tus resumable file uploads, see http://tus.io
- **Multipart** — regular form/multipart/xhr uploads

#### modifier

- **Metadata** — allows adding custom metadata fields, data from each field is then added to a file

## Questions about the future

Things work the way they are. Not everything is optimal, though. We would like to improve our architecture and APIs to solve a few issues:

We want Uppy to work well with React and React Native (and other frameworks, like Angular, Ember, Vue, Choo). Currently state and view rendering are tied with Core and Plugins, which is a problem for React. There are few options:

A. The simplest is to go “Black Hole way” and just tell React users to wrap Uppy in a dumb component with `shouldComponentUpdate: false`, and give them no control, but that’s not a good way — they can’t alter anything, this is like a band-aid.

B. Leave things as they are, keep Core. Treat Uppy as an external uploading library, where you subscribe to events and manage React state yourself: `uppy.on('core:progress', updateMyReactState)`. Example: http://codepen.io/arturi/pen/yaZEzz/. So we only use logic parts of Uppy (see uppy-base https://github.com/hedgerh/uppy-base/tree/master/src) and re-create UI components, or optimize and abstract the ones we have, , perhaps by switching to JSX and even more env agnostic props. So that our UI like DragDrop, Dashboard and Google Drive views can be used in React.

Issues with that approach:

* That leaves state in Core (files are still added to it), and means state will be kept in multiple places — Uppy’s Core + Redux or React component’s internal state. Might lead to state getting out of sync — you removed file from Uppy `uppy.removeFile(fileID)`, but forgot to remove from your Redux state, or something like that.

* Some stuff from Core won’t be used in React, `updateAll` for example.

C. Another approach is to create a separate version of Uppy for React, uppy-react, not use Core in it, re-create Core in form of UppyContainer, manage state manually (allow for Redux, Mobx or whatever else someone is using), while re-using some parts of current Uppy. This has been explored here: https://github.com/hedgerh/uppy-react.

Also, Yo-Yo (Bel) has some issues:

  - local network requests from `<img src="">` are made on each state update
  - webcam currently flashes when state is updated (morphdom issue?)
  - When using template strings it might be harder to re-use UI components in React, where JSX is a standard

We are thinking about trying Preact for more stability and React compatibility, but not sure if it’s worth it.
