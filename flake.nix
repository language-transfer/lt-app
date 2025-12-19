{
  description = "LT Expo Android dev shell (android-nixpkgs SDK)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # Pin to stable channel (as you requested)
    android-nixpkgs = {
      url = "github:tadfisher/android-nixpkgs/stable";
      # optional: keep nixpkgs consistent across inputs
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, android-nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };

      # Compose an immutable SDK out of specific upstream packages.
      # This is the "sdk (sdkPkgs: [ ... ])" pattern from android-nixpkgs. :contentReference[oaicite:1]{index=1}
      android-sdk = android-nixpkgs.sdk.${system} (sdkPkgs: with sdkPkgs; [
        cmdline-tools-latest
        platform-tools

        build-tools-36-0-0
        build-tools-35-0-0
        platforms-android-36
        ndk-27-1-12297006
        cmake-3-22-1

        emulator
        # sources-android-36
      ]);

      # android-nixpkgs sets ANDROID_HOME / ANDROID_SDK_ROOT for shells when the SDK is in buildInputs,
      # but we still export explicitly (keeps tools happy). :contentReference[oaicite:2]{index=2}
      androidHome = "${android-sdk}/share/android-sdk";

      ndkVersion = "27.1.12297006";
      cmakeVersion = "3.22.1";
      buildToolsVersion = "36.0.0";
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          pkgs.nodejs_20
          pkgs.watchman
          pkgs.openjdk17

          android-sdk

          pkgs.git
          pkgs.which
          pkgs.unzip
          pkgs.zip
          pkgs.python3
          pkgs.gnumake
          pkgs.gcc
        ];

        ANDROID_HOME = androidHome;
        ANDROID_SDK_ROOT = androidHome;
        JAVA_HOME = "${pkgs.openjdk17}";

        shellHook = ''
          # Put common Android tools on PATH
          export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

          # Prefer side-by-side NDK path if present; fall back if layout differs.
          if [ -d "$ANDROID_HOME/ndk/${ndkVersion}" ]; then
            export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/${ndkVersion}"
          elif [ -d "$ANDROID_HOME/ndk-bundle" ]; then
            export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk-bundle"
          fi

          # Make Gradle/AGP deterministic about SDK/NDK location.
          mkdir -p android
          cat > android/local.properties <<EOF
sdk.dir=$ANDROID_HOME
ndk.dir=$ANDROID_NDK_ROOT
cmake.dir=$ANDROID_HOME/cmake/${cmakeVersion}
EOF

          # NixOS gotcha: some setups still benefit from forcing aapt2 to the SDK one
          # (this is commonly recommended for Nix-based Android builds). :contentReference[oaicite:3]{index=3}
          if [ -x "$ANDROID_HOME/build-tools/${buildToolsVersion}/aapt2" ]; then
            export GRADLE_OPTS="-Dorg.gradle.project.android.aapt2FromMavenOverride=$ANDROID_HOME/build-tools/${buildToolsVersion}/aapt2 $GRADLE_OPTS"
          fi
        '';
      };
    };
}
