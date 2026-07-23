import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import type { TestProject } from 'vitest/node'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const mockServerPort = 62450
const companionPorts = [3021, 3022, 3023]

async function waitForCompanion(port: number): Promise<void> {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        signal: AbortSignal.timeout(1000),
      })
      if (response.ok) return
    } catch {
      // Companion is still starting.
    }

    await delay(100)
  }

  throw new Error(`Companion did not start on port ${port}`)
}

export default async function setup(project: TestProject) {
  const mockServer = createServer((req, res) => {
    const fileName = `DALL·E IMG_9078 - 学中文 🤑`

    if (req.url === '/file-with-content-disposition') {
      res.writeHead(200, {
        'content-disposition': `attachment; filename="ASCII-name.zip"; filename*=UTF-8''${encodeURIComponent(
          fileName,
        )}`,
        'content-type': 'image/jpeg',
        'content-length': '86500',
      })

      if (req.method === 'HEAD') {
        res.end()
      } else {
        res.end('mock image data')
      }
    } else if (req.url === '/file-no-headers') {
      // Explicitly remove any default content-type
      res.removeHeader('content-type')
      res.writeHead(200, {})

      if (req.method === 'HEAD') {
        res.end()
      } else {
        res.end('mock file content')
      }
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  await new Promise<void>((resolve) => {
    mockServer.listen(mockServerPort, 'localhost', resolve)
  })

  const companionProcess = spawn(
    'node',
    [
      join(
        __dirname,
        '../../@uppy/companion/dist/scripts/with-load-balancer.js',
      ),
    ],
    {
      stdio: 'inherit',
      cwd: join(__dirname, '../../../..'),
      env: {
        ...process.env,
        // Pass the mock server URL to companion if needed
        MOCK_SERVER_URL: `http://localhost:${mockServerPort}`,
      },
    },
  )

  try {
    await Promise.all(companionPorts.map(waitForCompanion))
  } catch (err) {
    companionProcess.kill()
    mockServer.close()
    throw err
  }

  return () => {
    companionProcess.kill()
    mockServer.close()
  }
}
