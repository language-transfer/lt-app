{
  description = "Language Transfer Expo development environments";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    android-nixpkgs = {
      url = "github:tadfisher/android-nixpkgs/stable";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      android-nixpkgs,
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;

      commonPackages = pkgs: [
        pkgs.nodejs_20
        pkgs.watchman
        pkgs.git
        pkgs.which
        pkgs.unzip
        pkgs.zip
        pkgs.python3
        pkgs.gnumake
        pkgs.maestro
      ];

      mkIosShell = pkgs: pkgs.mkShell {
        packages = commonPackages pkgs ++ [
          pkgs.cocoapods
        ];

        COCOAPODS_DISABLE_STATS = "true";

        shellHook = ''
          if ! /usr/bin/xcode-select -p >/dev/null 2>&1; then
            echo "Xcode is not selected. Run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
          fi
        '';
      };

      mkAndroidShell = system: pkgs:
        let
          androidSdk = android-nixpkgs.sdk.${system} (
            sdkPkgs:
            (with sdkPkgs; [
              cmdline-tools-latest
              platform-tools
              build-tools-36-0-0
              build-tools-35-0-0
              platforms-android-36
              ndk-27-1-12297006
              cmake-3-22-1
            ])
            ++ nixpkgs.lib.optionals (system == "x86_64-linux") (with sdkPkgs; [
              emulator
              system-images-android-36-google-apis-x86-64
            ])
          );
          androidHome = "${androidSdk}/share/android-sdk";
          ndkVersion = "27.1.12297006";
          cmakeVersion = "3.22.1";
          buildToolsVersion = "36.0.0";
        in
        pkgs.mkShell {
          packages = commonPackages pkgs ++ [
            pkgs.openjdk17
            androidSdk
          ];

          ANDROID_HOME = androidHome;
          ANDROID_SDK_ROOT = androidHome;
          JAVA_HOME = "${pkgs.openjdk17}";

          shellHook = ''
            export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

            mkdir -p android
            cat > android/local.properties <<EOF
sdk.dir=$ANDROID_HOME
android.ndkVersion=${ndkVersion}
cmake.dir=$ANDROID_HOME/cmake/${cmakeVersion}
EOF

            if [ -x "$ANDROID_HOME/build-tools/${buildToolsVersion}/aapt2" ]; then
              export GRADLE_OPTS="-Dorg.gradle.project.android.aapt2FromMavenOverride=$ANDROID_HOME/build-tools/${buildToolsVersion}/aapt2 $GRADLE_OPTS"
            fi
          '';
        };
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          isDarwin = pkgs.stdenv.hostPlatform.isDarwin;
          androidShell = mkAndroidShell system pkgs;
          iosShell = mkIosShell pkgs;
        in
        {
          default = if isDarwin then iosShell else androidShell;
          android = androidShell;
        }
        // nixpkgs.lib.optionalAttrs isDarwin {
          ios = iosShell;
        });
    };
}
