---
type: api
order: 1
title: "Generated API Docs"
---

# Uppy Core & Plugins

## Core

Main Uppy core

**Parameters**

-   `opts` **object** general options, like locale, to show modal or not to show

### run

Runs a waterfall of runType plugin packs, like so:
All preseters(data) --> All selecters(data) --> All uploaders(data) --> done

### runType

Runs all plugins of the same type in parallel

**Parameters**

-   `type` **string** that wants to set progress
-   `files` **array** 

Returns **Promise** of all methods

### setProgress

Sets plugin’s progress, like for uploads

**Parameters**

-   `plugin` **object** that wants to set progress
-   `percentage` **integer** 

Returns **object** self for chaining

### use

Registers a plugin with Core

**Parameters**

-   `Plugin` **Class** object
-   `options` **object** object that will be passed to Plugin later
-   `opts`  

Returns **object** self for chaining

## Translator

Translates strings with interpolation & pluralization support.Extensible with custom dictionaries
and pluralization functions.

Borrows heavily from and inspired by Polyglot <https://github.com/airbnb/polyglot.js>,
basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
and can be easily added among with dictionaries, nested objects are used for pluralization
as opposed to `||||` delimeter

Usage example: \`translator.t('files\_chosen', {smart\_count: 3})``

**Parameters**

-   `opts`  

### interpolate

Takes a string with placeholder variables like `%{smart_count} file selected`
and replaces it with values from options `{smart_count: 5}`

**Parameters**

-   `phrase` **string** that needs interpolation, with placeholders
-   `options` **object** with values that will be used to replace placeholders

Returns **string** interpolated

### t

Public translate method

**Parameters**

-   `key` **string** 
-   `options` **object** with values that will be used later to replace placeholders in string

Returns **string** translated (and interpolated)

## Plugin

Boilerplate that all Plugins share - and should not be used
directly. It also shows which methods final plugins should implement/override,
this deciding on structure.

**Parameters**

-   `main` **object** Uppy core object
-   `object` **object** with plugin options
-   `core`  
-   `opts`  

Returns **array or string** files or success/fail message

## DragDrop

Drag & Drop plugin

**Parameters**

-   `core`  
-   `opts`  

### checkDragDropSupport

Checks if the browser supports Drag & Drop

Returns **object** true if supported, false otherwise

## Tus10

Tus resumable file uploader

**Parameters**

-   `core`  
-   `opts`  

### upload

Create a new Tus upload

**Parameters**

-   `file` **object** for use with upload
-   `current` **integer** file in a queue
-   `total` **integer** number of files in a queue

Returns **Promise** 
