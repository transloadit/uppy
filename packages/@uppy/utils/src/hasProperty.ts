export default function hasProperty(
  object: Parameters<typeof Object.hasOwn>[0],
  key: Parameters<typeof Object.hasOwn>[1],
): ReturnType<typeof Object.hasOwn> {
  return Object.hasOwn(object, key)
}
