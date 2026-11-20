---
'@uppy/companion': patch
---

The S3 upload endpoints validate their request input with zod schemas. The single-part signing endpoint now rejects part numbers that aren't a whole number from 1 to 10000 (e.g. `20000` or `5abc`), as its error message and the batch endpoint already said.
