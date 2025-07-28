import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

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
  const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

  try {
    await writeFile(filepath, buffer)
    return NextResponse.json({
      message: 'File uploaded successfully',
      filename,
    })
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json({ error: 'Error saving file' }, { status: 500 })
  }
}