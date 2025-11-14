---
"@uppy/google-photos-picker": patch
"@uppy/google-drive-picker": patch
"@uppy/thumbnail-generator": patch
"@uppy/golden-retriever": patch
"@uppy/provider-views": patch
"@uppy/remote-sources": patch
"@uppy/screen-capture": patch
"@uppy/google-drive": patch
"@uppy/image-editor": patch
"@uppy/drop-target": patch
"@uppy/transloadit": patch
"@uppy/compressor": patch
"@uppy/status-bar": patch
"@uppy/xhr-upload": patch
"@uppy/dashboard": patch
"@uppy/drag-drop": patch
"@uppy/instagram": patch
"@uppy/facebook": patch
"@uppy/onedrive": patch
"@uppy/unsplash": patch
"@uppy/dropbox": patch
"@uppy/aws-s3": patch
"@uppy/webcam": patch
"@uppy/webdav": patch
"@uppy/audio": patch
"@uppy/core": patch
"@uppy/form": patch
"@uppy/zoom": patch
"@uppy/box": patch
"@uppy/tus": patch
"@uppy/url": patch
---

- Add PluginTypeRegistry and typed getPlugin overload in @uppy/core
- Register plugin ids across packages so uppy.getPlugin('Dashboard' | 'Webcam' | …) returns the concrete plugin type and removes the need to pass generics in getPlugin()
