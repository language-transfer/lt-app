# iOS audio format handling

The "High" preference selects `hq-mov` on iOS for both streaming and downloads.
This variant contains the same compressed audio as `hq`, losslessly remuxed into
MOV by lt-tools: Apple's player rejects the MP3-in-MP4 format used by some HQ
lessons. Android and web select `hq`. "Low" selects `lq` on every platform.
Course metadata must include `hq-mov`; missing variants fail schema validation.
The schema still accepts buildVersion 2; adding a variant does not change
existing Android audio hashes or download paths.

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

The playback audio session uses `playback` with no category options so lessons
can become iOS's Now Playing audio and receive system media controls.
`duckOthers` implicitly enables mixing, which makes the session ineligible for
Now Playing; it is intended for brief prompts such as navigation directions.
See Apple's [ducking documentation](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/duckothers)
and [Now Playing eligibility requirements](https://developer.apple.com/videos/play/wwdc2022/110338/?time=227).
Starting a lesson interrupts other apps' audio instead of lowering its volume.
Bluetooth output routing is automatic for `playback`; Bluetooth input options
are not valid.

Verify after rebuilding: stream Spanish lesson 1, play a downloaded
lesson offline, pause/resume, seek, advance to the next lesson, and check
background playback. Verify Control Center and lock-screen controls on a physical
iPhone: [modern iOS simulators do not provide system Now Playing controls](https://github.com/doublesymmetry/react-native-track-player/blob/v4/docs/docs/basics/background-mode.md#ios-simulator).
`index.js` continues to register the playback service. Playback failures appear in the Metro log as
`Audio playback failed` or `Unable to load lesson audio`.
