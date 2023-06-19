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
  it('should upload Russian poem image successfully', () => {
    const fileName = '١٠ كم мест для Нью-Йорке.pdf'
    cy.get('@file-input').selectFile(`cypress/fixtures/images/${fileName}`, { force:true })

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@post', '@get', '@put'])
    cy.get('.uppy-Dashboard-Item-name').should('contain', fileName)
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should handle retry request gracefully',  () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })

    cy.intercept('POST', '/s3/multipart', { forceNetworkError: true, times: 1 }).as('createMultipartUpload-fails')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@createMultipartUpload-fails'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('POST', '/s3/multipart', { statusCode: 200, times: 1, body: JSON.stringify({ key:'mocked-key-attempt1', uploadId:'mocked-uploadId-attempt1' }) }).as('createMultipartUpload-attempt1')
    cy.intercept('GET', '/s3/multipart/mocked-uploadId-attempt1/1?key=mocked-key-attempt1', { forceNetworkError: true }).as('signPart-fails')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@createMultipartUpload-attempt1', '@signPart-fails'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('POST', '/s3/multipart', { statusCode: 200, times: 1, body: JSON.stringify({ key:'mocked-key-attempt2', uploadId:'mocked-uploadId-attempt2' }) }).as('createMultipartUpload-attempt2')
    cy.intercept('GET', '/s3/multipart/mocked-uploadId-attempt2/1?key=mocked-key-attempt2', {
      statusCode: 200,
      headers: {
        ETag: 'W/"222-GXE2wLoMKDihw3wxZFH1APdUjHM"',
      },
      body: JSON.stringify({ url:'/put-fail', expires:8 }),
    }).as('signPart-toFail')
    cy.intercept('PUT', '/put-fail', { forceNetworkError: true }).as('put-fails')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@createMultipartUpload-attempt2', '@signPart-toFail', ...Array(5).fill('@put-fails')], { timeout: 10_000 })
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('GET', '/s3/multipart/mocked-uploadId-attempt2/1?key=mocked-key-attempt2', {
      statusCode: 200,
      headers: {
        ETag: 'ETag-attempt2',
      },
      body: JSON.stringify({ url:'/put-success-attempt2', expires:8 }),
    }).as('signPart-attempt2')
    cy.intercept('PUT', '/put-success-attempt2', {
      statusCode: 200,
      headers: {
        ETag: 'ETag-attempt2',
      },
    }).as('put-attempt2')
    cy.intercept('POST', '/s3/multipart/mocked-uploadId-attempt2/complete?key=mocked-key-attempt2', { forceNetworkError: true }).as('completeMultipartUpload-fails')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@createMultipartUpload-attempt2', '@signPart-attempt2', '@put-attempt2', '@completeMultipartUpload-fails'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Upload failed')

    cy.intercept('POST', '/s3/multipart', { statusCode: 200, times: 1, body: JSON.stringify({ key:'mocked-key-attempt3', uploadId:'mocked-uploadId-attempt3' }) }).as('createMultipartUpload-attempt3')
    cy.intercept('GET', '/s3/multipart/mocked-uploadId-attempt3/1?key=mocked-key-attempt3', {
      statusCode: 200,
      headers: {
        ETag: 'ETag-attempt3',
      },
      body: JSON.stringify({ url:'/put-success-attempt3', expires:8 }),
    }).as('signPart-attempt3')
    cy.intercept('PUT', '/put-success-attempt3', {
      statusCode: 200,
      headers: {
        ETag: 'ETag-attempt3',
      },
    }).as('put-attempt3')
    cy.intercept('POST', '/s3/multipart/mocked-uploadId-attempt3/complete?key=mocked-key-attempt3', {
      statusCode: 200,
      body: JSON.stringify({
        location: 'someLocation',
      }),
    }).as('completeMultipartUpload-attempt3')
    cy.get('.uppy-StatusBar-actions > .uppy-c-btn').click()
    cy.wait(['@createMultipartUpload-attempt3', '@signPart-attempt3', '@put-attempt3', '@completeMultipartUpload-attempt3'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
