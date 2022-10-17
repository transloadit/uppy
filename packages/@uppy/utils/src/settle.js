export default function settle (promises) {
  const resolutions = []
  const rejections = []
  function resolved (value) {
    resolutions.push(value)
  }
  function rejected (error) {
    rejections.push(error)
  }

  const wait = Promise.all(
    promises.map((promise) => promise.then(resolved, rejected)),
  )

  return wait.then(() => {
    return {
      successful: resolutions,
      failed: rejections,
    }
  })
}
