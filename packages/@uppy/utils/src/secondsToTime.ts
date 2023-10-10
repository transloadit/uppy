interface Time {
  hours: number
  minutes: number
  seconds: number
}

export default function secondsToTime(rawSeconds: number): Time {
  const hours = Math.floor(rawSeconds / 3600) % 24
  const minutes = Math.floor(rawSeconds / 60) % 60
  const seconds = Math.floor(rawSeconds % 60)

  return { hours, minutes, seconds }
}
