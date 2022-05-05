import type BaseTus from '@uppy/tus'

type Tus = BaseTus & {
  requests: { isPaused: boolean }
}

// NOTE: we have to use different files to upload per test
// because we are uploading to https://tusd.tusdemo.net,
// constantly uploading the same images gives a different cached result (or something).
describe('Dashboard with Tus', () => {
  beforeEach(() => {
    cy.visit('/dashboard-tus')
    cy.get('.uppy-Dashboard-input').as('file-input')
    cy.intercept('/files/*').as('tus')
    cy.intercept('http://localhost:3020/url/*').as('url')
    cy.intercept('http://localhost:3020/search/unsplash/*').as('unsplash')
  })

  it.only('should emit `error` and `upload-error` events on failed POST request', () => {
    cy.get('@file-input').attachFile(['images/traffic.jpg'])

    const error = cy.spy()
    const uploadError = cy.spy()
    cy.window().then(({ uppy }) => {
      uppy.on('upload-error', uploadError)
      uppy.on('error', error)
    })

    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.intercept(
      { method: 'POST', url: 'https://tusd.tusdemo.net/*', times: 1 },
      { statusCode: 401, body: { code: 401, message: 'Expired JWT Token' } },
    ).as('post')

    cy.wait('@post').then(() =>  {
      expect(error).to.be.called
      expect(uploadError).to.be.called
    })
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@tus')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should start exponential backoff when receiving HTTP 429', () => {
    cy.get('@file-input').attachFile(['images/baboon.png'])
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.intercept(
      { method: 'PATCH', pathname: '/files/*', times: 1 },
      { statusCode: 429, body: {} },
    ).as('patch')

    cy.wait('@patch')

    cy.window().then(({ uppy }) => {
      expect(uppy.getPlugin<Tus>('Tus').requests.isPaused).to.equal(true)
      cy.wait('@tus')
      cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
    })
  })

  it('should upload remote image with URL plugin', () => {
    cy.get('[data-cy="Url"]').click()
    cy.get('.uppy-Url-input').type('https://via.placeholder.com/600x400')
    cy.get('.uppy-Url-importButton').click()
    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait('@url')
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should upload remote image with Unsplash plugin', () => {
    cy.get('[data-cy="Unsplash"]').click()
    cy.get('.uppy-SearchProvider-input').type('book')
    cy.get('.uppy-SearchProvider-searchButton').click()
    cy.wait('@unsplash')
    // Test that the author link is visible
    cy.get('.uppy-ProviderBrowserItem')
      .first()
      .within(() => {
        cy.root().click()
        // We have hover states that show the author
        // but we don't have hover in e2e, so we focus after the click
        // to get the same effect. Also tests keyboard users this way.
        cy.get('input[type="checkbox"]').focus()
        cy.get('a').should('have.css', 'display', 'block')
      })
    cy.get('.uppy-c-btn-primary').click()
    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait('@unsplash')
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
