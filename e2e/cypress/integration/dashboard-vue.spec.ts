describe('dashboard-vue', () => {
  beforeEach(() => {
    cy.visit('/dashboard-vue')
  })

  // Only Vue 3 works in Parcel if you use SFC's but Vue 3 is broken in Uppy:
  // https://github.com/transloadit/uppy/issues/2877
  xit('should render in Vue 3 and show thumbnails', () => {
    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])
    cy.get('.uppy-Dashboard-Item-previewImg')
      .should('have.length', 2)
      .each((element) => expect(element).attr('src').to.include('blob:'))
  })
})
