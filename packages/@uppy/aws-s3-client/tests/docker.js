import { resolve } from 'node:path'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'

const CWD = resolve('.')

const execAsync = promisify(exec)

export async function getContainerName(serviceName) {
  try {
    // Find container by service name using docker ps
    const { stdout } = await execAsync(
      `docker ps --filter "label=com.docker.compose.service=${serviceName}" --format "{{.Names}}"`,
    )
    const containerName = stdout.trim().split('\n')[0] // Get first matching container
    if (!containerName) {
      throw new Error(`No running container found for service: ${serviceName}`)
    }
    return containerName
  } catch (error) {
    throw new Error(
      `Failed to find container for service ${serviceName}: ${error.message}`,
    )
  }
}

export async function execDockerCommand(
  containerName,
  command,
  timeoutMs = 10000,
) {
  // If it's a service name (like 'garage'), find the actual container name
  let actualContainerName = containerName
  if (['garage', 'minio', 'ceph'].includes(containerName)) {
    try {
      actualContainerName = await getContainerName(containerName)
      console.log(
        `Found container: ${actualContainerName} for service: ${containerName}`,
      )
    } catch (error) {
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

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd: CWD, stdio: 'inherit' })
    p.on('close', (code) =>
      code === 0
        ? res()
        : rej(new Error(`${cmd} ${args.join(' ')} exited ${code}`)),
    )
  })
}
export const composeUp = (file) =>
  run('docker', ['compose', '-f', file, 'up', '-d', '--force-recreate'])
export const composeUpWait = (file) =>
  run('docker', [
    'compose',
    '-f',
    file,
    'up',
    '-d',
    '--force-recreate',
    '--wait',
  ])
export const composeDown = (file) =>
  run('docker', ['compose', '-f', file, 'down', '--remove-orphans', '-v'])
