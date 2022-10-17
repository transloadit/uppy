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

  it('should upload remote image with Unsplash plugin', () => {
    runRemoteUnsplashUploadTest()
  })
})
