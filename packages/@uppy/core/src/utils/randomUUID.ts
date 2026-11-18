import { v4 } from 'uuid'

/**
 * Generate a random RFC 4122 version 4 UUID.
 *
 * `crypto.randomUUID()` is only available in secure contexts (HTTPS or
 * localhost). `uuid` uses it when it can, and otherwise builds the UUID from
 * `crypto.getRandomValues()`, which is available in all contexts and is just as
 * cryptographically secure, so this also works on plain HTTP.
 *
 * @returns A UUID like `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.
 */
export default function randomUUID(): string {
  return v4()
}
