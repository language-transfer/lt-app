# iOS releases through Xcode

Maintainer-confirmed GUI workflow, recorded on October 19, 2026 with Xcode 26.6.
This guide describes the Language Transfer App Store Connect and signing setup
on `jobs.local`. A future computer-use agent can follow it through the existing
VNC connection, inspecting the current screen as it goes. Keep distribution in
the Xcode GUI; this workflow does not need an upload script.

## Before archiving

- Sync the intended release commit to `/Users/timothy/lt-app` on `jobs.local`.
  Confirm the version and iOS build number in `app.json` and the generated
  `ios/LanguageTransfer/Info.plist`.
- Follow the [native project preparation instructions](../README.md#ios-release-policy).
  Preserve the Mac's existing manual signing settings when regenerating the
  ignored native project. See [preloaded content](./preloaded-content.md) for
  the required build phase and bundle checks.
- Open `ios/LanguageTransfer.xcworkspace` in Xcode, rather than the `.xcodeproj`.
  Select the **LanguageTransfer** scheme and **Any iOS Device (arm64)**.
- Simulator playback comes out of the Mac's speakers. This upload workflow
  does not require launching playback. For separate playback tests, arrange
  quiet audio output first and pause playback before leaving the simulator.

## Archive and upload

1. In Xcode, choose **Product → Archive**.
2. Wait for the build to finish. The **Archives** organizer opens when it
   succeeds. Select the new archive and confirm its version and build number.
3. Click **Distribute App**.
4. Choose **Custom**, then **Next**. Custom is required for this App Store
   Connect setup; do not substitute the shorter default distribution flow.
5. Of the four choices—**App Store Connect**, **Release Testing**,
   **Enterprise**, and **Debugging**—select **App Store Connect**, then continue.
6. When offered **Upload** or **Export**, select **Upload**. Allow a moment for
   Xcode to prepare the next screen.
7. Set the upload options:

   | Option | Selection |
   | --- | --- |
   | Upload symbols | Yes |
   | Manage version and build number | Yes |
   | TestFlight internal testing only | **No; leave unchecked** |

8. On the certificate and provisioning-profile screen, use:

   | Setting | Selection |
   | --- | --- |
   | Team | **Mihalis Eleftheriou** (`XZUB4ADZC3`) |
   | Distribution certificate | Keep the default distribution certificate |
   | `LanguageTransfer.app` profile | **Timmy** |
   | Dependency profiles | No profile required for the three dependency entries |

   At the time of recording, two certificate choices appeared to point to the
   same certificate; the default selection worked. The `Timmy` provisioning
   profile was already imported from a `.mobileprovision` file in Timothy's
   Downloads folder. If it is missing on a future machine, import the supplied
   profile before continuing. The app's bundle identifier is
   `org.languagetransfer`.

9. Continue through the summary and click the final **Upload** button.
10. Wait for the upload to finish; it can take a few minutes. The maintainer
    has accepted dependency-symbol warnings on otherwise successful uploads.
    Confirm that the upload succeeded, then click **Done**.

Report the uploaded version/build and any warnings in the handoff. Xcode may
adjust the uploaded build number because **Manage version and build number**
is enabled, so record the actual uploaded value.

## Signing renewal

The imported **Timmy** profile currently expires on **September 15, 2027**.
Before the next release after its expiration, ask Mihalis to generate and supply
a replacement `.mobileprovision`, then import it and select it in Xcode.
Check the distribution certificate's own validity too; it may also need renewal,
but the profile expiration alone does not establish that. Keep provisioning
files, certificates, and private keys out of Git; the display names and setup
instructions above can remain in the repository.

## If Xcode stalls before compiling

An immediate **unable to initiate PIF transfer session (operation in progress?)**
error occurred during this release preparation. Waiting for **Indexing /
Processing files** did not clear it. Restarting the stale `SWBBuildService` and
quitting and reopening Xcode allowed dependency resolution to succeed again.

Quit Xcode normally so unsaved-file prompts are preserved. If needed, restart
its idle `SWBBuildService` in Activity Monitor, then reopen the workspace and
retry the archive. Start with this session reset before clearing build caches;
there was no need to delete Derived Data or reinstall dependencies for that
incident.
