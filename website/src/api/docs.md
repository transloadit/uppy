---
type: api
order: 1
title: "Generated API Docs"
---

# Uppy Core & Plugins

## Core

[src/core/Core.js:9-98](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Core.js#L9-L98 "Source code on GitHub")

Main Uppy core

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** general options, like locales, to show modal or not to show

### run

[src/core/Core.js:82-97](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Core.js#L82-L97 "Source code on GitHub")

Runs a waterfall of runType plugin packs, like so:
All preseters(data) --> All acquirers(data) --> All uploaders(data) --> done

### runType

[src/core/Core.js:69-76](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Core.js#L69-L76 "Source code on GitHub")

Runs all plugins of the same type in parallel

**Parameters**

-   `type` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** that wants to set progress
-   `files` **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** of all methods

### setProgress

[src/core/Core.js:56-60](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Core.js#L56-L60 "Source code on GitHub")

Sets plugin’s progress, like for uploads

**Parameters**

-   `plugin` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** that wants to set progress
-   `percentage` **integer** 

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** self for chaining

### use

[src/core/Core.js:40-47](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Core.js#L40-L47 "Source code on GitHub")

Registers a plugin with Core

**Parameters**

-   `Plugin` **Class** object
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** object that will be passed to Plugin later
-   `opts`  

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** self for chaining

## Utils

[src/core/Utils.js:16-23](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Utils.js#L16-L23 "Source code on GitHub")

A collection of small utility functions that help with dom manipulation, adding listeners,
promises and other good things.

**Parameters**

-   `methods`  

### addClass

[src/core/Utils.js:58-64](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Utils.js#L58-L64 "Source code on GitHub")

Adds a class to a DOM element

**Parameters**

-   `el` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** selector
-   `className` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** to add

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### addListenerMulti

[src/core/Utils.js:95-100](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Utils.js#L95-L100 "Source code on GitHub")

Adds multiple listeners to to a DOM element
Equvalent to jQuery’s `$form.on('drag dragstart dragend dragover dragenter dragleave drop')`.

**Parameters**

-   `el` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** selector
-   `events` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** to add, like `drag dragstart dragend dragover dragenter dragleave drop`
-   `cb` **requestCallback** 

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### promiseWaterfall

[src/core/Utils.js:16-23](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Utils.js#L16-L23 "Source code on GitHub")

Runs a waterfall of promises: calls each task, passing the result
from the previous one as an argument. The first task is run with an empty array.

**Parameters**

-   `methods` **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** of Promises to run waterfall on

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** of the final task

### removeClass

[src/core/Utils.js:74-83](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Utils.js#L74-L83 "Source code on GitHub")

Removes a class to a DOM element

**Parameters**

-   `el` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** selector
-   `className` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** to remove

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### toggleClass

[src/core/Utils.js:34-48](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Utils.js#L34-L48 "Source code on GitHub")

Toggles a class on a DOM element
This is how we roll $('.element').toggleClass in a non-jQuery world

**Parameters**

-   `el` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** selector
-   `className` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** to toggle

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## Translator

[src/core/Translator.js:14-70](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Translator.js#L14-L70 "Source code on GitHub")

Translates strings with interpolation & pluralization support.Extensible with custom dictionaries
and pluralization functions.

Borrows heavily from and inspired by Polyglot <https://github.com/airbnb/polyglot>.js,
basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
and can be easily added among with dictionaries, nested objects are used for pluralization
as opposed to `||||` delimeter

Usage example: `translator.translate('files_chosen', {smart_count: 3})`

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### interpolate

[src/core/Translator.js:31-52](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Translator.js#L31-L52 "Source code on GitHub")

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

[src/core/Translator.js:61-69](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/core/Translator.js#L61-L69 "Source code on GitHub")

Public translate method

**Parameters**

-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with values that will be used later to replace placeholders in string

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** translated (and interpolated)

## Plugin

[src/plugins/Plugin.js:10-64](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/plugins/Plugin.js#L10-L64 "Source code on GitHub")

Boilerplate that all Plugins share - and should not be used
directly. It also shows which methods final plugins should implement/override,
this deciding on structure.

**Parameters**

-   `main` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Uppy core object
-   `object` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with plugin options

Returns **([array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\|[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** files or success/fail message

## DragDrop

[src/plugins/DragDrop.js:9-152](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/plugins/DragDrop.js#L9-L152 "Source code on GitHub")

Drag & Drop plugin

### checkDragDropSupport

[src/plugins/DragDrop.js:54-70](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/plugins/DragDrop.js#L54-L70 "Source code on GitHub")

Checks if the browser supports Drag & Drop

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if supported, false otherwise

## Tus10

[src/plugins/Tus10.js:8-74](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/plugins/Tus10.js#L8-L74 "Source code on GitHub")

Tus resumable file uploader

### run

[src/plugins/Tus10.js:20-42](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/plugins/Tus10.js#L20-L42 "Source code on GitHub")

Add files to an array of `upload()` calles, passing the current and total file count numbers

**Parameters**

-   `results` **([array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\|[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** of parallel uploads `Promise.all(uploaders)`

### upload

[src/plugins/Tus10.js:52-73](https://github.com/transloadit/uppy/blob/ec529a2c93080223d5334b1216569da967147da7/src/plugins/Tus10.js#L52-L73 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 
