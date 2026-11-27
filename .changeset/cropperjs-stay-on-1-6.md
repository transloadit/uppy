---
'@uppy/image-editor': patch
---

Stay on cropperjs 1.6.x (now `~1.6.3`). The previous range `^1.6.2` also allowed cropperjs 1.7.0, which measures the image with a hidden `<img>` that page CSS such as `img { width: 100% }` can resize, so a saved image could come out smaller than the original.
