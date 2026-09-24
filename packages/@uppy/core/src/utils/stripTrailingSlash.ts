/**
 * Remove trailing slashes so we can always safely append /xyz.
 */
export default function stripTrailingSlash(url: string): string {
  let end = url.length

  while (end > 0 && url.charCodeAt(end - 1) === 47) {
    end -= 1
  }

  return url.slice(0, end)
}
