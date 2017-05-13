---
type: api
order: 1
title: "Generated API Docs"
---

# Uppy Core & Plugins

## Uppy

[src/core/Core.js:14-581](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L14-L581 "Source code on GitHub")

Main Uppy core

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** general options, like locales, to show modal or not to show

### updateAll

[src/core/Core.js:73-79](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L73-L79 "Source code on GitHub")

Iterate on all plugins and run `update` on them. Called each time state changes

**Parameters**

-   `state`  

### setState

[src/core/Core.js:86-92](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L86-L92 "Source code on GitHub")

Updates state

**Parameters**

-   `object` **newState** 
-   `stateUpdate`  

### getState

[src/core/Core.js:98-102](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L98-L102 "Source code on GitHub")

Returns current state

### actions

[src/core/Core.js:295-385](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L295-L385 "Source code on GitHub")

Registers listeners for all global actions, like:
`file-add`, `file-remove`, `upload-progress`, `reset`

### use

[src/core/Core.js:410-439](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L410-L439 "Source code on GitHub")

Registers a plugin with Core

**Parameters**

-   `Plugin` **Class** object
-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** object that will be passed to Plugin later
-   `opts`  

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** self for chaining

### getPlugin

[src/core/Core.js:446-456](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L446-L456 "Source code on GitHub")

Find one Plugin by name

**Parameters**

-   `string`  name description
-   `name`  

### iteratePlugins

[src/core/Core.js:463-467](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L463-L467 "Source code on GitHub")

Iterate through all `use`d plugins

**Parameters**

-   `function`  method description
-   `method`  

### removePlugin

[src/core/Core.js:474-485](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L474-L485 "Source code on GitHub")

Uninstall and remove a plugin.

**Parameters**

-   `instance` **[Plugin](#plugin)** The plugin instance to remove.

### close

[src/core/Core.js:490-498](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L490-L498 "Source code on GitHub")

Uninstall all plugins and close down this Uppy instance.

### log

[src/core/Core.js:505-520](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L505-L520 "Source code on GitHub")

Logs stuff to console, only if `debug` is set to true. Silent in production.

**Parameters**

-   `msg`  
-   `type`  

Returns **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** to log

### run

[src/core/Core.js:542-556](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Core.js#L542-L556 "Source code on GitHub")

Initializes actions, installs all plugins (by iterating on them and calling `install`), sets options

## Plugin

[src/plugins/Plugin.js:14-119](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Plugin.js#L14-L119 "Source code on GitHub")

Boilerplate that all Plugins share - and should not be used
directly. It also shows which methods final plugins should implement/override,
this deciding on structure.

**Parameters**

-   `main` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Uppy core object
-   `object` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with plugin options

Returns **([array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** files or success/fail message

### mount

[src/plugins/Plugin.js:70-100](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Plugin.js#L70-L100 "Source code on GitHub")

Check if supplied `target` is a DOM element or an `object`.
If it’s an object — target is a plugin, and we search `plugins`
for a plugin with same name and return its target.

**Parameters**

-   `target` **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** 
-   `plugin`  

## Utils

[src/plugins/Dashboard/index.js:15-463](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Dashboard/index.js#L15-L463 "Source code on GitHub")

**Extends Plugin**

Modal Dialog & Dashboard

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/core/Utils.js:14-16](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L14-L16 "Source code on GitHub")

A collection of small utility functions that help with dom manipulation, adding listeners,
promises and other good things.

**Parameters**

-   `arr`  

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/generic-provider-views/index.js:38-351](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L38-L351 "Source code on GitHub")

Class to easily generate generic views for plugins

This class expects the plugin using to have the following attributes

stateId {String} object key of which the plugin state is stored

This class also expects the plugin instance using it to have the following
accessor methods.
Each method takes the item whose property is to be accessed
as a param

isFolder

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** for if the item is a folder or not
getItemData

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** that is format ready for uppy upload/download
getItemIcon

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** html instance of the item's icon
getItemSubList

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** sub-items in the item. e.g a folder may contain sub-items
getItemName

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** display friendly name of the item
getMimeType

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** mime type of the item
getItemId

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** unique id of the item
getItemRequestPath

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** unique request path of the item when making calls to uppy server
getItemModifiedDate

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** or {String} date of when last the item was modified

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/plugins/Webcam/index.js:13-233](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L13-L233 "Source code on GitHub")

**Extends Plugin**

Webcam

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/uppy-base/src/plugins/Webcam.js:8-336](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L8-L336 "Source code on GitHub")

Webcam Plugin

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/plugins/Tus10.js:29-383](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L29-L383 "Source code on GitHub")

**Extends Plugin**

Tus resumable file uploader

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/plugins/Transloadit/index.js:8-241](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/index.js#L8-L241 "Source code on GitHub")

**Extends Plugin**

Upload files to Transloadit using Tus.

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/plugins/Transloadit/Client.js:4-57](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L4-L57 "Source code on GitHub")

A Barebones HTTP API client for Transloadit.

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Utils

[src/plugins/Transloadit/Socket.js:8-60](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Socket.js#L8-L60 "Source code on GitHub")

WebSocket status API client for Transloadit.

### constructor

[src/generic-provider-views/index.js:42-63](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L42-L63 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  

### updateState

[src/generic-provider-views/index.js:68-73](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L68-L73 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:227-232](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Webcam/index.js#L227-L232 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:80-111](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L80-L111 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:118-121](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L118-L121 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:152-166](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L152-L166 "Source code on GitHub")

Removes session token on client side.

### handleRowClick

[src/generic-provider-views/index.js:172-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/generic-provider-views/index.js#L172-L179 "Source code on GitHub")

Used to set active file/folder.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Active file/folder

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

### upload

[src/plugins/Tus10.js:114-187](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Tus10.js#L114-L187 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### createAssembly

[src/plugins/Transloadit/Client.js:15-46](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L15-L46 "Source code on GitHub")

Create a new assembly.

**Parameters**

-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.templateId`  
    -   `$0.params`  
    -   `$0.fields`  
    -   `$0.signature`  
    -   `$0.expectedFiles`  

### getAssemblyStatus

[src/plugins/Transloadit/Client.js:53-56](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Transloadit/Client.js#L53-L56 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Dummy

[src/plugins/Dummy.js:9-67](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Dummy.js#L9-L67 "Source code on GitHub")

**Extends Plugin**

Dummy
A test plugin, does nothing useful

## index

[src/plugins/DragDrop/index.js:11-179](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/DragDrop/index.js#L11-L179 "Source code on GitHub")

**Extends Plugin**

Drag & Drop plugin

### checkDragDropSupport

[src/plugins/DragDrop/index.js:67-83](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/DragDrop/index.js#L67-L83 "Source code on GitHub")

Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if supported, false otherwise

## flatten

[src/core/Utils.js:14-16](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L14-L16 "Source code on GitHub")

Shallow flatten nested arrays.

**Parameters**

-   `arr`  

## groupBy

[src/core/Utils.js:73-81](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L73-L81 "Source code on GitHub")

Partition array by a grouping function.

**Parameters**

-   `array` **\[type]** Input array
-   `groupingFn` **\[type]** Grouping function

Returns **\[type]** Array of arrays

## every

[src/core/Utils.js:89-97](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L89-L97 "Source code on GitHub")

Tests if every array element passes predicate

**Parameters**

-   `array` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Input array
-   `predicateFn` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Predicate

Returns **bool** Every element pass

## toArray

[src/core/Utils.js:102-104](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L102-L104 "Source code on GitHub")

Converts list into array

**Parameters**

-   `list`  

## generateFileID

[src/core/Utils.js:113-118](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L113-L118 "Source code on GitHub")

Takes a fileName and turns it into fileID, by converting to lowercase,
removing extra characters and adding unix timestamp

**Parameters**

-   `fileName` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## getProportionalImageHeight

[src/core/Utils.js:138-142](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L138-L142 "Source code on GitHub")

Takes function or class, returns its name.
Because IE doesn’t support `constructor.name`.
<https://gist.github.com/dfkaye/6384439>, <http://stackoverflow.com/a/15714445>

**Parameters**

-   `fn` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** — function
-   `img`  
-   `newWidth`  

## readFile

[src/core/Utils.js:182-212](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L182-L212 "Source code on GitHub")

Reads file as data URI from file object,
the one you get from input[type=file] or drag & drop.

**Parameters**

-   `file` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** object
-   `fileObj`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** dataURL of the file

## createImageThumbnail

[src/core/Utils.js:224-256](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L224-L256 "Source code on GitHub")

Resizes an image to specified width and proportional height, using canvas
See <https://davidwalsh.name/resize-image-canvas>,
<http://babalan.com/resizing-images-with-javascript/>

**Parameters**

-   `Data` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** URI of the original image
-   `width` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** of the resulting image
-   `imgDataURI`  
-   `newWidth`  

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Data URI of the resized image

## copyToClipboard

[src/core/Utils.js:303-343](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L303-L343 "Source code on GitHub")

Copies text to clipboard by creating an almost invisible textarea,
adding text there, then running execCommand('copy').
Falls back to prompt() when the easy way fails (hello, Safari!)
From <http://stackoverflow.com/a/30810322>

**Parameters**

-   `textToCopy` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `fallbackString` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

## isDOMElement

[src/core/Utils.js:426-428](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L426-L428 "Source code on GitHub")

Check if an object is a DOM element. Duck-typing based on `nodeType`.

**Parameters**

-   `obj` **Any** 

## findDOMElement

[src/core/Utils.js:436-444](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Utils.js#L436-L444 "Source code on GitHub")

Find a DOM element.

**Parameters**

-   `element` **([Node](https://developer.mozilla.org/en-US/docs/Web/API/Node/nextSibling) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** 

Returns **([Node](https://developer.mozilla.org/en-US/docs/Web/API/Node/nextSibling) | null)** 

## Translator

[src/core/Translator.js:14-86](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Translator.js#L14-L86 "Source code on GitHub")

Translates strings with interpolation & pluralization support.
Extensible with custom dictionaries and pluralization functions.

Borrows heavily from and inspired by Polyglot <https://github.com/airbnb/polyglot.js>,
basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
and can be easily added among with dictionaries, nested objects are used for pluralization
as opposed to `||||` delimeter

Usage example: `translator.translate('files_chosen', {smart_count: 3})`

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### interpolate

[src/core/Translator.js:48-69](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Translator.js#L48-L69 "Source code on GitHub")

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

[src/core/Translator.js:78-85](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/core/Translator.js#L78-L85 "Source code on GitHub")

Public translate method

**Parameters**

-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with values that will be used later to replace placeholders in string

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** translated (and interpolated)

## ProgressBar

[src/plugins/ProgressBar.js:8-45](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/ProgressBar.js#L8-L45 "Source code on GitHub")

**Extends Plugin**

Progress bar

## Informer

[src/plugins/Informer.js:11-120](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/Informer.js#L11-L120 "Source code on GitHub")

**Extends Plugin**

Informer
Shows rad message bubbles
used like this: `bus.emit('informer', 'hello world', 'info', 5000)`
or for errors: `bus.emit('informer', 'Error uploading img.jpg', 'error', 5000)`

## MetaData

[src/plugins/MetaData.js:8-51](https://github.com/transloadit/uppy/blob/dc65688b4891c1227374a436217fd1928b522d00/src/plugins/MetaData.js#L8-L51 "Source code on GitHub")

**Extends Plugin**

Meta Data
Adds metadata fields to Uppy
