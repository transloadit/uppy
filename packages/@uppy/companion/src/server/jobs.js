import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import got from 'got'
import schedule from 'node-schedule'
import * as logger from './logger.js'
import Uploader from './Uploader.js'

const cleanUpFinishedUploads = (dirPath) => {
  logger.info(
    `running clean up job for path: ${dirPath}`,
    'jobs.cleanup.progress.read',
  )
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      logger.error(err, 'jobs.cleanup.read.error')
      return
    }

    logger.info(`found ${files.length} files`, 'jobs.cleanup.files')
    files.forEach((file) => {
      // if it does not contain FILE_NAME_PREFIX then it probably wasn't created by companion.
      // this is to avoid deleting unintended files, e.g if a wrong path was accidentally given
      // by a developer.
      if (!file.startsWith(Uploader.FILE_NAME_PREFIX)) {
        logger.info(`skipping file ${file}`, 'jobs.cleanup.skip')
        return
      }
      const fullPath = path.join(dirPath, file)

      fs.stat(fullPath, (err2, stats) => {
        const twelveHoursAgo = 12 * 60 * 60 * 1000
        if (err2) {
          // we still delete the file if we can't get the stats
          // but we also log the error
          logger.error(err2, 'jobs.cleanup.stat.error')
          // @ts-ignore
        } else if (Date.now() - stats.mtime < twelveHoursAgo) {
          logger.info(`skipping file ${file}`, 'jobs.cleanup.skip')
          return
        }

        logger.info(`deleting file ${file}`, 'jobs.cleanup.progress.delete')
        fs.unlink(fullPath, (err3) => {
          if (err3) logger.error(err3, 'jobs.cleanup.delete.error')
        })
      })
    })
  })
}

/**
 * Runs a function every 24 hours, to clean up stale, upload related files.
 *
 * @param {string} dirPath path to the directory which you want to clean
 */
export function startCleanUpJob(dirPath) {
  logger.info('starting clean up job', 'jobs.cleanup.start')
  // run once a day
  schedule.scheduleJob('0 23 * * *', () => cleanUpFinishedUploads(dirPath))
}

async function runPeriodicPing({ urls, payload, requestTimeout }) {
  // Run requests in parallel
  await Promise.all(
    urls.map(async (url) => {
      try {
        await got.post(url, {
          json: payload,
          timeout: { request: requestTimeout },
        })
      } catch (err) {
        logger.warn(err, 'jobs.periodic.ping')
      }
    }),
  )
}

// This function is used to start a periodic POST request against a user-defined URL
// or set of URLs, for example as a watch dog health check.
export async function startPeriodicPingJob({
  urls,
  interval = 60000,
  count,
  staticPayload = {},
  version,
  processId,
}) {
  if (urls.length === 0) return

  logger.info('Starting periodic ping job', 'jobs.periodic.ping.start')

  let requesting = false

  const requestTimeout = interval / 2

  // Offset by a random value, so that we don't flood recipient if running many instances in a cluster
  const delayBySec = Math.random() * interval
  logger.info(
    `Delaying periodic ping by ${delayBySec}ms`,
    'jobs.periodic.ping.start',
  )
  await sleep(delayBySec)

  let i = 0
  const intervalRef = setInterval(async () => {
    // Used for testing:
    // TODO implement a stop method instead, but this needs to be propagated all the way out, so it's a big rewrite
    if (count != null && i >= count) {
      clearInterval(intervalRef)
      return
    }
    i++

    if (requesting) {
      logger.warn(
        'Periodic ping request already in progress',
        'jobs.periodic.ping',
      )
      return
    }

    try {
      requesting = true
      const payload = {
        version,
        processId,
        service: 'companion',
        ...staticPayload,
      }
      await runPeriodicPing({ urls, payload, requestTimeout })
    } finally {
      requesting = false
    }
  }, interval)
}
