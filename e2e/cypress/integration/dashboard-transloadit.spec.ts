const FLAKY = {
  retries: {
    runMode: 3, // retry flaky test
  },
}

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

    cy.wait('@assemblies')
    cy.wait('@resumable')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should close assembly polling when cancelled', () => {
    cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.intercept({
      method: 'GET',
      url: '/assemblies/*',
    }).as('assemblyPolling')
    cy.intercept(
      { method: 'PATCH', pathname: '/files/*', times: 1 },
      { statusCode: 204, body: {} },
    )
    cy.intercept(
      { method: 'DELETE', pathname: '/resumable/files/*', times: 1 },
      { statusCode: 204, body: {} },
    )
    cy.wait('@assemblyPolling')
    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).every((a: any) => a.pollInterval)).to.equal(true)
    })
    cy.get('button[data-cy=cancel]').click()

    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
    })
  })

  it('should emit one assembly-cancelled event when cancelled', FLAKY, () => {
    const spy = cy.spy()

    cy.window().then(({ uppy }) => uppy.on('transloadit:assembly-cancelled', spy))

    cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

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

    cy.wait('@assemblyPolling').then(() => {
      cy.get('button[data-cy=cancel]').click()

      cy.wait('@assemblyDeletion').then(() => {
        expect(spy).to.be.calledOnce
      })
    })
  })

  it.only('should close assembly polling when all files are removed', FLAKY, () => {
    const spy = cy.spy()

    cy.window().then(({ uppy }) => {
      uppy.on('transloadit:assembly-cancelled', spy)

      cy.get('@file-input').selectFile(['cypress/fixtures/images/cat.jpg', 'cypress/fixtures/images/traffic.jpg'], { force:true })
      cy.get('.uppy-StatusBar-actionBtn--upload').click()

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

      cy.wait('@assemblyPolling').then(() => {
        expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).every((a: any) => a.pollInterval)).to.equal(true)

        const { files } = uppy.getState()
        uppy.removeFiles(Object.keys(files))

        cy.wait('@assemblyDeletion').then(() => {
          expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
          expect(spy).to.be.calledOnce
        })
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
})
