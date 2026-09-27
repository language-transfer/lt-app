# iOS audio format handling

Lesson URLs use extensionless content-addressed filenames. The CAS identity of
local downloads is also extensionless, but iOS saves playable audio with an
extension derived from the lesson MIME type (`.m4a`, `.mp4`, or `.mp3`).
The media server currently responds with `application/octet-stream`, even for
AAC audio in MP4 containers. Apple’s player can fail to identify these resources.
The lesson metadata contains the MIME type, but Track Player 5.0.0-alpha0 ignores
the track's `contentType` on iOS.

The patch in `patches/react-native-track-player+5.0.0-alpha0.patch` forwards
`contentType` to Apple's public
[`AVURLAssetOverrideMIMETypeKey`](https://developer.apple.com/documentation/avfoundation/avurlassetoverridemimetypekey)
on iOS 17 and later. Streaming tracks use the streaming variant's type. Local
downloads use their file extension as well as the downloaded file's type.
Preloaded first lessons use local `.m4a` assets.

Download status, cleanup, and purge use the same MIME-derived path as playback.
Android continues to use extensionless CAS files. Development builds with older
extensionless iOS downloads must download those tracks again.

`npm ci` / `npm install` applies the patch through the existing `patch-package`
postinstall script. Run `npm run ios` afterward to rebuild the native player;
Metro reload alone cannot apply Swift changes.

The override is unavailable before iOS 17. Those versions still need correct
server response types for streaming; local downloads have a playable extension.
This patch does not raise the app's minimum iOS version. When
upgrading Track Player, check whether it forwards `contentType` before removing
the patch.

The playback audio session uses `playback` with `duckOthers`. Bluetooth output
routing is automatic for that category; Bluetooth input options are not valid.

Verify on a Mac after rebuilding: stream Spanish lesson 1, play a downloaded
lesson offline, pause/resume, seek, advance to the next lesson, and check
background playback and lock-screen controls. `index.js` continues to register
the playback service. Playback failures now appear in the Metro log as
`Audio playback failed` or `Unable to load lesson audio`.
