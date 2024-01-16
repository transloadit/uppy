/**
 * Takes an Integer value of seconds (e.g. 83) and converts it into a
 * human-readable formatted string (e.g. '1:23').
 */
export default function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
