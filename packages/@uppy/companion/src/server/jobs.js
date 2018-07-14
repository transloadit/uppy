const schedule = require('node-schedule')
const { FILE_NAME_PREFIX } = require('./Uploader')
const fs = require('fs')
const path = require('path')
const logger = require('./logger')

/**
 * Runs a function every 24 hours, to clean up stale, upload related files.
 * @param {string} dirPath path to the directory which you want to clean
 */
exports.startCleanUpJob = (dirPath) => {
  logger.info('starting clean up job', 'jobs.cleanup.start')
  // run once a day
  schedule.scheduleJob('0 23 * * *', () => cleanUpFinishedUploads(dirPath))
}

const cleanUpFinishedUploads = (dirPath) => {
  logger.info(`running clean up job for path: ${dirPath}`, 'jobs.cleanup.progress.read')
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      logger.error(err, 'jobs.cleanup.read.error')
      return
    }

    logger.info(`found ${files.length} files`, 'jobs.cleanup.files')
    files.forEach((file, fileIndex) => {
      // if it does not contain FILE_NAME_PREFIX then it probably wasn't created by companion.
      // this is to avoid deleting unintended files, e.g if a wrong path was accidentally given
      // by a developer.
      if (!file.startsWith(FILE_NAME_PREFIX)) {
        logger.info(`skipping file ${file}`, 'jobs.cleanup.skip')
        return
      }
      const fullPath = path.join(dirPath, file)

      fs.stat(fullPath, (err, stats) => {
        const twelveHoursAgo = 12 * 60 * 60 * 1000
        if (err) {
          // we still delete the file if we can't get the stats
          // but we also log the error
          logger.error(err, 'jobs.cleanup.stat.error')
        // @ts-ignore
        } else if (((new Date()) - stats.mtime) < twelveHoursAgo) {
          logger.info(`skipping file ${file}`, 'jobs.cleanup.skip')
          return
        }

        logger.info(`deleting file ${file}`, 'jobs.cleanup.progress.delete')
        fs.unlink(fullPath, (err) => {
          if (err) logger.error(err, 'jobs.cleanup.delete.error')
        })
      })
    })
  })
}
