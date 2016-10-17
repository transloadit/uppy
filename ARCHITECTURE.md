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

Core module orchestrates everything in Uppy. Plugins are added to it via `.use(Plugin, opts)` API, like `.use(DragDrop, {target: 'body'})`. Core instantiates plugins with `new Plugin(this, opts)`, passing options to them, then places them in `plugins` object, nested by type: `uploader`, `progressindicator`, `acquirer`, etc.

Core then iterates over `plugins` object and calls `install` on each plugin. In its `install`
method a plugin can extend global state with its state, set event listeners to react to events happening in Uppy (upload progress, file has been removed), or do anything else needed on init.

Each time `state` is updated with `setState(stateAddition)`, Core runs `updateAll()` that re-renders all of the plugins (components) that have been mounted in the dom somewhere, using the new state.

Core is very lean (at least should be), and acts as a glue that ties together all the plugins, shared data and functionality together. It keeps `state` with `files`, `capabilities`, plus exposes a few methods that are called by plugins to update state — adding files, adding preview Thumbnails to images, updating progress for each file and total progress, etc.

*Comment: There is a discussion that these methods could in theory all live in Utils or be standalone modules used by plugins and the user directly, see https://github.com/transloadit/uppy/issues/116#issuecomment-247695921.*

#### getState()

Returns current state.

#### setState({itemToUpdate: data})

Updates state with new state (Object.assign({}, this.state, newState)) and then runs `updateAll()`.

#### updateAll()

Iterates over all `plugins` and runs `update()` on each of them.

#### updateMeta(data, fileID)

Given `{ size: 1200 }` adds that metadata to a file.

#### addFile(file)

Adds a new file to `state`. This method is used by `acquirer` plugins like Drag & Drop, Webcam and Google Drive,
or can be called by the user on uppy instance directly: `uppy.addFile(myFile)`.

Normalizes that file too: tries to figure out file type by extension if mime is missing, use noname if name is missing, sets progress: 0  and so on.

#### removeFile(fileID)

Removes file from `state`.

#### addThumbnail(fileID)

Reads image from file’s data object in base64 and resizes that, using canvas. Then `state` is updated with a file that has thumbnail in it. Thumbnails are used for file previews by plugins like Dashboard.

#### state.capabilities

Core (or plugins) check and set capabilities, like: `resumable: true` (this is set by Tus Plugin), `touch: false`, `dragdrop: true`, that could possibly be used by all plugins.

#### log(msg)

Logs stuff to console only if user specified `debug: true`, silent in production.

#### core.on('event', action), core.emit('event'), core.emitter

An event emitter embedded into Core that is passed to Plugins, and can be used directly on the instance. Used by Plugins for communicating with other Plugins and Core.

For example:

- Core listens for `core:upload-progress` event and calculates speed & ETA for all files currently in progress. *Uploader plugins could just call core.updateProgress().*
- Core checks if browser in offline or online and emits `core:is-offline` or `core:is-online` that other plugins can listen to.
- Any plugin can emit `informer` event that `Informer` plugin can use to display info bubbles. Currently only used in the Dashboard plugin. Example: `core.emitter.emit('informer', 'Connected!', 'success', 3000)`. (Should this be a Core method instead of Plugin?). *Could be replaced by core.inform(info) method that will just update state with info.*
- Uploader plugins listen to `core:upload` event (can be emitted after a file has been added or when upload button has been pressed), get files via `core.getState().files`, filter those that are not marked as complete and upload them, emitting progress events. *This could be replaced by core.upload() method that will loop through all `uploaders` and run `upload()` on them, or we could only allow one uploader.*

*Should most or all of the events from the above be replaced with method calls? Should event-emitter be used for internal communication or just for the user to hook on to, like `uppy.on(core:upload:complete, doStuff)`? Right now its both, same event-emitter serves as a communication bus inside Uppy + its exposed to the user outside. Inspiration for using it as a bus came from Substack’s example here https://github.com/substack/training/blob/3041b1e4e3908d4df1b26cf578c34cd4df8fe9b7/web-dev-whirlwind/example/arch/bus/actions.js, and somewhat from Redux and Choo’s send https://github.com/yoshuawuyts/choo/#views.*

*See discussion about Core and Event Emitter: https://github.com/transloadit/uppy/issues/116#issuecomment-247695921*

## Plugins

Plugins extend the functionality of Core (which itself is very much barebones, does almost nothing). Plugins actually do the work — select files, modify and upload them, and show the UI.

Plugins that have some UI can be mounted anywhere in the dom. With current design you can have a Drag & Drop area in `#dragdrop` and Progressbar in `body`. Plugins can also be mounted into other plugins that support that, like Dashboard.

Each plugin extends `Plugin` class with default methods that can be overridden:

#### update()

Gets called when state changes and `updateAll()` is called from Core. Checks if a DOM element (tree) has been created with a reference for it stored in plugin’s `this.el`. If so, creates a new element (tree) `const newEl = this.render(currentState)` for current plugin and then calls `yo.update(this.el, newEl)` to effectively update the existing element to match the new one (morphdom is behind that).

All together now:

``` javascript
const newEl = this.render(currentState)
yo.update(this.el, newEl)
```

#### mount(target, plugin)

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

*This should probably be replaced: we could explicitly pass targets to the target plugin, like so: `.use(Dashboard, {children: [DragDrop, Webcam]})`*.

#### focus()

Called when plugin is in focus, like when that plugin’s tab is selected in the Dashboard.

*We should also leverage onload/onunload or componentDidMount/componentWillUnmount*

#### install()

Called by Core when it instantiates new plugins. In `install`
a plugin can extend global state with its own state (like `{ modal: { isHidden: true } }`), or do anything needed on initialization, including `mount()`.

### Plugins are currently of the following types:

#### acquirer

- **DragDrop** — simple DragDrop, once file is dropped on a target, it gets added to state.files. “click here to select” too
- **GoogleDrive** — GoogleDrive UI, uses uppy-server component. Files are downloaded from Google Drive to uppy-server, without having to go through the client, saving bandwidth and space
- **Formtag** — simple input[type=file] element
- **Webcam** — allows to take pictures with your webcam, works in most browsers, except Safari. Flash (ugh) is used for fallback

#### orchestrator

*Should probably be called UI.*

- **Dashboard** — the full-featured interface for interacting with Uppy. Supports drag & dropping files, provides UI for Google Drive, Webcam and any other plugin, shows selected files, shows progress on them.

#### progressindicator

- **ProgressBar** — tiny progressbar that can be mounted anywhere.

#### uploader

- **Tus10** — tus resumable file uploads, see http://tus.io
- **Multipart** — regular form/multipart/xhr uploads

#### modifier

- **Metadata** — allows adding custom metadata fields, data from each field is then added to a file

---

## Questions about the future

Things work the way they are. Not everything is optimal, though. We would like to improve our architecture and APIs to solve a few issues:

We want Uppy to work well with React and React Native (and other frameworks, like Angular, Ember, Vue, Choo). Currently state and view rendering are all tied together in Core and Plugins, which is a problem for React or other libs that handle views. There are few options:

A. The simplest is to go the “Black Hole way” and just tell React users to wrap Uppy in a dumb component with `shouldComponentUpdate: false`, and give them no control, but that’s not a good way — they can’t alter anything or use time travel, this feels like a band-aid solution.

B. Leave things as they are, keep Core. Treat Uppy as an external uploading library, where you subscribe to events and manage React (or other) state yourself: `uppy.on('core:progress', updateMyReactState)`. Simple example: http://codepen.io/arturi/pen/yaZEzz/. Maybe come up with some state-sync solution that will update Redux state in your app, when Uppy’s internal state is updated. Then we only use logic parts of Uppy (see uppy-base https://github.com/hedgerh/uppy-base/tree/master/src) and re-create UI components for each environment. Or optimize and abstract the ones we have, perhaps by switching to JSX and even more environment agnostic props. Then our UI plugins/views like DragDrop, Dashboard and Google Drive can be used in React.

Issues with this approach:

* It leaves state in Core (files are still added to it, progress gets updated, previews generated — all inside), and that means state will be kept in multiple places — Uppy’s Core + Redux or React component’s internal state. Might lead to state getting out of sync — if you removed file from Uppy `uppy.removeFile(fileID)`, but forgot to remove it from your Redux state, or something like that. *Unless we solve this by providing some subscription interface or a way to tell Uppy to use your Redux state somehow. A variant might be possible where state-handling is hot-swappable. We'd have a Redux compatible state machine inside Uppy by default, but React/Native users could inject an instance of their own Redux, making Uppy store & subscribe there, instead. This would prevent state syncing, there only ever would be one source of truth. It would by default live inside Uppy, but can live inside the developers app, to profit from debugging/extending/timetravel*

* Some stuff from Core won’t be used in React (or won’t be needed by all users), `updateAll()` for example, that is tied to current UI rendering implementation. *Might not be an issue if it’s just a few methods.*

Also, Yo-Yo (Bel) has some issues:

- Local network requests from `<img src="">` are made on each state update. Not a big deal, but annoying and does not happing with vdom solutions, like Preact.
- Webcam currently flashes when state is updated (morphdom issue?).
- When using template strings it might be harder to re-use UI components in React, where JSX is a standard.

We are thinking about trying Preact for more stability and React compatibility, but not sure if it’s worth it.


## Harry's Proposal
---
My proposal for Uppy's architecture and API address two use cases separately:

1. Uppy when its used without React and state is managed internally

2. Uppy when it's used with React, and the user manages their own state (or we provide a React container component that takes care of it for them.)  I'll refer to them as the "vanilla/yo-yo" and "React" use cases, respectively.

### Vanilla (using yo-yo) with managed state

So we have a problem. When we decouple rendering from Uppy, and a user is able to make their own custom UI, they'll need to be able to call on plugin methods to do things, like fetch a list of files from Google Drive, for example.  In our current setup, the core creates and holds an instance of every plugin, and outside UIs don't have direct access to these plugin instances.  To get around this, one idea we was to expose a bus/event emitter, and they could emit something like `bus.emit('google-drive:list-files', { directory: 'root' })` when they wanted to fetch a list of files.

I'm not a big fan of this.  The user becomes responsible for knowing the names of every single plugin event, which is prone to typos, and, in my opinion, it's a better pattern to be able to call functions directly to make these things happen vs. emitting events.

My current proposal is to use Redux, or at least take a Redux-like approach, and have each plugin define a reducer and some action creators as an interface.  The core combines each reducer into a single one and holds it, along with a Redux store.

Uppy would then pass down the Redux state, some core methods, and the dispatcher as "props" to the component, and the component would decide what to do with it all.

The user code would look something like:

```js
import Uppy, { Remote, Uploader } from 'uppy'
import DriveBrowser from 'uppy-ui'

const uppy = new Uppy(someOptions)
uppy.use(Remote, { source: 'drive' })
uppy.use(Uploader)

uppy.render(DriveBrowser, document.getElementById('root'))
```

The DriveBrowser component might look like:

```js
import { Remote } from 'uppy'
const googleDrive = new Remote({ source: 'drive' })
const { actions } = googleDrive

const DriveBrowser = (props) => {
  return html`
    <div>
      <button onclick=${props.dispatch(actions.list('root'))}>Get list of files</button>
      /* ... */
    </div>
  `
}
```

Here is an example of what the plugin itself may look like: https://github.com/transloadit/uppy/blob/master/src/experimental/plugins/Remote.js

Some things to note here:
1. `Remote` is a generic plugin to interface with any remote provider, like Google Drive, Dropbox, Instagram, etc.

2. Another one of the benefits to this approach is that we do away with all of the boilerplate methods that we currently have: `install`, `focus`, `update`, and `mount`.

3. The `Remote` plugin example linked above extends `Remote` from a module I created called `uppy-base`. I created `uppy-base` while trying to figure out how to make Uppy work with React.  I took the bare functionality of Uppy that could be used universally (vanilla, React, Angular, anywhere) and put it into its own module.  The `uppy-base` plugins are stateless and not concerned with the UI.  Here is the `Remote` plugin from `uppy-base`: https://github.com/hedgerh/uppy-base/blob/master/src/plugins/Remote.js

## React
I'd like to give React users the freedom to manage their own Uppy state, whether they use internal state, or a state management lib like Redux.  The proposed solution of syncing the user's state to Uppy's internal state via event listeners, ie. `uppy.on('file-added', (file) => this.props.dispatch({ type: 'ADD_FILE', payload: file }))` is problematic because it violates the "single source of truth" principal, in that our state exists in two separate locations.  If we add a file, then roll back the add file action with time-travel debugging, the file will be removed from Redux's state, but still present in Uppy's state, causing de-synchronization between the two.  We have discussed to get around this is allowing the user to pass their Redux store instance into Uppy.  I think this is a possible solution to the issue.

Another solution I've found, that is not as ideal, is to just use the `uppy-base` plugins directly in React, without Uppy's core, and have the user manage their own state.  Here is a comparison of core vs. no core: https://gist.github.com/hedgerh/9ad63f467ce816246044f3f9e83bd7e7

For ease of use, we'd write a React container/wrapper component that abstracted away all of that from the user.  I've started on something like that here (bear in mind it's a bit messy):  https://github.com/hedgerh/uppy-react/blob/master/src/containers/UppyContainer.js

and started on an example usage here: https://github.com/hedgerh/uppy-react/tree/master/examples/modal



