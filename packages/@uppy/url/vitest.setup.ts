import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import type { TestProject } from 'vitest/node'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const mockServerPort = 62450

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
    [join(__dirname, '../../@uppy/companion/test/with-load-balancer.mjs')],
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

  await setTimeout(1000)

  return () => {
    companionProcess.kill()
    mockServer.close()
  }
}
