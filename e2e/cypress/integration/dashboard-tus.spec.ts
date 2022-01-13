import type BaseTus from '@uppy/tus'

type Tus = BaseTus & {
  requests: { isPaused: boolean }
}

describe('Dashboard with Tus', () => {
  beforeEach(() => {
    cy.visit('/dashboard-tus')
    cy.get('.uppy-Dashboard-input').as('file-input')
    cy.intercept('/files/*').as('tus')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@tus')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should start exponential backoff when receiving HTTP 429', () => {
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
})
