import glob from 'glob'

export function getPaths (globPath) {
  console.log(globPath);
  return new Promise((resolve, reject) => {
    glob(globPath, (error, paths) => {
      if (error) reject(error)
      else resolve(paths)
    })
  })
}

export function sortObjectAlphabetically (obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  )
}

export function omit (object, key) {
  const copy = { ...object }
  delete copy[key]
  return copy
}
