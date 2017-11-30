\----		
type: docs		
order: 30	

## title: "Generated API"

# Uppy Core & Plugins

## Uppy

[src/core/Core.js:16-795](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L16-L795 "Source code on GitHub")

Main Uppy core

**Parameters**

-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** general options, like locales, to show modal or not to show

### updateAll

[src/core/Core.js:116-122](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L116-L122 "Source code on GitHub")

Iterate on all plugins and run `update` on them. Called each time state changes

**Parameters**

-   `state`  

### setState

[src/core/Core.js:129-135](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L129-L135 "Source code on GitHub")

Updates state

**Parameters**

-   `object` **newState** 
-   `stateUpdate`  

### getState

[src/core/Core.js:141-145](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L141-L145 "Source code on GitHub")

Returns current state

### getFile

[src/core/Core.js:331-333](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L331-L333 "Source code on GitHub")

Get a file object.

**Parameters**

-   `fileID` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The ID of the file object to return.

### actions

[src/core/Core.js:397-535](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L397-L535 "Source code on GitHub")

Registers listeners for all global actions, like:
`file-add`, `file-remove`, `upload-progress`, `reset`

### use

[src/core/Core.js:560-589](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L560-L589 "Source code on GitHub")

Registers a plugin with Core

**Parameters**

-   `Plugin` **Class** object
-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** object that will be passed to Plugin later
-   `opts`  

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** self for chaining

### getPlugin

[src/core/Core.js:596-606](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L596-L606 "Source code on GitHub")

Find one Plugin by name

**Parameters**

-   `string`  name description
-   `name`  

### iteratePlugins

[src/core/Core.js:613-617](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L613-L617 "Source code on GitHub")

Iterate through all `use`d plugins

**Parameters**

-   `function`  method description
-   `method`  

### removePlugin

[src/core/Core.js:624-635](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L624-L635 "Source code on GitHub")

Uninstall and remove a plugin.

**Parameters**

-   `instance` **[Plugin](#plugin)** The plugin instance to remove.

### close

[src/core/Core.js:640-650](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L640-L650 "Source code on GitHub")

Uninstall all plugins and close down this Uppy instance.

### info

[src/core/Core.js:659-686](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L659-L686 "Source code on GitHub")

Set info message in `state.info`, so that UI plugins like `Informer`
can display the message

**Parameters**

-   `msg` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Message to be displayed by the informer
-   `type`  
-   `duration`  

### log

[src/core/Core.js:703-720](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L703-L720 "Source code on GitHub")

Logs stuff to console, only if `debug` is set to true. Silent in production.

**Parameters**

-   `msg`  
-   `type`  

Returns **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** to log

### run

[src/core/Core.js:734-748](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Core.js#L734-L748 "Source code on GitHub")

Initializes actions, installs all plugins (by iterating on them and calling `install`), sets options

## Plugin

[src/plugins/Plugin.js:15-105](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Plugin.js#L15-L105 "Source code on GitHub")

Boilerplate that all Plugins share - and should not be used
directly. It also shows which methods final plugins should implement/override,
this deciding on structure.

**Parameters**

-   `main` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Uppy core object
-   `object` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with plugin options

Returns **([array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** files or success/fail message

### mount

[src/plugins/Plugin.js:49-90](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Plugin.js#L49-L90 "Source code on GitHub")

Check if supplied `target` is a DOM element or an `object`.
If it’s an object — target is a plugin, and we search `plugins`
for a plugin with same name and return its target.

**Parameters**

-   `target` **([String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** 
-   `plugin`  

## Utils

[src/plugins/Dashboard/index.js:14-431](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Dashboard/index.js#L14-L431 "Source code on GitHub")

**Extends Plugin**

Modal Dialog & Dashboard

### constructor

[src/generic-provider-views/index.js:43-74](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L43-L74 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  
-   `opts`  

### updateState

[src/generic-provider-views/index.js:79-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L79-L84 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:107-112](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Webcam/index.js#L107-L112 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:116-137](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L116-L137 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:144-147](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L144-L147 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:180-194](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L180-L194 "Source code on GitHub")

Removes session token on client side.

## Utils

[src/core/Utils.js:17-19](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L17-L19 "Source code on GitHub")

A collection of small utility functions that help with dom manipulation, adding listeners,
promises and other good things.

**Parameters**

-   `arr`  

### constructor

[src/generic-provider-views/index.js:43-74](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L43-L74 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  
-   `opts`  

### updateState

[src/generic-provider-views/index.js:79-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L79-L84 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:107-112](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Webcam/index.js#L107-L112 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:116-137](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L116-L137 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:144-147](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L144-L147 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:180-194](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L180-L194 "Source code on GitHub")

Removes session token on client side.

## Utils

[src/generic-provider-views/index.js:39-419](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L39-L419 "Source code on GitHub")

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
getItemThumbnailUrl

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### constructor

[src/generic-provider-views/index.js:43-74](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L43-L74 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  
-   `opts`  

### updateState

[src/generic-provider-views/index.js:79-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L79-L84 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:107-112](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Webcam/index.js#L107-L112 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:116-137](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L116-L137 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:144-147](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L144-L147 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:180-194](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L180-L194 "Source code on GitHub")

Removes session token on client side.

## Utils

[src/plugins/Webcam/index.js:14-311](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Webcam/index.js#L14-L311 "Source code on GitHub")

**Extends Plugin**

Webcam

### constructor

[src/generic-provider-views/index.js:43-74](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L43-L74 "Source code on GitHub")

**Parameters**

-   `instance` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** of the plugin
-   `plugin`  
-   `opts`  

### updateState

[src/generic-provider-views/index.js:79-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L79-L84 "Source code on GitHub")

Little shorthand to update the state with the plugin's state

**Parameters**

-   `newState`  

### updateState

[src/plugins/Webcam/index.js:107-112](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Webcam/index.js#L107-L112 "Source code on GitHub")

Little shorthand to update the state with my new state

**Parameters**

-   `newState`  

### getFolder

[src/generic-provider-views/index.js:116-137](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L116-L137 "Source code on GitHub")

Based on folder ID, fetch a new folder and update it to state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder id
-   `name`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Folders/files in folder

### getNextFolder

[src/generic-provider-views/index.js:144-147](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L144-L147 "Source code on GitHub")

Fetches new folder

**Parameters**

-   `Folder` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Folder title
-   `folder`  

### logout

[src/generic-provider-views/index.js:180-194](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/generic-provider-views/index.js#L180-L194 "Source code on GitHub")

Removes session token on client side.

## index

[src/plugins/StatusBar/index.js:11-141](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/StatusBar/index.js#L11-L141 "Source code on GitHub")

**Extends Plugin**

A status bar.

### checkDragDropSupport

[src/plugins/DragDrop/index.js:68-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/DragDrop/index.js#L68-L84 "Source code on GitHub")

Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if supported, false otherwise

## index

[src/plugins/DragDrop/index.js:11-162](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/DragDrop/index.js#L11-L162 "Source code on GitHub")

**Extends Plugin**

Drag & Drop plugin

### checkDragDropSupport

[src/plugins/DragDrop/index.js:68-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/DragDrop/index.js#L68-L84 "Source code on GitHub")

Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if supported, false otherwise

## index

[src/plugins/Transloadit/index.js:8-374](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Transloadit/index.js#L8-L374 "Source code on GitHub")

**Extends Plugin**

Upload files to Transloadit using Tus.

### checkDragDropSupport

[src/plugins/DragDrop/index.js:68-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/DragDrop/index.js#L68-L84 "Source code on GitHub")

Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if supported, false otherwise

## Dummy

[src/plugins/Dummy.js:9-67](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Dummy.js#L9-L67 "Source code on GitHub")

**Extends Plugin**

Dummy
A test plugin, does nothing useful

## flatten

[src/core/Utils.js:17-19](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L17-L19 "Source code on GitHub")

Shallow flatten nested arrays.

**Parameters**

-   `arr`  

## groupBy

[src/core/Utils.js:76-84](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L76-L84 "Source code on GitHub")

Partition array by a grouping function.

**Parameters**

-   `array` **\[type]** Input array
-   `groupingFn` **\[type]** Grouping function

Returns **\[type]** Array of arrays

## every

[src/core/Utils.js:92-100](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L92-L100 "Source code on GitHub")

Tests if every array element passes predicate

**Parameters**

-   `array` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Input array
-   `predicateFn` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Predicate

Returns **bool** Every element pass

## toArray

[src/core/Utils.js:105-107](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L105-L107 "Source code on GitHub")

Converts list into array

**Parameters**

-   `list`  

## generateFileID

[src/core/Utils.js:116-121](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L116-L121 "Source code on GitHub")

Takes a fileName and turns it into fileID, by converting to lowercase,
removing extra characters and adding unix timestamp

**Parameters**

-   `fileName` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## runPromiseSequence

[src/core/Utils.js:130-136](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L130-L136 "Source code on GitHub")

Runs an array of promise-returning functions in sequence.

**Parameters**

-   `functions`  
-   `args` **...Any** 

## isPreviewSupported

[src/core/Utils.js:152-158](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L152-L158 "Source code on GitHub")

Takes function or class, returns its name.
Because IE doesn’t support `constructor.name`.
<https://gist.github.com/dfkaye/6384439>, <http://stackoverflow.com/a/15714445>

**Parameters**

-   `fn` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** — function
-   `fileTypeSpecific`  

## copyToClipboard

[src/core/Utils.js:300-340](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L300-L340 "Source code on GitHub")

Copies text to clipboard by creating an almost invisible textarea,
adding text there, then running execCommand('copy').
Falls back to prompt() when the easy way fails (hello, Safari!)
From <http://stackoverflow.com/a/30810322>

**Parameters**

-   `textToCopy` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `fallbackString` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

## isDOMElement

[src/core/Utils.js:384-386](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L384-L386 "Source code on GitHub")

Check if an object is a DOM element. Duck-typing based on `nodeType`.

**Parameters**

-   `obj` **Any** 

## findDOMElement

[src/core/Utils.js:394-402](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Utils.js#L394-L402 "Source code on GitHub")

Find a DOM element.

**Parameters**

-   `element` **([Node](https://developer.mozilla.org/en-US/docs/Web/API/Node/nextSibling) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** 

Returns **([Node](https://developer.mozilla.org/en-US/docs/Web/API/Node/nextSibling) | null)** 

## Translator

[src/core/Translator.js:14-86](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Translator.js#L14-L86 "Source code on GitHub")

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

[src/core/Translator.js:48-69](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Translator.js#L48-L69 "Source code on GitHub")

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

[src/core/Translator.js:78-85](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/core/Translator.js#L78-L85 "Source code on GitHub")

Public translate method

**Parameters**

-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** with values that will be used later to replace placeholders in string

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** translated (and interpolated)

## Webcam

[src/uppy-base/src/plugins/Webcam.js:8-336](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/uppy-base/src/plugins/Webcam.js#L8-L336 "Source code on GitHub")

Webcam Plugin

### init

[src/uppy-base/src/plugins/Webcam.js:61-78](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/uppy-base/src/plugins/Webcam.js#L61-L78 "Source code on GitHub")

Checks for getUserMedia support

### detectFlash

[src/uppy-base/src/plugins/Webcam.js:138-162](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/uppy-base/src/plugins/Webcam.js#L138-L162 "Source code on GitHub")

Detects if browser supports flash
Code snippet borrowed from: <https://github.com/swfobject/swfobject>

Returns **bool** flash supported

### stop

[src/uppy-base/src/plugins/Webcam.js:247-264](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/uppy-base/src/plugins/Webcam.js#L247-L264 "Source code on GitHub")

Stops the webcam capture and video playback.

### getImage

[src/uppy-base/src/plugins/Webcam.js:300-317](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/uppy-base/src/plugins/Webcam.js#L300-L317 "Source code on GitHub")

Takes a snapshot and displays it in a canvas.

**Parameters**

-   `video`  
-   `opts`  

## ProgressBar

[src/plugins/ProgressBar.js:8-45](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/ProgressBar.js#L8-L45 "Source code on GitHub")

**Extends Plugin**

Progress bar

## Informer

[src/plugins/Informer.js:11-64](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Informer.js#L11-L64 "Source code on GitHub")

**Extends Plugin**

Informer
Shows rad message bubbles
used like this: `core.emit('informer', 'hello world', 'info', 5000)`
or for errors: `core.emit('informer', 'Error uploading img.jpg', 'error', 5000)`

## MetaData

[src/plugins/MetaData.js:8-51](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/MetaData.js#L8-L51 "Source code on GitHub")

**Extends Plugin**

Meta Data
Adds metadata fields to Uppy

## Tus10

[src/plugins/Tus10.js:29-363](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Tus10.js#L29-L363 "Source code on GitHub")

**Extends Plugin**

Tus resumable file uploader

### upload

[src/plugins/Tus10.js:115-189](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Tus10.js#L115-L189 "Source code on GitHub")

Create a new Tus upload

**Parameters**

-   `file` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

## Client

[src/plugins/Transloadit/Client.js:4-59](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Transloadit/Client.js#L4-L59 "Source code on GitHub")

A Barebones HTTP API client for Transloadit.

### createAssembly

[src/plugins/Transloadit/Client.js:15-48](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Transloadit/Client.js#L15-L48 "Source code on GitHub")

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

[src/plugins/Transloadit/Client.js:55-58](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Transloadit/Client.js#L55-L58 "Source code on GitHub")

Get the current status for an assembly.

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The status endpoint of the assembly.

## Socket

[src/plugins/Transloadit/Socket.js:8-60](https://github.com/transloadit/uppy/blob/e489dc95a3d4e09a5f267dabf4a468f9fa17f105/src/plugins/Transloadit/Socket.js#L8-L60 "Source code on GitHub")

WebSocket status API client for Transloadit.
