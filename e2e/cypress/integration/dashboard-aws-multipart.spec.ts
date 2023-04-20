describe('Dashboard with @uppy/aws-s3-multipart', () => {
  beforeEach(() => {
    cy.visit('/dashboard-aws-multipart')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
    cy.intercept({ method: 'POST', pathname: '/s3/multipart' }).as('post')
    cy.intercept({ method: 'GET', pathname: '/s3/multipart/*/1' }).as('get')
    cy.intercept({ method: 'PUT' }).as('put')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@post', '@get', '@put'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should handle error gracefully',  () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })

    cy.intercept('POST', '/s3/multipart', { forceNetworkError: true, times: 1 }).as('post-fails')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@post-fails'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('POST', '/s3/multipart', { statusCode: 200, times: 1, body: JSON.stringify({ key:'mocked-key-example', uploadId:'mocked-uploadId-example' }) }).as('post1')
    cy.intercept('GET', '/s3/multipart/mocked-uploadId-example/1?key=mocked-key-example', { forceNetworkError: true }).as('get-fails')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@post1', '@get-fails'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('POST', '/s3/multipart', { statusCode: 200, times: 1, body: JSON.stringify({ key:'mocked-key-example', uploadId:'mocked-new-uploadId-example' }) }).as('post2')
    cy.intercept('GET', '/s3/multipart/mocked-new-uploadId-example/1?key=mocked-key-example', {
      statusCode: 200,
      headers: {
        ETag: 'W/"222-GXE2wLoMKDihw3wxZFH1APdUjHM"',
      },
      body: JSON.stringify({ url:'/fail-put', expires:8 }),
    }).as('get2')
    cy.intercept('PUT', '/fail-put', { forceNetworkError: true }).as('put-fails')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@post2', '@get2', ...Array(5).fill('@put-fails')], { timeout: 10_000 })
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('GET', '/s3/multipart/mocked-new-uploadId-example/1?key=mocked-key-example', {
      statusCode: 200,
      headers: {
        ETag: 'W/"222-GXE2wLoMKDihw3wxZFH1APdUjHM"',
      },
      body: JSON.stringify({ url:'/fail-success', expires:8 }),
    }).as('get3')
    cy.intercept('PUT', '/fail-success', {
      statusCode: 200,
      headers: {
        ETag: 'W/"222-GXE2wLoMKDihw3wxZFH1APdUjHM"',
      },
    }).as('put3')
    cy.intercept('POST', '/s3/multipart/mocked-new-uploadId-example/complete?key=mocked-key-example', { forceNetworkError: true }).as('post3')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@post2', '@get3', '@put3', '@post3'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('POST', '/s3/multipart/mocked-new-uploadId-example/complete?key=mocked-key-example', {
      statusCode: 200,
      body: JSON.stringify({
        location: 'someLocation',
      }),
    }).as('post4')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@post2', '@get3', '@put3', '@post4'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
