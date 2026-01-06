export type { Opts as ImageEditorOptions } from './ImageEditor.js'
export { default } from './ImageEditor.js'

// Utility functions for headless image editor hook
export { default as getCanvasDataThatFitsPerfectlyIntoContainer } from './utils/getCanvasDataThatFitsPerfectlyIntoContainer.js'
export { default as getScaleFactorThatRemovesDarkCorners } from './utils/getScaleFactorThatRemovesDarkCorners.js'
export { default as limitCropboxMovementOnMove } from './utils/limitCropboxMovementOnMove.js'
export { default as limitCropboxMovementOnResize } from './utils/limitCropboxMovementOnResize.js'
