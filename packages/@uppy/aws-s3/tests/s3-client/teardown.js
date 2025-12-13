import * as dotenv from 'dotenv'

dotenv.config()

import { join } from 'node:path'
import { composeDown } from './docker.js'

const composeFiles = {
  minio: join(process.cwd(), 'tests', 's3-client', 'compose.minio.yaml'),
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
    if (!composeFile) continue // ignore unknown providers

    console.log(`⏬  stopping ${cfg.provider} …`)
    await composeDown(composeFile) // `docker compose -f … down`
  }
}
