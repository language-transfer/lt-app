Welcome to the Language Transfer app! Thanks for your interest in contributing :)

## How to build and run the app

Follow the instructions on the [React Native website](https://reactnative.dev/docs/environment-setup) on setting up a fresh environment, up to the "Creating a new application" section.

Then, clone and install dependencies for the repository.

1. `git clone https://github.com/language-transfer/lt-app.git`
2. `cd lt-app`
3. `npm install`

When developing for iOS, you'll also need to install native dependencies by running:

4. `cd ios && pod install`

When you're ready to run the app, run:

    npx react-native run-android
    # or, for ios:
    npx react-native run-ios

To build a production-ready release, add on the `--variant=release` flag:

    npx react-native run-android --variant=release

## Releasing iOS App Updates

The iOS app release flow is currently set up with Fastlane. To create a new beta release, simply run:

    cd ios && fastlane beta

Your code will be compiled and uploaded to TestFlight. To create a production release, simply run:

    cd ios && fastlane release

In order to use Language Transfer's own App Store Connect account, you'll need to obtain the organization's Apple Provisioning Profile & Developer Certificate. Both can be obtained by contacting Mihalis.

For more help about the iOS development flow, contact @jafayer.

## Dependencies

We use GitHub's [Licensed](https://github.com/github/licensed) to track dependency licenses. When adding new dependencies, use `licensed status` in the root and make sure there are no errors (unless there's missing license text for a public domain dependency). Then generate an update to NOTICES with `licensed notices`. This needs to be uploaded manually to the downloads server to keep the app up-to-date.

## Issues & Pull Requests

At the moment, there's little outstanding work to be done by contributors. Check with the core project maintainers before starting work on a PR, just to make sure you don't duplicate work or go too far in the wrong direction. Accepting contributions is currently a nontrivial burden on the core maintainers; although of course interest in contributing is appreciated, in practice it can be hard to make sure contributors have the support they need throughout the process. Please don't take offense if your PRs/issues aren't accepted, or if they sit idle for a long time!

## Questions?

Feel free to email me@timothyaveni.com if you have any questions about the repository.
