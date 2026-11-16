import fs, {
  existsSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PassThrough, Readable } from 'node:stream'
import type { Request } from 'express'
import { afterEach, expect, test, vi } from 'vitest'
import { defaultOptions } from '../dist/config/companion.js'
import Emitter from '../dist/server/emitter/index.js'
import { startCleanUpJob } from '../dist/server/jobs.js'
import Uploader from '../dist/server/Uploader.js'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** Start the job at 22:00 on 28 March 2026 and count its runs. */
function startJobAt10pm() {
  const readdir = vi.spyOn(fs, 'readdir')
  vi.useFakeTimers({
    toFake: ['setTimeout', 'Date'],
    now: new Date(2026, 2, 28, 22, 0),
  })
  startCleanUpJob('/nonexistent/companion-cleanup')
  return () => readdir.mock.calls.length
}

test('the clean-up job runs at 23:00 local time, every day', () => {
  const runs = startJobAt10pm()

  vi.advanceTimersByTime(60 * 60 * 1000 - 1)
  expect(runs()).toBe(0)
  vi.advanceTimersByTime(1)
  expect(runs()).toBe(1)
  expect(new Date()).toEqual(new Date(2026, 2, 28, 23, 0))

  // The next day has 23 hours where clocks go forward on 29 March 2026.
  vi.advanceTimersToNextTimer()
  expect(runs()).toBe(2)
  expect(new Date()).toEqual(new Date(2026, 2, 29, 23, 0))
})

test('the clean-up job runs once when its timer fires a little early', () => {
  const runs = startJobAt10pm()
  const due = new Date(2026, 2, 28, 23, 0).getTime()

  // What the job sees when Node runs the timer a millisecond before 23:00.
  const dateNow = vi.spyOn(Date, 'now').mockReturnValue(due - 1)
  vi.advanceTimersToNextTimer()
  dateNow.mockRestore()
  expect(runs()).toBe(1)

  vi.advanceTimersByTime(60 * 60 * 1000)
  expect(runs()).toBe(1)
})

test('the clean-up job stays scheduled when a run throws', () => {
  const readdir = vi.spyOn(fs, 'readdir').mockImplementationOnce(() => {
    throw new Error('readdir failed')
  })
  vi.useFakeTimers({
    toFake: ['setTimeout', 'Date'],
    now: new Date(2026, 2, 28, 22, 0),
  })
  startCleanUpJob('/nonexistent/companion-cleanup')

  expect(() => vi.advanceTimersToNextTimer()).toThrow('readdir failed')
  vi.advanceTimersToNextTimer()
  expect(readdir).toHaveBeenCalledTimes(2)
})

test('the clean-up job leaves the temp file of a running upload alone', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'companion-cleanup-'))
  try {
    const uploader = new Uploader({
      companionOptions: { ...defaultOptions, streamingUpload: false },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      pathPrefix: dir,
      metadata: {},
    })
    const source = new PassThrough()
    const upload = uploader.uploadStream(source, {} as Request)
    upload.catch(() => {})
    source.write(Buffer.from('Some file'))
    const inUse = join(dir, uploader.fileName)
    await vi.waitFor(() => expect(existsSync(inUse)).toBe(true))

    // The source can hold its response open for hours after sending its data,
    // so the file's mtime ages like that of a leftover.
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000)
    utimesSync(inUse, old, old)
    const leftover = join(dir, `${Uploader.FILE_NAME_PREFIX}-leftover`)
    writeFileSync(leftover, '')
    utimesSync(leftover, old, old)

    // Start a minute before the job is due, then let that minute pass.
    const now = new Date()
    now.setHours(22, 59, 0, 0)
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'], now })
    startCleanUpJob(dir)
    vi.advanceTimersByTime(60_000)
    vi.useRealTimers()
    await vi.waitFor(() => expect(existsSync(leftover)).toBe(false))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(existsSync(inUse)).toBe(true)

    Emitter().emit(`cancel:${uploader.token}`)
    await expect(upload).rejects.toThrow('Canceled')
    expect(existsSync(inUse)).toBe(false)
    expect(Uploader.isTmpFileInUse(uploader.fileName)).toBe(false)
    uploader.removeEmitterListeners()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a temp file deleted before its read stream opens it fails no more than that stream', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'companion-cleanup-'))
  try {
    const uploader = new Uploader({
      companionOptions: { ...defaultOptions, streamingUpload: false },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      pathPrefix: dir,
      metadata: {},
    })
    await uploader._downloadStreamAsFile(
      Readable.from([Buffer.from('Some file')]),
    )
    // Before the next tick, when the read stream opens the file.
    unlinkSync(join(dir, uploader.fileName))
    await vi.waitFor(() => expect(uploader.readStream?.destroyed).toBe(true))
    expect(uploader.readStream?.errored).toMatchObject({ code: 'ENOENT' })
    await uploader.tryDeleteTmpPath()
    uploader.removeEmitterListeners()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
