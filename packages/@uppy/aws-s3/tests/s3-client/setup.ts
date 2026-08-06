import path from 'node:path'
import { getConfig } from './config'
import { composeDown, composeUpWait, execDockerCommand } from './docker'

const composeFile = path.join(__dirname, 'compose.minio.yaml')

const config = getConfig(process.env)

export async function setup() {
  if (config == null) return

  const { endpoint, rootAccessKeyId, rootSecretAccessKey } = config

  console.log('⏫  starting minio image', composeFile)
  process.env.MINIO_ROOT_USER = rootAccessKeyId
  process.env.MINIO_ROOT_PASSWORD = rootSecretAccessKey
  await composeUpWait(composeFile)
  const bucketName = new URL(endpoint).pathname.split('/')[1]
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
    )
    await execDockerCommand(
      'minio',
      `mc admin policy attach local readwrite --user stsuser`,
    )
  } catch (err) {
    // User may already exist, that's fine
    console.log('STS user setup:', err.message || 'error occurred')
  }
  console.log(`✅  minio is ready`)
}

export async function teardown() {
  if (config == null) return

  console.log(`⏬  stopping minio image …`)
  await composeDown(composeFile)
  console.log(`✅  minio stopped and cleaned up`)
}
