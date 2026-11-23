---
'@uppy/components': patch
---

`Thumbnail` only creates object URLs for raster images (JPEG, PNG, GIF, BMP, WebP, AVIF), typed as the file's image type, so an SVG or HTML file can't run scripts when its preview is opened in a new tab. Local SVG files and other image types (e.g. TIFF, ICO, HEIC) now show the file icon instead of a preview.
