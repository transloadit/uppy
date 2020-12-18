import Uppy = require('@uppy/core')

declare function useUppy<
  Types extends Uppy.TypeChecking = Uppy.LooseTypes
>(
  factory: () => Uppy.Uppy<Types>
): Uppy.Uppy<Types>

export = useUppy
