import { exec, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function getContainerName(serviceName: string) {
  // Find container by service name using docker ps
  const { stdout } = await execAsync(
    `docker ps --filter "label=com.docker.compose.service=${serviceName}" --format "{{.Names}}"`,
  )
  const containerName = stdout.trim().split('\n')[0] // Get first matching container
  if (!containerName) {
    throw new Error(`No running container found for service: ${serviceName}`)
  }
  return containerName
}

export async function execDockerCommand(
  containerName: string,
  command: string,
  timeoutMs = 10000,
) {
  // If it's a service name (like 'garage'), find the actual container name
  let actualContainerName = containerName
  if (['garage', 'minio', 'ceph'].includes(containerName)) {
    try {
      actualContainerName = await getContainerName(containerName)
      // console.log(`Found container: ${actualContainerName} for service: ${containerName}`,)
    } catch (_error) {
      console.log(`Using container name as-is: ${containerName}`)
    }
  }

  const dockerCommand = `docker exec ${actualContainerName} ${command}`

  try {
    // Add timeout to prevent hanging
    const execPromise = execAsync(dockerCommand, { timeout: timeoutMs })
    const { stdout, stderr } = await execPromise

    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`Warning from docker exec: ${stderr}`)
    }
    return stdout.trim()
  } catch (error) {
    // Handle timeout specifically
    if (error.killed && error.signal === 'SIGTERM') {
      throw new Error(
        `Command timed out after ${timeoutMs}ms: ${dockerCommand}`,
      )
    }

    console.error(`Docker exec error details:`, {
      command: dockerCommand,
      message: error.message,
      stderr: error.stderr,
      stdout: error.stdout,
      code: error.code,
      killed: error.killed,
      signal: error.signal,
    })
    throw error
  }
}

async function run(cmd: string, args: string[], env?: Record<string, string>) {
  // console.log('running command:', cmd, args.join(' '))
  return new Promise<void>((res, rej) => {
    const p = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })
    p.on('close', (code) =>
      code === 0
        ? res()
        : rej(new Error(`${cmd} ${args.join(' ')} exited ${code}`)),
    )
    p.on('error', (err) => rej(err))
  })
}

export const composeUpWait = (file: string, env?: Record<string, string>) =>
  run(
    'docker',
    ['compose', '-f', file, 'up', '-d', '--force-recreate', '--wait'],
    env,
  )
export const composeDown = (file: string) =>
  run('docker', ['compose', '-f', file, 'down', '--remove-orphans', '-v'])
