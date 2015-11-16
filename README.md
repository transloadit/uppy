# transloadit-js-client

## Design Goals
 
 - Support for IE10+??
 - Lightweight / easy on dependencies
 - tus.io enabled
 - ES6, transpiling to ES5
 - Robust (retries / resumes for *all the things*), avoid showing 'weird errors'
 - Small core, pluggable architecture for adding more file sources: (webcam / google drive / dropbox / etc)
 - Customizable layout - but beautiful by default. Compatible with... Bootstrap?

## Minutes 2015-11-16

 - 

## Agenda 2015-11-16

 1. Introductions
 1. Tim does a screenshare/tour of the current jQuery SDK
 1. A round of questions
 1. Restating the limitation of the current plugin: missing features like resumable, externals integrations, webcam, drag & drop. Adding jquery dependency weight to all projects that want to use it. Marketing: We're missing out on some customers that see jquery as our main integration and turn away. 
 1. Filepicker moving into our encoding domain means we need to move into their file-picking domain - or have a very hard time competing
 1. A tour of the filepicker integration
 1. A brainstorm of how ours should look in the end
 1. Decide what is the minimum viable product
 1. Figure out what the steps are needed to get to a minimum viable product
 1. Divide the workload
 1. Any more questions? Anything else?
