// Same alphabet and algorithm as nanoid/non-secure (MIT).
const alphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'

/**
 * A random, URL-safe ID (21 characters by default). Uses `Math.random()`, so
 * it is fine for element IDs and upload IDs, but not for anything secret.
 */
export default function nanoid(size = 21): string {
  let id = ''
  for (let i = size | 0; i > 0; i--) id += alphabet[(Math.random() * 64) | 0]
  return id
}
