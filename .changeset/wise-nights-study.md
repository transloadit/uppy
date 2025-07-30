---
"@uppy/svelte": major
"@uppy/react": major
"@uppy/vue": major
"@uppy/google-photos-picker": minor
"@uppy/google-drive-picker": minor
"@uppy/thumbnail-generator": minor
"@uppy/companion-client": minor
"@uppy/golden-retriever": minor
"@uppy/provider-views": minor
"@uppy/remote-sources": minor
"@uppy/screen-capture": minor
"@uppy/store-default": minor
"@uppy/google-drive": minor
"@uppy/image-editor": minor
"@uppy/react-native": minor
"@uppy/drop-target": minor
"@uppy/transloadit": minor
"@uppy/components": minor
"@uppy/compressor": minor
"@uppy/status-bar": minor
"@uppy/xhr-upload": minor
"@uppy/companion": minor
"@uppy/dashboard": minor
"@uppy/instagram": minor
"@uppy/facebook": minor
"@uppy/onedrive": minor
"@uppy/unsplash": minor
"angular": minor
"@uppy/dropbox": minor
"@uppy/locales": minor
"@uppy/aws-s3": minor
"@uppy/webcam": minor
"@uppy/webdav": minor
"@uppy/audio": minor
"@uppy/utils": minor
"@uppy/core": minor
"@uppy/form": minor
"@uppy/zoom": minor
"example-sveltekit": minor
"@uppy/box": minor
"@uppy/tus": minor
"@uppy/url": minor
"uppy": minor
"example-vue": minor
---

Added Export Maps and sideEffects to all the uppy packages , uppy/vue , uppy/react and uppy/svelte will have a breaking change as their import paths would change. Export maps are now the default way to specify entrypoint for each package.
