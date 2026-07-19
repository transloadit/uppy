/**
 * Adds zero to strings shorter than two characters.
 */
function pad(number: number): string {
  return number < 10 ? `0${number}` : number.toString()
}

/**
 * Returns a timestamp in the format of `hours:minutes:seconds`
 */
export default function getTimeStamp(): string {
  const date = new Date()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${hours}:${minutes}:${seconds}`
}
