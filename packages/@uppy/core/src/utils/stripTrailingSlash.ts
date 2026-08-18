// Remove trailing slashes so we can always safely append /xyz.
export default function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}
