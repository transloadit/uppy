---
"@uppy/thumbnail-generator": patch
---

Fix thumbnails of photos with EXIF orientation 5–8, such as portrait photos from phones. They came out landscape-shaped, with black bars and the top and bottom cut off. Browsers already apply the EXIF orientation, but the plugin also swapped width and height itself. It now leaves orientation to the browser and no longer depends on `exifr`.
