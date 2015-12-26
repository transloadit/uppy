---
type: api
order: 1
title: "Generated API Docs"
---

# Uppy Core & Plugins

## DragDrop

Drag & Drop plugin

**Parameters**

-   `core`  
-   `opts`  

### checkDragDropSupport

Checks if the browser supports Drag & Drop

Returns **object** true if Drag & Drop is supported, false otherwise

## Core

Main Uppy core

**Parameters**

-   `opts`  

### run

Runs a waterfall of runType plugin packs, like so:
All preseters(data) --> All selecters(data) --> All uploaders(data) --> done

### runType

Runs all plugins of the same type in parallel

**Parameters**

-   `type`  
-   `files`  

### setProgress

Sets plugin’s progress, for uploads for example

**Parameters**

-   `plugin` **plugin** that want to set progress
-   `integer` **percentage** 
-   `percentage`  

Returns **object** self for chaining

### use

Registers a plugin with Core

**Parameters**

-   `Plugin` **Plugin** object
-   `options` **opts** object that will be passed to Plugin later
-   `opts`  

Returns **object** self for chaining
