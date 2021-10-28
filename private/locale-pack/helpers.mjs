import fs from 'node:fs'
import glob from 'glob'
import Task from 'data.task'

export function readFile (filePath) {
  return new Task((reject, resolve) => {
    fs.readFile(filePath, 'utf-8', (error, data) => {
      if (error) reject(error)
      else resolve(data)
    })
  })
}

export function writeFile (filePath, data) {
  return new Task((reject, resolve) => {
    fs.writeFile(filePath, data, (error) => {
      if (error) reject(error)
      else resolve(data)
    })
  })
}

export function getPaths (globPath) {
  return new Task((reject, resolve) => {
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
