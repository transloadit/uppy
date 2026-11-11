import {
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
import { expect, test, vi } from 'vitest'
import { defaultOptions } from '../dist/config/companion.js'
import Emitter from '../dist/server/emitter/index.js'
import { startCleanUpJob } from '../dist/server/jobs.js'
import Uploader from '../dist/server/Uploader.js'

const { scheduled } = vi.hoisted(() => ({
  scheduled: [] as Array<() => void>,
}))
vi.mock('node-schedule', () => ({
  default: {
    scheduleJob: (_rule: string, fn: () => void) => scheduled.push(fn),
  },
}))

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
    const old = new Date(Date.now() - 13 * 60 * 60 * 1000)
    utimesSync(inUse, old, old)
    const leftover = join(dir, `${Uploader.FILE_NAME_PREFIX}-leftover`)
    writeFileSync(leftover, '')
    utimesSync(leftover, old, old)

    startCleanUpJob(dir)
    scheduled.at(-1)?.()
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
