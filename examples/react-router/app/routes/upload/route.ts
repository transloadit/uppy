import { LocalFileStorage } from '@mjackson/file-storage/local'
import { type FileUpload, parseFormData } from '@mjackson/form-data-parser'
import type { ActionFunctionArgs } from 'react-router'

const fileStorage = new LocalFileStorage('./uploads')

export async function action({ request }: ActionFunctionArgs) {
  const uploadedFiles: { filename: string; size: number; type: string }[] = []

  const uploadHandler = async (fileUpload: FileUpload) => {
    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const filename = `${timestamp}-${fileUpload.name}`

    await fileStorage.set(filename, fileUpload)
    const storedFile = await fileStorage.get(filename)

    // Store file info for response
    uploadedFiles.push({
      filename,
      size: storedFile?.size || 0,
      type: fileUpload.type,
    })

    // Return the filename for FormData
    return filename
  }

  try {
    await parseFormData(request, uploadHandler)

    return Response.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { success: false, error: 'Upload failed' },
      { status: 500 },
    )
  }
}
