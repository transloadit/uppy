import type { Meta } from './UppyFile'

export default function getAllowedMetaFields<M extends Meta>(
  fields: string[] | boolean,
  meta: M,
): string[] {
  if (fields === true) {
    return Object.keys(meta)
  }
  if (Array.isArray(fields)) {
    return fields
  }
  return []
}
