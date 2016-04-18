
```
uppy-server (google drive files && meta)  -> master.tus.io || api2.transloadit.com/resumable
 ^
meta
 ^
Uppy        (local files && meta)         -> master.tus.io || api2.transloadit.com/resumable


By default, all files are transmitted by uppy-server using tus-js-client using the 
same meta information to the endpoint (master.tus.io in this case). 
So it's just a second client.

For a small selection of files: IF:
 - < 2mb
 - we have Modification Plugins for this file.mimeType

Then the file is downloaded to Uppy, and the regular flow is used, uppy-server forgets 
about this file once the Download has completed successfully.
```
