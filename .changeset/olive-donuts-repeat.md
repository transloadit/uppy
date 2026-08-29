---
"@uppy/aws-s3": minor
---

Allow `signRequest` to return the key it signed for as `key`, so that
server-generated object keys are reported back to the client instead of the
client-generated one. Signers that return only `{ url }` keep their previous
behaviour.
