import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import * as dotenv from 'dotenv'

dotenv.config()

import { exec } from 'node:child_process'
import { dirname, join } from 'node:path'

import { promisify } from 'node:util'
import { composeUp, composeUpWait, execDockerCommand } from './docker.js'

const execAsync = promisify(exec)

const garageConfig = `
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
replication_factor = 1
consistency_mode = "consistent"

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_secret = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

[s3_api]
api_bind_addr = "0.0.0.0:9000"
s3_region = "garage"

[admin]
api_bind_addr = "0.0.0.0:3903"
admin_token = "test-admin-token-for-ci"
metrics_token = "test-metrics-token-for-ci"
`

const composeFiles = {
  minio: join(process.cwd(), 'tests', 'compose.minio.yaml'),
  garage: join(process.cwd(), 'tests', 'compose.garage.yaml'),
  // ceph: join(process.cwd(), 'tests', 'compose.ceph.yaml'),
}

async function garageInit(containerName = 'garage') {
  console.log('🔧 Initializing Garage...')

  // The garage config is mounted at /etc/garage.toml in the container
  const configPath = '/etc/garage.toml'

  async function getCurrentLayoutVersion(containerName, cfgPath) {
    const out = await execDockerCommand(
      containerName,
      `/garage -c ${cfgPath} layout show | grep -oE '[0-9]+$'`,
    )
    return Number(out.trim())
  }
  async function ensureBucketExists(container, cfgPath, bucketName) {
    try {
      await execDockerCommand(
        container,
        `/garage -c ${cfgPath} bucket info ${bucketName}`,
      )
      console.log(`ℹ️  Bucket ${bucketName} already exists – skipping creation`)
    } catch (e) {
      // garage throws “Bucket … not found” when the bucket is absent
      if (/Bucket .* not found/.test(e.stderr || '')) {
        await execDockerCommand(
          container,
          `/garage -c ${cfgPath} bucket create ${bucketName}`,
        ) // create once
        console.log(`✅ Bucket created: ${bucketName}`)
      } else {
        throw e // genuine failure
      }
    }
  }

  // Wait for container and garage server to be ready
  let retries = 10
  while (retries > 0) {
    try {
      // Check if garage server is responding
      // IMPORTANT: Using /garage (full path) not just 'garage'
      await execDockerCommand(containerName, `/garage -c ${configPath} status`)
      console.log('✅ Garage server is ready')
      break
    } catch (error) {
      retries--
      if (retries === 0) {
        console.error('Final error:', error)
        // Try to get container logs for debugging
        try {
          const logs = await execAsync(`docker logs ${containerName} --tail 50`)
          console.error('Container logs:', logs.stdout || logs.stderr)
        } catch (logError) {
          console.error('Could not fetch container logs:', logError.message)
        }
        throw new Error(
          'Garage server failed to become ready after 10 attempts',
        )
      }
      console.log(
        `⏳ Waiting for Garage server to be ready... (${retries} retries left)`,
      )
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  try {
    // 1. Get node ID
    const statusOutput = await execDockerCommand(
      containerName,
      `/garage -c ${configPath} status`,
    )

    // Extract node ID from status output
    let nodeId = null
    const nodeIdRegex = /^([0-9a-f]{16})\s+/m
    const nodeIdMatch = statusOutput.match(nodeIdRegex)
    if (nodeIdMatch) {
      nodeId = nodeIdMatch[1]
    } else {
      // Try alternative parsing
      const lines = statusOutput.split('\n')

      for (const line of lines) {
        // Look for a line that starts with a 16-character hex string
        const match = line.match(/^([0-9a-f]{16})\s+/)
        if (match) {
          nodeId = match[1]
          break
        }
      }
    }

    if (!nodeId) {
      console.error('Could not parse node ID from status output')
      throw new Error('Could not find node ID in garage status output')
    }
    console.log(`📍 Found node ID: ${nodeId}`)

    const current = await getCurrentLayoutVersion(containerName, configPath)
    const nextVersion = current + 1

    // 2. Assign layout
    await execDockerCommand(
      containerName,
      `/garage -c ${configPath} layout assign -z dc1 -c 1G ${nodeId}`,
    )
    console.log('✅ Layout assigned')

    // 3. Apply layout
    if (current === 0) {
      await execDockerCommand(
        containerName,
        `/garage -c ${configPath} layout apply --version ${nextVersion}`,
      )
      console.log(`✅ Layout applied (v${nextVersion})`)
    } else {
      console.log(`ℹ️  Layout already at v${current}, skipping apply`)
    }
    // 4. Create bucket
    const bucketName = 'test-bucket'
    await ensureBucketExists(containerName, configPath, bucketName)
    console.log(`✅ Bucket exists: ${bucketName}`)

    // 5. Create key
    const keyName = `test-key-${randomBytes(6).toString('hex')}`
    const keyOutput = await execDockerCommand(
      containerName,
      `/garage -c ${configPath} key create ${keyName}`,
    )

    // Extract key ID and secret from output
    const keyIdMatch = keyOutput.match(/Key ID:\s+(\S+)/)
    const secretKeyMatch = keyOutput.match(/Secret key:\s+(\S+)/)

    if (!keyIdMatch || !secretKeyMatch) {
      console.log('Key output:', keyOutput)
      throw new Error('Could not extract key credentials from output')
    }

    const keyId = keyIdMatch[1]
    const secretKey = secretKeyMatch[1]

    console.log(`✅ Key created`)

    // 6. Allow key to access bucket
    await execDockerCommand(
      containerName,
      `/garage -c ${configPath} bucket allow --read --write --owner ${bucketName} --key ${keyName}`,
    )
    console.log(`✅ Key granted access to bucket ${bucketName}`)

    // Store credentials in environment for tests to use
    process.env.BUCKET_ENV_GARAGE = `garage,${keyId},${secretKey},http://localhost:9000/test-bucket,garage`

    return { keyId, secretKey, bucketName }
  } catch (error) {
    console.error('❌ Failed to initialize Garage:', error)
    throw error
  }
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
      case 'garage': {
        const configPath = join(process.cwd(), 'tests', 'garage', 'garage.toml')
        await mkdir(dirname(configPath), { recursive: true })
        await writeFile(configPath, garageConfig)
        await composeUp(composeFile)
        break
      }
      default:
        await composeUp(composeFile)
    }

    if (cfg.provider === 'garage') {
      await garageInit()
    }
    // if (cfg.provider === 'ceph') {
    //   await cephInit();
    // }
  }
}
