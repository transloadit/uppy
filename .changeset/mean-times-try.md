---
"@uppy/companion-client": minor
"@uppy/provider-views": minor
"@uppy/companion": minor
"@uppy/utils": minor
"@uppy/core": minor
---


Server-side search: Implemented search API for Dropbox provider in companion server.
Search view now uses minimal standalone components — <GlobalSearchView /> and <SearchResultItem /> — decoupled from PartialTree.
All search state is managed in <ProviderView /> and passed down to the search view.