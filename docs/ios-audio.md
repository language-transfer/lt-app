# iOS audio format handling

Lesson URLs and local downloads use extensionless content-addressed filenames.
The media server currently responds with `application/octet-stream`, even for
AAC audio in MP4 containers. Apple’s player can fail to identify these resources.
The lesson metadata contains the MIME type, but Track Player 5.0.0-alpha0 ignores
the track's `contentType` on iOS.

The patch in `patches/react-native-track-player+5.0.0-alpha0.patch` forwards
`contentType` to Apple's public
[`AVURLAssetOverrideMIMETypeKey`](https://developer.apple.com/documentation/avfoundation/avurlassetoverridemimetypekey)
on iOS 17 and later. Streaming tracks use the streaming variant's type; downloaded
tracks use the downloaded file's type. Preloaded first lessons use local `.m4a`
assets, which Apple can identify by their extension.

`npm ci` / `npm install` applies the patch through the existing `patch-package`
postinstall script. Run `npm run ios` afterward to rebuild the native player;
Metro reload alone cannot apply Swift changes.

The override is unavailable before iOS 17. Those versions still need correct
server response types for streaming and a separate solution for extensionless
local downloads. This patch does not raise the app's minimum iOS version. When
upgrading Track Player, check whether it forwards `contentType` before removing
the patch.

The playback audio session uses `playback` with `duckOthers`. Bluetooth output
routing is automatic for that category; Bluetooth input options are not valid.

Verify on a Mac after rebuilding: stream Spanish lesson 1, play a downloaded
lesson offline, pause/resume, seek, advance to the next lesson, and check
background playback and lock-screen controls. `index.js` continues to register
the playback service. Playback failures now appear in the Metro log as
`Audio playback failed` or `Unable to load lesson audio`.
