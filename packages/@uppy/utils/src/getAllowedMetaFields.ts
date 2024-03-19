import type { Meta } from './UppyFile'

export default function getAllowedMetaFields<M extends Meta>(
  fields: string[] | boolean,
  meta: M,
): string[] {
  if (Array.isArray(fields)) {
    return fields
  }
  if (fields === true) {
    return Object.keys(meta)
  }
  return []
}
