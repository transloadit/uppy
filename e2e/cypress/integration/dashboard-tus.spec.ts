import type BaseTus from '@uppy/tus'

type Tus = BaseTus & {
  requests: { isPaused: boolean }
}

describe('Dashboard with Tus', () => {
  beforeEach(() => {
    cy.visit('/dashboard-tus')
    cy.get('.uppy-Dashboard-input').as('file-input')
    cy.intercept('/files/*').as('tus')
    cy.intercept('http://localhost:3020/url/*').as('url')
    cy.intercept('http://localhost:3020/search/unsplash/*').as('unsplash')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@tus')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  // TODO: figure out why we send a PATCH request while another PATCH is still pending,
  // resulting in a 423 upload is locked
  // logs: https://gist.github.com/Acconut/d17315d2718d2944aabe2941f268530d
  xit('should start exponential backoff when receiving HTTP 429', () => {
    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])
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
    cy.get('.uppy-Url-input').type('https://raw.githubusercontent.com/transloadit/uppy/main/assets/developed-by-transloadit.png')
    cy.get('.uppy-Url-importButton').click()
    cy.wait('@url')
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
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000) // bad practice, but the request is successful before the status bar updates here
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
