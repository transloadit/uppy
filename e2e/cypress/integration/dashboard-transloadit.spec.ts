describe('Dashboard with Transloadit', () => {
  beforeEach(() => {
    cy.visit('/dashboard-transloadit')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
    cy.intercept('/assemblies').as('createAssemblies')
    cy.intercept('/assemblies/*').as('assemblies')
    cy.intercept('/resumable/*').as('resumable')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@assemblies', '@resumable']).then(() => {
      cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
    })
  })

  it('should close assembly polling when cancelled', () => {
    cy.intercept({
      method: 'GET',
      url: '/assemblies/*',
    }).as('assemblyPolling')
    cy.intercept(
      { method: 'DELETE', pathname: '/assemblies/*', times: 1 },
      { statusCode: 204, body: {} },
    ).as('delete')

    cy.window().then(({ uppy }) => {
      cy.get('@file-input').selectFile(
        ['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg', 'cypress/fixtures/images/car.jpg'],
        { force:true },
      )
      cy.get('.uppy-StatusBar-actionBtn--upload').click()

      cy.wait(['@createAssemblies']).then(() => {
        expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).every((a: any) => a.pollInterval)).to.equal(true)

        uppy.cancelAll()

        cy.wait(['@delete']).then(() => {
          expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
        })
      })
    })
  })

  // Too flaky at the moment. Arguably, this is not the right place
  // as this is doing white box testing (testing internal state).
  // But E2e is more about black box testing, you don’t care about the internals, only the result.
  // May make more sense to turn this into a unit test.
  it.skip('should emit one assembly-cancelled event when cancelled', () => {
    const spy = cy.spy()

    cy.window().then(({ uppy }) => {
      uppy.on('transloadit:assembly-cancelled', spy)

      cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })

      cy.intercept({
        method: 'GET',
        url: '/assemblies/*',
      }).as('assemblyPolling')
      cy.intercept(
        { method: 'PATCH', pathname: '/files/*', times: 1 },
        { statusCode: 204, body: {} },
      )
      cy.intercept(
        { method: 'DELETE', pathname: '/resumable/files/*', times: 2 },
        { statusCode: 204, body: {} },
      ).as('fileDeletion')
      cy.intercept(
        { method: 'DELETE', pathname: '/assemblies/*', times: 1 },
      ).as('assemblyDeletion')

      cy.get('.uppy-StatusBar-actionBtn--upload').click()
      cy.wait('@assemblyPolling')
      cy.get('button[data-cy=cancel]').click()
      cy.wait('@assemblyDeletion')
      // Unfortunately, waiting on a network request somehow often results in a race condition.
      // We just want to know wether this is called or not, so waiting for 2 sec to be sure.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000)
      expect(spy).to.be.calledOnce
    })
  })

  it.skip('should close assembly polling when all files are removed', () => {
    const spy = cy.spy()

    cy.window().then(({ uppy }) => {
      uppy.on('transloadit:assembly-cancelled', spy)

      cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })

      cy.intercept({
        method: 'GET',
        url: '/assemblies/*',
      }).as('assemblyPolling')
      cy.intercept(
        { method: 'PATCH', pathname: '/files/*', times: 1 },
        { statusCode: 204, body: {} },
      )
      cy.intercept(
        { method: 'DELETE', pathname: '/resumable/files/*', times: 2 },
        { statusCode: 204, body: {} },
      ).as('fileDeletion')
      cy.intercept(
        { method: 'DELETE', pathname: '/assemblies/*', times: 1 },
      ).as('assemblyDeletion')

      cy.get('.uppy-StatusBar-actionBtn--upload').click()
      cy.wait('@assemblyPolling')
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).every((a: any) => a.pollInterval)).to.equal(true)

      const { files } = uppy.getState()
      uppy.removeFiles(Object.keys(files))

      cy.wait('@assemblyDeletion').then(() => {
        expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
        expect(spy).to.be.calledOnce
      })
    })
  })

  it('should not create assembly when all individual files have been cancelled', () => {
    cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).length).to.equal(0)

      const { files } = uppy.getState()
      uppy.removeFiles(Object.keys(files))

      cy.wait('@createAssemblies').then(() => {
        expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
      })
    })
  })

  // Not working, the upstream changes have not landed yet.
  it.skip('should create assembly if there is still one file to upload', () => {
    cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).length).to.equal(0)

      const { files } = uppy.getState()
      const [fileID] = Object.keys(files)
      uppy.removeFile(fileID)

      cy.wait('@createAssemblies').then(() => {
        cy.wait('@resumable')
        cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
      })
    })
  })

  // Not working, the upstream changes have not landed yet.
  it.skip('should complete upload if one gets cancelled mid-flight', () => {
    cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@createAssemblies')
    cy.wait('@resumable')

    cy.window().then(({ uppy }) => {
      const { files } = uppy.getState()
      const [fileID] = Object.keys(files)
      uppy.removeFile(fileID)

      cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
    })
  })

  it('should not emit error if upload is cancelled right away', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })
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

  it.only('should not re-use erroneous tus keys', () => {
    cy.get('@file-input').selectFile(
      ['cypress/fixtures/images/cat.jpg'],
      { force:true },
    )

    // FIRST ATTEMPT
    cy.intercept('POST', 'https://api2.transloadit.com/assemblies', {
      statusCode: 200,
      body: JSON.stringify({
        ok:'ASSEMBLY_UPLOADING',
        message:'The Assembly is still in the process of being uploaded.',
        assembly_id:'500e56004f4347a288194edd7c7a0ae1',
        parent_id:null,
        account_id:'deadbeef',
        account_name:'foo',
        account_slug:'foo',
        template_id:null,
        template_name:null,
        instance:'test.transloadit.com',
        assembly_url:'http://api2.test.transloadit.com/assemblies/500e56004f4347a288194edd7c7a0ae1',
        assembly_ssl_url:'https://api2-test.transloadit.com/assemblies/500e56004f4347a288194edd7c7a0ae1',
        uppyserver_url:'https://api2-test.transloadit.com/companion/',
        companion_url:'https://api2-test.transloadit.com/companion/',
        websocket_url:'about:blank',
        tus_url:'https://api2-test.transloadit.com/resumable/files/',
        bytes_received:0,
        bytes_expected:263871,
        upload_duration:0.162,
        client_agent:null,
        client_ip:null,
        client_referer:null,
        transloadit_client:'uppy-core:3.2.0,uppy-transloadit:3.1.3,uppy-tus:3.1.0,uppy-dropbox:3.1.1,uppy-box:2.1.1,uppy-facebook:3.1.1,uppy-google-drive:3.1.1,uppy-instagram:3.1.1,uppy-onedrive:3.1.1,uppy-zoom:2.1.1,uppy-url:3.3.1',
        start_date: new Date().toISOString(),
        upload_meta_data_extracted:false,
        warnings:[],
        is_infinite:false,
        has_dupe_jobs:false,
        execution_start:null,
        execution_duration:null,
        queue_duration:0.009,
        jobs_queue_duration:0,
        notify_start:null,
        notify_url:null,
        notify_response_code:null,
        notify_response_data:null,
        notify_duration:null,
        last_job_completed:null,
        fields:{},
        running_jobs:[],
        bytes_usage:0,
        executing_jobs:[],
        started_jobs:[],
        parent_assembly_status:null,
        params:'{}',
        template:null,
        merged_params:'{}',
        expected_tus_uploads:1,
        started_tus_uploads:0,
        finished_tus_uploads:0,
        tus_uploads:[],
        uploads:[],
        results:{},
        build_id:'4765326956',
        status_endpoint:'https://api2-test.transloadit.com/assemblies/500e56004f4347a288194edd7c7a0ae1',
      }),
    }).as('createAssembly')

    cy.intercept('POST', 'https://api2-test.transloadit.com/resumable/files/', {
      statusCode: 201,
      headers: {
        Location: 'https://api2-test.transloadit.com/resumable/files/a9daed4af4981880faf29b0e9596a14d',
      },
      times: 1,
    }).as('tusCall')
    cy.intercept('PATCH', 'https://api2-test.transloadit.com/resumable/files/a9daed4af4981880faf29b0e9596a14d', {
      statusCode: 204,
      headers: {
        'Upload-Length': '263871',
        'Upload-Offset': '263871',
      },
      times: 1,
    })
    cy.intercept('HEAD', 'https://api2-test.transloadit.com/resumable/files/a9daed4af4981880faf29b0e9596a14d', { statusCode: 204 })

    // ERROR
    cy.intercept('GET', 'https://api2-test.transloadit.com/assemblies/500e56004f4347a288194edd7c7a0ae1', {
      statusCode: 200,
      body: JSON.stringify({
        error:'INVALID_FILE_META_DATA',
        http_code:400,
        message:'We could not parse the meta data for the file rce-poc-transloadit.eps.',
        reason:'The image you provided seems to be malicious.',
        msg:'We could not parse the meta data for the file rce-poc-transloadit.eps.',
        assembly_id:'500e56004f4347a288194edd7c7a0ae1',
        parent_id:null,
        account_id:'deadbeef',
        account_name:'foo',
        account_slug:'foo',
        template_id:null,
        template_name:null,
        instance:'test.transloadit.com',
        assembly_url:'http://api2.test.transloadit.com/assemblies/500e56004f4347a288194edd7c7a0ae1',
        assembly_ssl_url:'https://api2-test.transloadit.com/assemblies/500e56004f4347a288194edd7c7a0ae1',
        uppyserver_url:'https://api2-test.transloadit.com/companion/',
        companion_url:'https://api2-test.transloadit.com/companion/',
        websocket_url:'about:blank',
        tus_url:'https://api2-test.transloadit.com/resumable/files/',
        bytes_received:7687,
        bytes_expected:7687,
        upload_duration:1.247,
        client_agent:null,
        client_ip:null,
        client_referer:null,
        transloadit_client:'uppy-core:3.2.0,uppy-transloadit:3.1.3,uppy-tus:3.1.0,uppy-dropbox:3.1.1,uppy-box:2.1.1,uppy-facebook:3.1.1,uppy-google-drive:3.1.1,uppy-instagram:3.1.1,uppy-onedrive:3.1.1,uppy-zoom:2.1.1,uppy-url:3.3.1',
        start_date:'2023/04/24 10:00:43 GMT',
        upload_meta_data_extracted:false,
        warnings:[],
        is_infinite:false,
        has_dupe_jobs:false,
        execution_start:'2023/04/24 10:00:44 GMT',
        execution_duration:0.431,
        queue_duration:0.161,
        jobs_queue_duration:0,
        notify_start:null,
        notify_url:null,
        notify_response_code:null,
        notify_response_data:null,
        notify_duration:null,
        last_job_completed:null,
        fields:{},
        running_jobs:[],
        bytes_usage:0,
        executing_jobs:['image'],
        started_jobs:['image:::original'],
        parent_assembly_status:null,
        params:'',
        template:null,
        merged_params:'',
        expected_tus_uploads:1,
        started_tus_uploads:1,
        finished_tus_uploads:1,
        tus_uploads:[{}],
        uploads:[{}],
        results:{},
        build_id:'4765326956',
      }),
    }).as('failureReported')

    cy.intercept('POST', 'https://transloaditstatus.com/client_error', {
      statusCode: 200,
      body: '{}',
    })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@createAssembly', ...Array(1).fill('@tusCall'), '@failureReported'])

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    // SECOND ATTEMPT
    cy.intercept('POST', 'https://api2.transloadit.com/assemblies', {
      statusCode: 200,
      body: JSON.stringify({
        ok:'ASSEMBLY_UPLOADING',
        message:'The Assembly is still in the process of being uploaded.',
        assembly_id:'6a3fa40e527d4d73989fce678232a5e1',
        parent_id:null,
        account_id:'deadbeef',
        account_name:'foo',
        account_slug:'foo',
        template_id:null,
        template_name:null,
        instance:'test.transloadit.com',
        assembly_url:'http://api2.test.transloadit.com/assemblies/6a3fa40e527d4d73989fce678232a5e1',
        assembly_ssl_url:'https://api2-test.transloadit.com/assemblies/6a3fa40e527d4d73989fce678232a5e1',
        uppyserver_url:'https://api2-test.transloadit.com/companion/',
        companion_url:'https://api2-test.transloadit.com/companion/',
        websocket_url:'about:blank',
        tus_url:'https://api2-test.transloadit.com/resumable/files/attempt2',
        bytes_received:0,
        bytes_expected:263871,
        upload_duration:0.162,
        client_agent:null,
        client_ip:null,
        client_referer:null,
        transloadit_client:'uppy-core:3.2.0,uppy-transloadit:3.1.3,uppy-tus:3.1.0,uppy-dropbox:3.1.1,uppy-box:2.1.1,uppy-facebook:3.1.1,uppy-google-drive:3.1.1,uppy-instagram:3.1.1,uppy-onedrive:3.1.1,uppy-zoom:2.1.1,uppy-url:3.3.1',
        start_date: new Date().toISOString(),
        upload_meta_data_extracted:false,
        warnings:[],
        is_infinite:false,
        has_dupe_jobs:false,
        execution_start:null,
        execution_duration:null,
        queue_duration:0.009,
        jobs_queue_duration:0,
        notify_start:null,
        notify_url:null,
        notify_response_code:null,
        notify_response_data:null,
        notify_duration:null,
        last_job_completed:null,
        fields:{},
        running_jobs:[],
        bytes_usage:0,
        executing_jobs:[],
        started_jobs:[],
        parent_assembly_status:null,
        params:'{}',
        template:null,
        merged_params:'{}',
        expected_tus_uploads:1,
        started_tus_uploads:0,
        finished_tus_uploads:0,
        tus_uploads:[],
        uploads:[],
        results:{},
        build_id:'4765326956',
        status_endpoint:'https://api2-test.transloadit.com/assemblies/6a3fa40e527d4d73989fce678232a5e1',
      }),
    }).as('createAssembly-attempt2')

    cy.intercept('POST', 'https://api2-test.transloadit.com/resumable/files/attempt2', {
      statusCode: 201,
      headers: {
        'Upload-Length': '263871',
        'Upload-Offset': '0',
        Location: 'https://api2-test.transloadit.com/resumable/files/b8ebed4af4981880faf29b0e9596b25e',
      },
      times: 1,
    }).as('tusCall-attempt2')

    cy.intercept('PATCH', 'https://api2-test.transloadit.com/resumable/files/b8ebed4af4981880faf29b0e9596b25e', {
      statusCode: 204,
      headers: {
        'Upload-Length': '263871',
        'Upload-Offset': '263871',
        'Tus-Resumable': '1.0.0',
      },
      times: 1,
    })
    cy.intercept('HEAD', 'https://api2-test.transloadit.com/resumable/files/b8ebed4af4981880faf29b0e9596b25e', { statusCode: 204 })

    cy.intercept('GET', 'https://api2-test.transloadit.com/assemblies/6a3fa40e527d4d73989fce678232a5e1', {
      statusCode: 200,
      body: JSON.stringify({
        ok:'ASSEMBLY_COMPLETED',
        http_code:200,
        message:'The Assembly was successfully completed.',
        assembly_id:'6a3fa40e527d4d73989fce678232a5e1',
        parent_id:null,
        account_id:'deadbeef',
        account_name:'foo',
        account_slug:'foo',
        template_id:null,
        template_name:null,
        instance:'test.transloadit.com',
        assembly_url:'http://api2.test.transloadit.com/assemblies/6a3fa40e527d4d73989fce678232a5e1',
        assembly_ssl_url:'https://api2-test.transloadit.com/assemblies/6a3fa40e527d4d73989fce678232a5e1',
        uppyserver_url:'https://api2-test.transloadit.com/companion/',
        companion_url:'https://api2-test.transloadit.com/companion/',
        websocket_url:'about:blank',
        tus_url:'https://api2-test.transloadit.com/resumable/files/',
        bytes_received:263871,
        bytes_expected:263871,
        upload_duration:0.901,
        client_agent:null,
        client_ip:null,
        client_referer:null,
        transloadit_client:'uppy-core:3.2.0,uppy-transloadit:3.1.3,uppy-tus:3.1.0,uppy-dropbox:3.1.1,uppy-box:2.1.1,uppy-facebook:3.1.1,uppy-google-drive:3.1.1,uppy-instagram:3.1.1,uppy-onedrive:3.1.1,uppy-zoom:2.1.1,uppy-url:3.3.1',
        start_date:'2023/04/24 10:01:05 GMT',
        upload_meta_data_extracted:true,
        warnings:[],
        is_infinite:false,
        has_dupe_jobs:false,
        execution_start:'2023/04/24 10:01:06 GMT',
        execution_duration:0.926,
        queue_duration:0.172,
        jobs_queue_duration:0,
        notify_start:null,
        notify_url:null,
        notify_response_code:null,
        notify_response_data:null,
        notify_duration:null,
        last_job_completed:'2023/04/24 10:01:07 GMT',
        fields:{},
        running_jobs:[],
        bytes_usage:12199,
        executing_jobs:[],
        started_jobs:['image:::original'],
        parent_assembly_status:null,
        params:'',
        template:null,
        merged_params:'',
        expected_tus_uploads:1,
        started_tus_uploads:1,
        finished_tus_uploads:1,
        tus_uploads:[{}],
        uploads:[{}],
        results:{ image:[{}] },
        build_id:'4765326956',
      }),
    }).as('assemblyCompleted-attempt2')

    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@createAssembly-attempt2', ...Array(1).fill('@tusCall-attempt2'), '@assemblyCompleted-attempt2'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
