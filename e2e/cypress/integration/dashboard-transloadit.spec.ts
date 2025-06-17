import Uppy from '@uppy/core'
import Transloadit from '@uppy/transloadit'

function getPlugin<M = any, B = any>(uppy: Uppy<M, B>) {
  return uppy.getPlugin<Transloadit<M, B>>('Transloadit')!
}

describe('Dashboard with Transloadit', () => {
  beforeEach(() => {
    cy.visit('/dashboard-transloadit')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
  })

  it('should upload all files as a single assembly with UppyFile metadata in Upload-Metadata', () => {
    cy.intercept({ path: '/assemblies', method: 'POST' }).as('createAssembly')

    cy.get('@file-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )

    cy.window().then(({ uppy }) => {
      // Set metadata on all files
      uppy.setMeta({ sharedMetaProperty: 'bar' })
      const [file1, file2] = uppy.getFiles()
      // Set unique metdata per file as before that's how we determined to create multiple assemblies
      uppy.setFileMeta(file1.id, { one: 'one' })
      uppy.setFileMeta(file2.id, { two: 'two' })

      cy.get('.uppy-StatusBar-actionBtn--upload').click()

      cy.intercept('POST', '/resumable/*', (req) => {
        expect(req.headers['upload-metadata']).to.include('sharedMetaProperty')
        req.continue()
      })

      cy.wait(['@createAssembly']).then(() => {
        cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
        // should only create one assembly
        cy.get('@createAssembly.all').should('have.length', 1)
      })
    })
  })

  it.skip('should close assembly when cancelled', () => {
    cy.intercept({ path: '/resumable/*', method: 'POST' }).as('tusCreate')
    cy.intercept({ path: '/assemblies', method: 'POST' }).as('createAssemblies')
    cy.intercept({ path: '/assemblies/*', method: 'DELETE' }).as('delete')

    cy.window().then(({ uppy }) => {
      cy.get('@file-input').selectFile(
        [
          'cypress/fixtures/images/cat.jpg',
          'cypress/fixtures/images/traffic.jpg',
          'cypress/fixtures/images/car.jpg',
        ],
        { force: true },
      )
      cy.get('.uppy-StatusBar-actionBtn--upload').click()

      cy.wait(['@createAssemblies', '@tusCreate']).then(() => {
        const { assembly } = getPlugin(uppy)

        expect(assembly.closed).to.be.false

        uppy.cancelAll()

        cy.wait(['@delete']).then(() => {
          expect(assembly.closed).to.be.true
        })
      })
    })
  })

  it('should not emit error if upload is cancelled right away', () => {
    cy.intercept({ path: '/assemblies', method: 'POST' }).as('createAssemblies')

    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', {
      force: true,
    })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    const handler = cy.spy()

    cy.window().then(({ uppy }) => {
      const { files } = uppy.getState()
      uppy.on('upload-error', handler)

      const [fileID] = Object.keys(files)
      uppy.removeFile(fileID)
      uppy.removeFile(fileID)
      cy.wait('@createAssemblies').then(() => expect(handler).not.to.be.called)
    })
  })

  it('should not re-use erroneous tus keys', () => {
    function createAssemblyStatus({
      message,
      assembly_id,
      bytes_expected,
      ...other
    }) {
      return {
        message,
        assembly_id,
        parent_id: null,
        account_id: 'deadbeef',
        account_name: 'foo',
        account_slug: 'foo',
        template_id: null,
        template_name: null,
        instance: 'test.transloadit.com',
        assembly_url: `http://api2.test.transloadit.com/assemblies/${assembly_id}`,
        assembly_ssl_url: `https://api2-test.transloadit.com/assemblies/${assembly_id}`,
        uppyserver_url: 'https://api2-test.transloadit.com/companion/',
        companion_url: 'https://api2-test.transloadit.com/companion/',
        websocket_url: 'about:blank',
        tus_url: 'https://api2-test.transloadit.com/resumable/files/',
        bytes_received: 0,
        bytes_expected,
        upload_duration: 0.162,
        client_agent: null,
        client_ip: null,
        client_referer: null,
        transloadit_client:
          'uppy-core:3.2.0,uppy-transloadit:3.1.3,uppy-tus:3.1.0,uppy-dropbox:3.1.1,uppy-box:2.1.1,uppy-facebook:3.1.1,uppy-google-drive:3.1.1,uppy-instagram:3.1.1,uppy-onedrive:3.1.1,uppy-zoom:2.1.1,uppy-url:3.3.1',
        start_date: new Date().toISOString(),
        upload_meta_data_extracted: false,
        warnings: [],
        is_infinite: false,
        has_dupe_jobs: false,
        execution_start: null,
        execution_duration: null,
        queue_duration: 0.009,
        jobs_queue_duration: 0,
        notify_start: null,
        notify_url: null,
        notify_response_code: null,
        notify_response_data: null,
        notify_duration: null,
        last_job_completed: null,
        fields: {},
        running_jobs: [],
        bytes_usage: 0,
        executing_jobs: [],
        started_jobs: [],
        parent_assembly_status: null,
        params: '{}',
        template: null,
        merged_params: '{}',
        expected_tus_uploads: 1,
        started_tus_uploads: 0,
        finished_tus_uploads: 0,
        tus_uploads: [],
        uploads: [],
        results: {},
        build_id: '4765326956',
        status_endpoint: `https://api2-test.transloadit.com/assemblies/${assembly_id}`,
        ...other,
      }
    }
    cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg'], {
      force: true,
    })

    // SETUP for FIRST ATTEMPT (error response from Transloadit backend)
    const assemblyIDAttempt1 = '500e56004f4347a288194edd7c7a0ae1'
    const tusIDAttempt1 = 'a9daed4af4981880faf29b0e9596a14d'
    cy.intercept('POST', 'https://api2.transloadit.com/assemblies', {
      statusCode: 200,
      body: JSON.stringify(
        createAssemblyStatus({
          ok: 'ASSEMBLY_UPLOADING',
          message: 'The Assembly is still in the process of being uploaded.',
          assembly_id: assemblyIDAttempt1,
          bytes_expected: 263871,
        }),
      ),
    }).as('createAssembly')

    cy.intercept('POST', 'https://api2-test.transloadit.com/resumable/files/', {
      statusCode: 201,
      headers: {
        Location: `https://api2-test.transloadit.com/resumable/files/${tusIDAttempt1}`,
      },
      times: 1,
    }).as('tusCall')
    cy.intercept(
      'PATCH',
      `https://api2-test.transloadit.com/resumable/files/${tusIDAttempt1}`,
      {
        statusCode: 204,
        headers: {
          'Upload-Length': '263871',
          'Upload-Offset': '263871',
        },
        times: 1,
      },
    )
    cy.intercept(
      'HEAD',
      `https://api2-test.transloadit.com/resumable/files/${tusIDAttempt1}`,
      { statusCode: 204 },
    )

    cy.intercept(
      'GET',
      `https://api2-test.transloadit.com/assemblies/${assemblyIDAttempt1}`,
      {
        statusCode: 200,
        body: JSON.stringify(
          createAssemblyStatus({
            error: 'INVALID_FILE_META_DATA',
            http_code: 400,
            message: 'Whatever error message from Transloadit backend',
            reason: 'Whatever reason',
            msg: 'Whatever error from Transloadit backend',
            assembly_id: '500e56004f4347a288194edd7c7a0ae1',
            bytes_expected: 263871,
          }),
        ),
      },
    ).as('failureReported')

    cy.intercept('POST', 'https://transloaditstatus.com/client_error', {
      statusCode: 200,
      body: '{}',
    })

    // FIRST ATTEMPT
    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@createAssembly', '@tusCall', '@failureReported'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    // SETUP for SECOND ATTEMPT
    const assemblyIDAttempt2 = '6a3fa40e527d4d73989fce678232a5e1'
    const tusIDAttempt2 = 'b8ebed4af4981880faf29b0e9596b25e'
    cy.intercept('POST', 'https://api2.transloadit.com/assemblies', {
      statusCode: 200,
      body: JSON.stringify(
        createAssemblyStatus({
          ok: 'ASSEMBLY_UPLOADING',
          message: 'The Assembly is still in the process of being uploaded.',
          assembly_id: assemblyIDAttempt2,
          tus_url: 'https://api2-test.transloadit.com/resumable/files/attempt2',
          bytes_expected: 263871,
        }),
      ),
    }).as('createAssembly-attempt2')

    cy.intercept(
      'POST',
      'https://api2-test.transloadit.com/resumable/files/attempt2',
      {
        statusCode: 201,
        headers: {
          'Upload-Length': '263871',
          'Upload-Offset': '0',
          Location: `https://api2-test.transloadit.com/resumable/files/${tusIDAttempt2}`,
        },
        times: 1,
      },
    ).as('tusCall-attempt2')

    cy.intercept(
      'PATCH',
      `https://api2-test.transloadit.com/resumable/files/${tusIDAttempt2}`,
      {
        statusCode: 204,
        headers: {
          'Upload-Length': '263871',
          'Upload-Offset': '263871',
          'Tus-Resumable': '1.0.0',
        },
        times: 1,
      },
    )
    cy.intercept(
      'HEAD',
      `https://api2-test.transloadit.com/resumable/files/${tusIDAttempt2}`,
      { statusCode: 204 },
    )

    cy.intercept(
      'GET',
      `https://api2-test.transloadit.com/assemblies/${assemblyIDAttempt2}`,
      {
        statusCode: 200,
        body: JSON.stringify(
          createAssemblyStatus({
            ok: 'ASSEMBLY_COMPLETED',
            http_code: 200,
            message: 'The Assembly was successfully completed.',
            assembly_id: assemblyIDAttempt2,
            bytes_received: 263871,
            bytes_expected: 263871,
          }),
        ),
      },
    ).as('assemblyCompleted-attempt2')

    // SECOND ATTEMPT
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait([
      '@createAssembly-attempt2',
      '@tusCall-attempt2',
      '@assemblyCompleted-attempt2',
    ])
  })

  it('should complete on retry', () => {
    cy.intercept('/assemblies/*').as('assemblies')
    cy.intercept('/resumable/*').as('resumable')

    cy.get('@file-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )

    cy.intercept('POST', 'https://transloaditstatus.com/client_error', {
      statusCode: 200,
      body: '{}',
    })

    cy.intercept(
      { method: 'POST', pathname: '/assemblies', times: 1 },
      { statusCode: 500, body: {} },
    ).as('failedAssemblyCreation')

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait('@failedAssemblyCreation')

    cy.get('button[data-cy=retry]').click()

    cy.wait(['@assemblies', '@resumable'])

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should complete when resuming after pause', () => {
    cy.intercept({ path: '/assemblies', method: 'POST' }).as('createAssemblies')
    cy.intercept({ path: '/resumable/files/', method: 'POST' }).as(
      'firstUpload',
    )
    cy.intercept({ path: '/resumable/files/*', method: 'PATCH' }).as(
      'secondUpload',
    )

    cy.get('@file-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@createAssemblies')

    // wait for the upload to start, then pause
    cy.wait('@firstUpload')
    cy.get('button[data-cy=togglePauseResume]').click()

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300) // Wait an arbitrary amount of time as a user would do.

    cy.get('button[data-cy=togglePauseResume]').click()

    cy.wait('@secondUpload')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
