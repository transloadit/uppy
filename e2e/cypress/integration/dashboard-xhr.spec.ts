// NOTE: we have to use different files to upload per test
// because we are uploading to https://tusd.tusdemo.net,
// constantly uploading the same images gives a different cached result (or something).
describe('Dashboard with XHR', () => {
  beforeEach(() => {
    cy.visit('/dashboard-xhr')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
    cy.intercept('http://localhost:3020/url/*').as('url')
    cy.intercept('http://localhost:3020/search/unsplash/*').as('unsplash')
  })

  it('should upload remote image with URL plugin', () => {
    cy.get('[data-cy="Url"]').click()
    cy.get('.uppy-Url-input').type('https://raw.githubusercontent.com/transloadit/uppy/main/e2e/cypress/fixtures/images/cat.jpg')
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
