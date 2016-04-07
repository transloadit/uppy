---
type: api
order: 1
title: "Generated API Docs"
---

# Uppy Core & Plugins

## Core

[src/core/Core.js:10-353](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L10-L353 "Source code on GitHub")

Main Uppy core

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** general options, like locales, to show modal or not to show

### actions

[src/core/Core.js:94-208](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L94-L208 "Source code on GitHub")

Registeres listeners for all global actions, like:
`file-add`, `file-remove`, `upload-progress`, `reset`

### getPlugin

[src/core/Core.js:251-260](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L251-L260 "Source code on GitHub")

Find one Plugin by name

**Parameters**

-   `string`  name description
-   `name`  

### getState

[src/core/Core.js:85-87](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L85-L87 "Source code on GitHub")

Gets current state, making sure to make a copy of the state object and pass that,
instead of an actual reference to `this.state`

### iteratePlugins

[src/core/Core.js:267-271](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L267-L271 "Source code on GitHub")

Iterate through all `use`d plugins

**Parameters**

-   `function`  method description
-   `method`  

### log

[src/core/Core.js:278-288](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L278-L288 "Source code on GitHub")

Logs stuff to console, only if `debug` is set to true. Silent in production.

**Parameters**

-   `msg`  

Returns **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\|[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** to log

### resetState

[src/core/Core.js:65-67](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L65-L67 "Source code on GitHub")

Reset state to defaultState, used when Modal is closed, for example

### run

[src/core/Core.js:310-352](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L310-L352 "Source code on GitHub")

Runs a waterfall of runType plugin packs, like so:
All preseters(data) --> All acquirers(data) --> All uploaders(data) --> done

### runType

[src/core/Core.js:297-304](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L297-L304 "Source code on GitHub")

Runs all plugins of the same type in parallel

**Parameters**

-   `type` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** that wants to set progress
-   `method`  
-   `files` **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** of all methods

### setState

[src/core/Core.js:74-78](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L74-L78 "Source code on GitHub")

Updates state

**Parameters**

-   `object` **newState** 
-   `newState`  

### updateAll

[src/core/Core.js:53-59](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L53-L59 "Source code on GitHub")

Iterate on all plugins and run `update` on them. Called when state changes

### use

[src/core/Core.js:217-244](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Core.js#L217-L244 "Source code on GitHub")

Registers a plugin with Core

**Parameters**

-   `Plugin` **Class** object
-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** object that will be passed to Plugin later
-   `opts`  

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** self for chaining

## Utils

[src/core/Utils.js:16-23](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Utils.js#L16-L23 "Source code on GitHub")

A collection of small utility functions that help with dom manipulation, adding listeners,
promises and other good things.

**Parameters**

-   `methods`  

### addListenerMulti

[src/core/Utils.js:35-40](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Utils.js#L35-L40 "Source code on GitHub")

Adds multiple listeners to to a DOM element
Equvalent to jQuery’s `$form.on('drag dragstart dragend dragover dragenter dragleave drop')`.

**Parameters**

-   `el` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** selector
-   `events` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** to add, like `drag dragstart dragend dragover dragenter dragleave drop`
-   `cb` **requestCallback** 

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### promiseWaterfall

[src/core/Utils.js:16-23](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Utils.js#L16-L23 "Source code on GitHub")

Runs a waterfall of promises: calls each task, passing the result
from the previous one as an argument. The first task is run with an empty array.

**Parameters**

-   `methods` **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** of Promises to run waterfall on

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** of the final task

## DragDrop

[src/plugins/DragDrop.js:10-196](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/DragDrop.js#L10-L196 "Source code on GitHub")

Drag & Drop plugin

### checkDragDropSupport

[src/plugins/DragDrop.js:93-109](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/DragDrop.js#L93-L109 "Source code on GitHub")

Checks if the browser supports Drag & Drop,
not supported on mobile devices, for example.

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if supported, false otherwise

## Dummy

[src/plugins/Dummy.js:8-34](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Dummy.js#L8-L34 "Source code on GitHub")

Dummy

## flatten

[src/core/Utils.js:45-47](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Utils.js#L45-L47 "Source code on GitHub")

Shallow flatten nested arrays.

**Parameters**

-   `arr`  

## generateFileID

[src/core/Utils.js:63-68](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Utils.js#L63-L68 "Source code on GitHub")

Takes a fileName and turns it into fileID, by converting to lowercase,
removing extra characters and adding unix timestamp

**Parameters**

-   `fileName` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## Plugin

[src/plugins/Plugin.js:10-57](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Plugin.js#L10-L57 "Source code on GitHub")

Boilerplate that all Plugins share - and should not be used
directly. It also shows which methods final plugins should implement/override,
this deciding on structure.

**Parameters**

-   `main` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Uppy core object
-   `object` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with plugin options

Returns **([array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\|[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** files or success/fail message

### getTarget

[src/plugins/Plugin.js:27-39](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Plugin.js#L27-L39 "Source code on GitHub")

Check if supplied `target` is a `string` or an `object`.
If object (that means its a plugin), search `plugins` for
a plugin with same name and return its target.

**Parameters**

-   `target` **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\|[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** 
-   `callerPlugin`  
-   `el`  

## Translator

[src/core/Translator.js:14-69](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Translator.js#L14-L69 "Source code on GitHub")

Translates strings with interpolation & pluralization support.Extensible with custom dictionaries
and pluralization functions.

Borrows heavily from and inspired by Polyglot <https://github.com/airbnb/polyglot.js>,
basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
and can be easily added among with dictionaries, nested objects are used for pluralization
as opposed to `||||` delimeter

Usage example: `translator.translate('files_chosen', {smart_count: 3})`

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### interpolate

[src/core/Translator.js:31-52](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Translator.js#L31-L52 "Source code on GitHub")

Takes a string with placeholder variables like `%{smart_count} file selected`
and replaces it with values from options `{smart_count: 5}`

**Parameters**

-   `phrase` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** that needs interpolation, with placeholders
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with values that will be used to replace placeholders

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** interpolated

**Meta**

-   **license**: https&#x3A;//github.com/airbnb/polyglot.js/blob/master/LICENSE
    taken from https&#x3A;//github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299

### translate

[src/core/Translator.js:61-68](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Translator.js#L61-L68 "Source code on GitHub")

Public translate method

**Parameters**

-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with values that will be used later to replace placeholders in string

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** translated (and interpolated)

## Modal

[src/plugins/Modal.js:8-193](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Modal.js#L8-L193 "Source code on GitHub")

Modal

## Present

[src/plugins/Present.js:7-69](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Present.js#L7-L69 "Source code on GitHub")

Present

## ProgressBar

[src/plugins/ProgressBar.js:7-62](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/ProgressBar.js#L7-L62 "Source code on GitHub")

Progress bar

## qsa

[src/core/Utils.js:52-54](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/core/Utils.js#L52-L54 "Source code on GitHub")

`querySelectorAll` that returns a normal array instead of fileList

**Parameters**

-   `selector`  
-   `context`  

## Tus10

[src/plugins/Tus10.js:8-113](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Tus10.js#L8-L113 "Source code on GitHub")

Tus resumable file uploader

### run

[src/plugins/Tus10.js:87-112](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Tus10.js#L87-L112 "Source code on GitHub")

Add files to an array of `upload()` calles, passing the current and total file count numbers

**Parameters**

-   `results` **([Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\|[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** of parallel uploads `Promise.all(uploaders)`

### upload

[src/plugins/Tus10.js:28-60](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Tus10.js#L28-L60 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

## Spinner

[src/plugins/Spinner.js:7-52](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/Spinner.js#L7-L52 "Source code on GitHub")

Spinner

## then

[src/plugins/GoogleDrive.js:78-108](https://github.com/transloadit/uppy/blob/10b8d51e7c68252c0a6a59daced6e9a647954514/src/plugins/GoogleDrive.js#L78-L108 "Source code on GitHub")

Leave this here
