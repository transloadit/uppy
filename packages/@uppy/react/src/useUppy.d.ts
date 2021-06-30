import Uppy = require("@uppy/core")

declare function useUppy(factory: () => Uppy.Uppy): Uppy.Uppy

export = useUppy
