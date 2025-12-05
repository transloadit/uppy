import * as dotenv from 'dotenv'

dotenv.config()

import { join } from 'node:path'

import { composeUp, composeUpWait, execDockerCommand } from './docker.js'

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
    if (!composeFile) continue
    console.log(`⏫  starting ${cfg.provider} image …`)
    switch (cfg.provider) {
      case 'minio':
        process.env.MINIO_ROOT_USER = cfg.accessKeyId
        process.env.MINIO_ROOT_PASSWORD = cfg.secretAccessKey
        await composeUpWait(composeFile)
        // biome-ignore lint/correctness/noSwitchDeclarations: no other switch blocks
        const bucketName = new URL(cfg.endpoint).pathname.split('/')[1]
        if (bucketName) {
          await execDockerCommand(
            'minio',
            `mc mb local/${bucketName} --ignore-existing`,
            30000,
          )
        }
        break
      default:
        await composeUp(composeFile)
    }
  }
}
