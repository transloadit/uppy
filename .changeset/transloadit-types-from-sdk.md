---
"@uppy/transloadit": minor
---

Use the `transloadit` Node.js SDK's exported Assembly types instead of our inaccurate, hand-rolled ones.

**Warning**

The names of our type exports here are unchanged, but they do pack slightly different types. Overall you'll find they are both more complete, but also more loose. Runtime wise there should be no breaking changes, but it could mean you may need a couple of extra guards to make TypeScript happy.

A cool benefit from the new types tho, is that Robot parameters will now autocomplete for you.
More information on these types, and our approach rolling them out, can be found here https://transloadit.com/blog/2025/09/nodejs-sdk-v4/#our-approach-to-type-retrofitting
