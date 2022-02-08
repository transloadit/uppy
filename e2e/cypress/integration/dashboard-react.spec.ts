describe('dashboard-react', () => {
  beforeEach(() => {
    cy.visit('/dashboard-react')
    cy.get('.uppy-Dashboard-input').as('file-input')
  })

  it('should render in React and show thumbnails', () => {
    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])
    cy.get('.uppy-Dashboard-Item-previewImg')
      .should('have.length', 2)
      .each((element) => expect(element).attr('src').to.include('blob:'))
  })
})
