import { interceptCompanionUrlRequest, interceptCompanionUnsplashRequest, runRemoteUrlImageUploadTest, runRemoteUnsplashUploadTest } from './reusable-tests'

describe('Dashboard with XHR', () => {
  beforeEach(() => {
    cy.visit('/dashboard-xhr')
    interceptCompanionUrlRequest()
    interceptCompanionUnsplashRequest()
  })

  it('should upload remote image with URL plugin', () => {
    runRemoteUrlImageUploadTest()
  })

  it('should return correct file name with URL plugin from remote image with Content-Disposition', () => {
    const fileName = `DALL·E IMG_9078 - 学中文 🤑`
    cy.get('[data-cy="Url"]').click()
    cy.get('.uppy-Url-input').type('http://localhost:4678/file-with-content-disposition')
    cy.get('.uppy-Url-importButton').click()
    cy.wait('@url').then(() => {
      cy.get('.uppy-Dashboard-Item-name').should('contain', fileName)
      cy.get('.uppy-Dashboard-Item-status').should('contain', '84 KB')
    })
  })

  it('should return correct file name with URL plugin from remote image without Content-Disposition', () => {
    cy.get('[data-cy="Url"]').click()
    cy.get('.uppy-Url-input').type('http://localhost:4678/file-no-headers')
    cy.get('.uppy-Url-importButton').click()
    cy.wait('@url').then(() => {
      cy.get('.uppy-Dashboard-Item-name').should('contain', 'file-no')
      cy.get('.uppy-Dashboard-Item-status').should('contain', '0')
    })
  })

  it('should return correct file name even when Companion doesnt supply it', () => {
    cy.intercept('POST', 'http://localhost:3020/url/meta', {
      statusCode: 200,
      headers: {},
      body: JSON.stringify({ size: 123, type: 'image/jpeg' }),
    }).as('url')

    cy.get('[data-cy="Url"]').click()
    cy.get('.uppy-Url-input').type('http://localhost:4678/file-with-content-disposition')
    cy.get('.uppy-Url-importButton').click()
    cy.wait('@url').then(() => {
      cy.get('.uppy-Dashboard-Item-name').should('contain', 'file-with')
      cy.get('.uppy-Dashboard-Item-status').should('contain', '123 B')
    })
  })

  it('should upload remote image with Unsplash plugin', () => {
    runRemoteUnsplashUploadTest()
  })
})
