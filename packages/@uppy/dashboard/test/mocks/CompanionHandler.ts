import { HttpResponse, http } from 'msw'

const COMPANION_URL = 'http://companion.test'

/**
 * Mocked Folder structure :
 *

root/ (Dropbox)
├── first/
│   ├── second/
│   │   ├── third/
│   │   │   ├── nested-target.pdf
│   │   │   └── new-file.pdf
│   │   ├── deep-file.txt
│   │   ├── target.pdf
│   │   └── workspace.pdf
│   └── intermediate.doc
├── workspace/
│   └── project/
│       └── code.js
└── readme.md

 */

export const handlers = [
  // Mock pre-auth token
  http.get(`${COMPANION_URL}/:provider/preauth`, () => {
    return HttpResponse.json({ token: 'mock-preauth-token' })
  }),

  // Mock authentication check
  http.get(`${COMPANION_URL}/:provider/connect`, () => {
    return HttpResponse.json({
      authenticated: true,
      username: 'test-user@example.com',
    })
  }),

  // Mock folder listing endpoint
  http.get(`${COMPANION_URL}/:provider/list/*`, ({ request }) => {
    const url = new URL(request.url)

    // Extract path: split by '/list/' and take everything after it
    const [, afterList] = url.pathname.split('/list/')
    const pathStr = afterList ? decodeURIComponent(afterList) : ''

    // Root folder
    if (!pathStr || pathStr === 'root') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: true,
            icon: 'folder',
            name: 'first',
            mimeType: 'folder',
            id: 'folder-first',
            thumbnail: null,
            requestPath: encodeURIComponent('/first'),
            modifiedDate: '2024-01-01T00:00:00Z',
            size: null,
          },
          {
            isFolder: true,
            icon: 'folder',
            name: 'workspace',
            mimeType: 'folder',
            id: 'folder-workspace',
            thumbnail: null,
            requestPath: encodeURIComponent('/workspace'),
            modifiedDate: '2024-01-02T00:00:00Z',
            size: null,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'readme.md',
            mimeType: 'text/markdown',
            id: 'file-readme',
            thumbnail: null,
            requestPath: encodeURIComponent('/readme.md'),
            modifiedDate: '2024-01-03T00:00:00Z',
            size: 1024,
          },
        ],
        nextPagePath: null,
      })
    }

    // first folder
    if (pathStr === '/first') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: true,
            icon: 'folder',
            name: 'second',
            mimeType: 'folder',
            id: 'folder-second',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second'),
            modifiedDate: '2024-01-04T00:00:00Z',
            size: null,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'intermediate.doc',
            mimeType: 'application/msword',
            id: 'file-intermediate',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/intermediate.doc'),
            modifiedDate: '2024-01-05T00:00:00Z',
            size: 2048,
          },
        ],
        nextPagePath: null,
      })
    }

    // first/second folder (deep nested)
    if (pathStr === '/first/second') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: true,
            icon: 'folder',
            name: 'third',
            mimeType: 'folder',
            id: 'folder-third',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/third'),
            modifiedDate: '2024-01-06T00:00:00Z',
            size: null,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'deep-file.txt',
            mimeType: 'text/plain',
            id: 'file-deep',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/deep-file.txt'),
            modifiedDate: '2024-01-07T00:00:00Z',
            size: 512,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'target.pdf',
            mimeType: 'application/pdf',
            id: 'file-target',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/target.pdf'),
            modifiedDate: '2024-01-08T00:00:00Z',
            size: 4096,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'workspace.pdf',
            mimeType: 'application/pdf',
            id: 'file-workspace-pdf',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/workspace.pdf'),
            modifiedDate: '2024-01-11T00:00:00Z',
            size: 5120,
          },
        ],
        nextPagePath: null,
      })
    }

    // first/second/third folder (deepest level)
    if (pathStr === '/first/second/third') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'nested-target.pdf',
            mimeType: 'application/pdf',
            id: 'file-nested-target',
            thumbnail: null,
            requestPath: encodeURIComponent(
              '/first/second/third/nested-target.pdf',
            ),
            modifiedDate: '2024-01-09T00:00:00Z',
            size: 2048,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'new-file.pdf',
            mimeType: 'application/pdf',
            id: 'file-new',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/third/new-file.pdf'),
            modifiedDate: '2024-01-10T00:00:00Z',
            size: 3072,
          },
        ],
        nextPagePath: null,
      })
    }

    // workspace folder
    if (pathStr === '/workspace') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: true,
            icon: 'folder',
            name: 'project',
            mimeType: 'folder',
            id: 'folder-project',
            thumbnail: null,
            requestPath: encodeURIComponent('/workspace/project'),
            modifiedDate: '2024-01-08T00:00:00Z',
            size: null,
          },
        ],
        nextPagePath: null,
      })
    }

    // workspace/project folder
    if (pathStr === '/workspace/project') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'code.js',
            mimeType: 'application/javascript',
            id: 'file-code',
            thumbnail: null,
            requestPath: encodeURIComponent('/workspace/project/code.js'),
            modifiedDate: '2024-01-09T00:00:00Z',
            size: 3072,
          },
        ],
        nextPagePath: null,
      })
    }

    // Default empty folder
    return HttpResponse.json({
      username: 'test-user@example.com',
      items: [],
      nextPagePath: null,
    })
  }),

  // Mock search endpoint
  http.get(`${COMPANION_URL}/:provider/search`, ({ request, params }) => {
    const url = new URL(request.url)
    const provider = params.provider as string
    const query = url.searchParams.get('q') || ''
    const searchPath = url.searchParams.get('path')

    if (provider === 'drive') {
      return HttpResponse.json(
        { message: 'method not implemented' },
        { status: 500 },
      )
    }

    // Search for "second" folder
    if (query.toLowerCase() === 'second') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: true,
            icon: 'folder',
            name: 'second',
            mimeType: 'folder',
            id: 'folder-second',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second'),
            modifiedDate: '2024-01-04T00:00:00Z',
            size: null,
          },
        ],
        nextPagePath: null,
        searchedFor: query,
      })
    }

    // Search for "target" file (global search from root)
    if (query.toLowerCase() === 'target' && !searchPath) {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'target.pdf',
            mimeType: 'application/pdf',
            id: 'file-target',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/target.pdf'),
            modifiedDate: '2024-01-08T00:00:00Z',
            size: 4096,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'nested-target.pdf',
            mimeType: 'application/pdf',
            id: 'file-nested-target',
            thumbnail: null,
            requestPath: encodeURIComponent(
              '/first/second/third/nested-target.pdf',
            ),
            modifiedDate: '2024-01-09T00:00:00Z',
            size: 2048,
          },
        ],
        nextPagePath: null,
        searchedFor: query,
      })
    }

    // Scoped search for "target" from /first directory
    if (
      query.toLowerCase() === 'target' &&
      searchPath === encodeURIComponent('/first')
    ) {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'target.pdf',
            mimeType: 'application/pdf',
            id: 'file-target',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/target.pdf'),
            modifiedDate: '2024-01-08T00:00:00Z',
            size: 4096,
          },
          {
            isFolder: false,
            icon: 'file',
            name: 'nested-target.pdf',
            mimeType: 'application/pdf',
            id: 'file-nested-target',
            thumbnail: null,
            requestPath: encodeURIComponent(
              '/first/second/third/nested-target.pdf',
            ),
            modifiedDate: '2024-01-09T00:00:00Z',
            size: 2048,
          },
        ],
        nextPagePath: null,
        searchedFor: query,
      })
    }

    // Search for "deep" - deep nested file
    if (query.toLowerCase() === 'deep') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'deep-file.txt',
            mimeType: 'text/plain',
            id: 'file-deep',
            thumbnail: null,
            requestPath: encodeURIComponent('/first/second/deep-file.txt'),
            modifiedDate: '2024-01-07T00:00:00Z',
            size: 512,
          },
        ],
        nextPagePath: null,
        searchedFor: query,
      })
    }

    // Search from subpath - "code" in workspace
    if (
      query.toLowerCase() === 'code' &&
      searchPath === encodeURIComponent('/workspace')
    ) {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'code.js',
            mimeType: 'application/javascript',
            id: 'file-code',
            thumbnail: null,
            requestPath: encodeURIComponent('/workspace/project/code.js'),
            modifiedDate: '2024-01-09T00:00:00Z',
            size: 3072,
          },
        ],
        nextPagePath: null,
        searchedFor: query,
      })
    }

    // Search for "readme" file in root
    if (query.toLowerCase() === 'readme') {
      return HttpResponse.json({
        username: 'test-user@example.com',
        items: [
          {
            isFolder: false,
            icon: 'file',
            name: 'readme.md',
            mimeType: 'text/markdown',
            id: 'file-readme',
            thumbnail: null,
            requestPath: encodeURIComponent('/readme.md'),
            modifiedDate: '2024-01-03T00:00:00Z',
            size: 1024,
          },
        ],
        nextPagePath: null,
        searchedFor: query,
      })
    }

    // No results
    return HttpResponse.json({
      username: 'test-user@example.com',
      items: [],
      nextPagePath: null,
      searchedFor: query,
    })
  }),
]
