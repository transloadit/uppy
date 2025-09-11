import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file.name.replace(/\s/g, '-')

  // Use the same upload directory as TUS server for consistency
  const uploadDir = path.join(process.cwd(), 'files')
  const filepath = path.join(uploadDir, filename)

  try {
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true }).catch(() => {
      // Directory might already exist, ignore the error
    })

    await writeFile(filepath, buffer)
    return NextResponse.json({
      message: 'File uploaded successfully',
      filename,
      filepath: `/files/${filename}`,
    })
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json({ error: 'Error saving file' }, { status: 500 })
  }
}
