---
"@uppy/google-photos-picker": minor
"@uppy/google-drive-picker": minor
"@uppy/thumbnail-generator": minor
"@uppy/golden-retriever": minor
"@uppy/provider-views": minor
"@uppy/remote-sources": minor
"@uppy/screen-capture": minor
"@uppy/google-drive": minor
"@uppy/image-editor": minor
"@uppy/drop-target": minor
"@uppy/transloadit": minor
"@uppy/compressor": minor
"@uppy/status-bar": minor
"@uppy/xhr-upload": minor
"@uppy/dashboard": minor
"@uppy/drag-drop": minor
"@uppy/instagram": minor
"@uppy/facebook": minor
"@uppy/onedrive": minor
"@uppy/unsplash": minor
"@uppy/dropbox": minor
"@uppy/aws-s3": minor
"@uppy/webcam": minor
"@uppy/webdav": minor
"@uppy/audio": minor
"@uppy/core": minor
"@uppy/form": minor
"@uppy/zoom": minor
"@uppy/box": minor
"@uppy/tus": minor
"@uppy/url": minor
---

- Add PluginTypeRegistry and typed getPlugin overload in @uppy/core
- Register plugin ids across packages so uppy.getPlugin('Dashboard' | 'Webcam') returns the concrete plugin type and removes the need to pass generics in getPlugin()