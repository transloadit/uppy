import * as dotenv from 'dotenv'

dotenv.config()

import { join } from 'node:path'

import { composeUp, composeUpWait } from './docker.js'

const composeFiles = {
  minio: join(process.cwd(), 'tests', 'compose.minio.yaml'),
}

const bucketConfigs = Object.keys(process.env)
  .filter((k) => k.startsWith('BUCKET_ENV_'))
  .map((k) => {
    const [provider, accessKeyId, secretAccessKey, endpoint, region] =
      process.env[k].split(',')
    return { provider, accessKeyId, secretAccessKey, endpoint, region }
  })

export default async () => {
  for (const cfg of bucketConfigs) {
    const composeFile = composeFiles[cfg.provider]
    if (!composeFile) continue
    console.log(`⏫  starting ${cfg.provider} image …`)
    switch (cfg.provider) {
      case 'minio':
        process.env.MINIO_ROOT_USER = cfg.accessKeyId
        process.env.MINIO_ROOT_PASSWORD = cfg.secretAccessKey
        await composeUpWait(composeFile)
        break
      default:
        await composeUp(composeFile)
    }
  }
}
