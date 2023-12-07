import {
  runRemoteUrlImageUploadTest,
  runRemoteUnsplashUploadTest,
} from './reusable-tests'

// NOTE: we have to use different files to upload per test
// because we are uploading to https://tusd.tusdemo.net,
// constantly uploading the same images gives a different cached result (or something).
describe('Dashboard with Tus', () => {
  beforeEach(() => {
    cy.visit('/dashboard-tus')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
    cy.intercept('/files/*').as('tus')
    cy.intercept({ method: 'POST', pathname: '/files' }).as('post')
    cy.intercept({ method: 'PATCH', pathname: '/files/*' }).as('patch')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', {
      force: true,
    })

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@post', '@patch']).then(() => {
      cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
    })
  })

  it('should start exponential backoff when receiving HTTP 429', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/baboon.png', {
      force: true,
    })

    cy.intercept(
      { method: 'PATCH', pathname: '/files/*', times: 2 },
      { statusCode: 429, body: {} },
    ).as('patch')

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait('@tus').then(() => {
      cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
    })
  })

  it('should upload remote image with URL plugin', () => {
    runRemoteUrlImageUploadTest()
  })

  it('should upload remote image with Unsplash plugin', () => {
    runRemoteUnsplashUploadTest()
  })
})
