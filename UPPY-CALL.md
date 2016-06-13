## Agenda (2016-06-13)

### Releases

- Maybe move CHANGELOG.md elsewhere. Perhaps copy pasting todos/dones into Releases? 
- Fix releases. We're now using MINOR as main release version

### Bundle (should all plugins be in 'the bundle')

- Only link the obvious ones as to not confuse folks
- Don't care about gz, just about sizes
- locales: only ship en_US. keep it ES5 for now. other locales are downloaded via separate requests, attaching to the main Uppy (unless a developer builds their own Uppy ofc)

### Communication uppy-server and uppy

- Flow: 1 time instructions UP. Progress events DOWN.
- Websockets: http://socket.io
- Server sent events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events ? http://caniuse.com/#search=eventsource. Consider IE polyfill. Consider naughty proxies.
- ~~Nanomsg~~

### Workspace design

- https://slack-files.com/files-pri-safe/T0349SYN8-F1GBJ4KUL/uppy-workspace-design.pdf?c=1465829441-65a8a7000715e2d4c06413f40cbf6e2b9c153c13
