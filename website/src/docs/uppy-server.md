---
title: "Uppy Server"
type: docs
permalink: docs/uppy-server/
order: 5
---

Drag and Drop, Webcam, basic file manipulation (adding metadata, for example) and uploading via tus resumable uploads or XHR/Multipart is all possible using just the `uppy` client module. However, if you add [uppy-server](https://github.com/transloadit/uppy-server) to the mix, your users will be able to select files from remote sources, such as Instagram, Google Drive and Dropbox, bypassing the client (so a 5 GB video isn’t eating into your mobile data plan), and then uploaded to the final distanation. Files are removed from uppy-server after an upload is complete, or after a resonable timeout. Access tokens also don’t stick around for long, for security.

## Installing Uppy Server

``` bash
$ npm install uppy-server
```