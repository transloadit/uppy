---
type: api
order: 0
title: "Architecture"
permalink: api/architecture
---

Uppy has a lean [Core](https://github.com/transloadit/uppy/blob/master/src/core/Core.js) module and [Plugins](https://github.com/transloadit/uppy/tree/master/src/plugins) (see simple [Input](https://github.com/transloadit/uppy/blob/master/src/plugins/Formtag.js) as an example) that extend its functionality. Here’s how it’s currently used:

{% include_code lang:js ../api-usage-example.ejs %}

## Core

Core module orchestrates everything in Uppy. Plugins are added to it via `.use(Plugin, opts)` API, like `.use(DragDrop, {target: 'body'})`. Core instantiates plugins with `new Plugin(this, opts)`, passing options to them, then places them in `plugins` object, nested by type: `uploader`, `progressindicator`, `acquirer`, etc.

Core then iterates over `plugins` object and calls `install` on each plugin. In its `install`
method a plugin can extend global state with its state, set event listeners to react to events happening in Uppy (upload progress, file has been removed), or do anything else needed on init.

Each time `state` is updated with `setState(stateAddition)`, Core runs `updateAll()` that re-renders all of the plugins (components) that have been mounted in the dom somewhere, using the new state.

Core is very lean (at least should be), and acts as a glue that ties together all the plugins, shared data and functionality together. It keeps `state` with `files`, `capabilities`, plus exposes a few methods that are called by plugins to update state — adding files, adding preview Thumbnails to images, updating progress for each file and total progress, etc.

*Comment: There is a discussion that these methods could in theory all live in Utils or be standalone modules used by plugins and the user directly, see https://github.com/transloadit/uppy/issues/116#issuecomment-247695921.*

### getState()

Returns current state.

### setState({itemToUpdate: data})

Updates state with new state (Object.assign({}, this.state, newState)) and then runs `updateAll()`.

### updateAll()

Iterates over all `plugins` and runs `update()` on each of them.

### updateMeta(data, fileID)

Given `{ size: 1200 }` adds that metadata to a file.

### addFile(file)

Adds a new file to `state`. This method is used by `acquirer` plugins like Drag & Drop, Webcam and Google Drive,
or can be called by the user on uppy instance directly: `uppy.addFile(myFile)`.

Normalizes that file too: tries to figure out file type by extension if mime is missing, use noname if name is missing, sets progress: 0  and so on.

### removeFile(fileID)

Removes file from `state.files`.

### addThumbnail(fileID)

Reads image from file’s data object in base64 and resizes that, using canvas. Then `state` is updated with a file that has thumbnail in it. Thumbnails are used for file previews by plugins like Dashboard.

### state.capabilities

Core (or plugins) check and set capabilities, like: `resumable: true` (this is set by Tus Plugin), `touch: false`, `dragdrop: true`, that could possibly be used by all plugins.

### log(msg)

Logs stuff to console only if user specified `debug: true`, silent in production.

### core.on('event', action), core.emit('event')

An event emitter embedded into Core that is passed to Plugins, and can be used directly on the instance. Used by Plugins for communicating with other Plugins and Core.

For example:

- Core listens for `core:upload-progress` event and calculates speed & ETA for all files currently in progress. *Uploader plugins could just call core.updateProgress().*
- Core checks if browser in offline or online and emits `core:is-offline` or `core:is-online` that other plugins can listen to.
- Any plugin can emit `informer` event that `Informer` plugin can use to display info bubbles. Currently only used in the Dashboard plugin. Example: `core.emitter.emit('informer', 'Connected!', 'success', 3000)`. *(Should this be a Core method instead of Plugin? Could be replaced by core.inform(info) method that will just update state with info)*
- Uploader plugins listen to `core:upload` event (can be emitted after a file has been added or when upload button has been pressed), get files via `core.getState().files`, filter those that are not marked as complete and upload them, emitting progress events.

*See discussion about Core and Event Emitter: https://github.com/transloadit/uppy/issues/116#issuecomment-247695921*

## Plugins

Plugins extend the functionality of Core (which itself is very much barebones, does almost nothing). Plugins actually do the work — select files, modify and upload them, and show the UI.

Plugins that have some UI can be mounted anywhere in the dom. With current design you can have a Drag & Drop area in `#dragdrop` and Progressbar in `body`. Plugins can also be mounted into other plugins that support that, like Dashboard.

Each plugin extends `Plugin` class with default methods that can be overridden:

### update()

Gets called when state changes and `updateAll()` is called from Core. Checks if a DOM element (tree) has been created with a reference for it stored in plugin’s `this.el`. If so, creates a new element (tree) `const newEl = this.render(currentState)` for current plugin and then calls `yo.update(this.el, newEl)` to effectively update the existing element to match the new one (morphdom is behind that).

All together now:

``` javascript
const newEl = this.render(currentState)
yo.update(this.el, newEl)
```

### mount(target, plugin)

Called by the plugin itself, if it is a UI plugin that needs to do something in DOM. A `target` is passed as an argument. There are two possible scenarios for mounting:

1\. If `typeof target === 'string'`, then the element (tree) is rendered and gets mounted to the DOM:

``` javascript
this.el = plugin.render(this.core.state)
document.querySelector(target).appendChild(this.el)
```

2\. If `typeof target === 'object'`, then that plugin is found in `plugins` object of Core and `addTarget()` is called on that plugin.

``` javascript
const targetPlugin = this.core.getPlugin(targetPluginName)
const selectorTarget = targetPlugin.addTarget(plugin)
```

### focus()

Called when plugin is in focus, like when that plugin’s tab is selected in the Dashboard.

### install()

Called by Core when it instantiates new plugins. In `install`
a plugin can extend global state with its own state (like `{ modal: { isHidden: true } }`), or do anything needed on initialization, including `mount()`.

### Plugins are currently of the following types:

### acquirer

- **DragDrop** — simple DragDrop, once file is dropped on a target, it gets added to state.files. “click here to select” too
- **GoogleDrive** — GoogleDrive UI, uses uppy-server component. Files are downloaded from Google Drive to uppy-server, without having to go through the client, saving bandwidth and space
- **Formtag** — simple input[type=file] element
- **Webcam** — allows to take pictures with your webcam, works in most browsers, except Safari. Flash (ugh) is used for fallback

### orchestrator

*Should probably be called UI*

- **Dashboard** — the full-featured interface for interacting with Uppy. Supports drag & dropping files, provides UI for Google Drive, Webcam and any other plugin, shows selected files, shows progress on them.

### progressindicator

- **ProgressBar** — tiny progressbar that can be mounted anywhere.

### uploader

- **Tus10** — tus resumable file uploads, see http://tus.io
- **Multipart** — regular form/multipart/xhr uploads

### modifier

- **Metadata** — allows adding custom metadata fields, data from each field is then added to a file
