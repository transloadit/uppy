import UppyCore = require('@uppy/core');

export interface Uppy extends UppyCore.Uppy {}
export interface Locale extends UppyCore.Locale {}

type OmitTarget<T> = Pick<T, Exclude<Exclude<keyof T, 'target'>, 'replaceTargetContent'>>
type WithBaseUppyProps<T> = T & { uppy: Uppy }
export type ToUppyProps<T> = WithBaseUppyProps<OmitTarget<T>>
