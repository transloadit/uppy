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
    const [provider, rootAccessKeyId, rootSecretAccessKey, endpoint, region] =
      process.env[k].split(',')
    // Use stsuser credentials for all tests (readwrite policy is sufficient)
    // Root credentials are kept for Docker container startup
    return {
      provider,
      accessKeyId: 'stsuser',
      secretAccessKey: 'stspassword123',
      rootAccessKeyId,
      rootSecretAccessKey,
      endpoint,
      region,
    }
  })

export default async function setup({ provide }) {
  // Provide bucket configs to browser tests via Vitest's inject mechanism
  provide('bucketConfigs', bucketConfigs)

  for (const cfg of bucketConfigs) {
    const composeFile = composeFiles[cfg.provider]
    if (!composeFile) continue
    console.log(`⏫  starting ${cfg.provider} image …`)
    switch (cfg.provider) {
      case 'minio':
        process.env.MINIO_ROOT_USER = cfg.rootAccessKeyId
        process.env.MINIO_ROOT_PASSWORD = cfg.rootSecretAccessKey
        await composeUpWait(composeFile)
        // biome-ignore lint/correctness/noSwitchDeclarations: no other switch blocks
        const bucketName = new URL(cfg.endpoint).pathname.split('/')[1]
        if (bucketName) {
          await execDockerCommand(
            'minio',
            `mc mb local/${bucketName} --ignore-existing`,
            30000,
          )
          // Create a user with readwrite policy for STS testing
          // The root user cannot AssumeRole for itself - needs a regular user
          try {
            await execDockerCommand(
              'minio',
              `mc admin user add local stsuser stspassword123`,
              15000,
            )
            await execDockerCommand(
              'minio',
              `mc admin policy attach local readwrite --user stsuser`,
              15000,
            )
          } catch (err) {
            // User may already exist, that's fine
            console.log('STS user setup:', err.message || 'error occurred')
          }
        }
        break
      default:
        await composeUp(composeFile)
    }
  }
}
