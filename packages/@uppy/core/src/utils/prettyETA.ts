import secondsToTime from './secondsToTime.js'

export default function prettyETA(seconds: number): string {
  const time = secondsToTime(seconds)

  // Only display hours and minutes if they are greater than 0 but always
  // display minutes if hours is being displayed
  // Display a leading zero if the there is a preceding unit: 1m 05s, but 5s
  const hoursStr = time.hours === 0 ? '' : `${time.hours}h`
  const minutesStr =
    time.minutes === 0
      ? ''
      : `${
          time.hours === 0
            ? time.minutes
            : ` ${time.minutes.toString(10).padStart(2, '0')}`
        }m`
  const secondsStr =
    time.hours !== 0
      ? ''
      : `${
          time.minutes === 0
            ? time.seconds
            : ` ${time.seconds.toString(10).padStart(2, '0')}`
        }s`

  return `${hoursStr}${minutesStr}${secondsStr}`
}
