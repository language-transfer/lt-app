/* global describe, test, expect */
const { spawnSync } = require("node:child_process");
const { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const {
  wrapBundlePhaseInNix,
  xcodeEnv,
} = require("@/plugins/withNixXcodeEnvironment");

describe("iOS Nix Xcode environment", () => {
  test("wraps the Expo bundle phase without changing its script twice", () => {
    const originalScript = `printf 'bundle:%s\\n' "$LT_NIX_MARKER"`;
    const bundle = { shellPath: "/bin/sh", shellScript: JSON.stringify(originalScript) };
    const project = {
      getFirstTarget: () => ({ uuid: "app" }),
      pbxNativeTargetSection: () => ({
        app: { buildPhases: [{ value: "bundle", comment: "Bundle React Native code and images" }] },
      }),
      hash: { project: { objects: { PBXShellScriptBuildPhase: { bundle } } } },
    };

    wrapBundlePhaseInNix(project);
    expect(bundle.shellPath).toBe("/bin/bash");
    const wrappedScript = JSON.parse(bundle.shellScript);
    expect(wrappedScript).toContain('source "$PODS_ROOT/../.xcode.env"');
    expect(wrappedScript).toContain("lt_run_in_nix bash -c '");

    wrapBundlePhaseInNix(project);
    expect(JSON.parse(bundle.shellScript)).toBe(wrappedScript);

    const directory = mkdtempSync(path.join(tmpdir(), "lt-xcode-bundle-"));
    try {
      const captureFile = path.join(directory, "bundle-script");
      mkdirSync(path.join(directory, "Pods"));
      writeFileSync(
        path.join(directory, ".xcode.env"),
        'lt_run_in_nix() { printf "%s" "$3" > "$LT_CAPTURE"; LT_NIX_MARKER=inside "$@"; }\n'
      );
      const result = spawnSync("/bin/bash", ["-c", wrappedScript], {
        encoding: "utf8",
        env: {
          ...process.env,
          PODS_ROOT: path.join(directory, "Pods"),
          LT_CAPTURE: captureFile,
        },
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toBe("bundle:inside\n");
      expect(readFileSync(captureFile, "utf8")).toBe(originalScript);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("replaces the old here-document wrapper during prebuild", () => {
    const originalScript = `printf 'updated:%s\\n' "$LT_NIX_MARKER"`;
    const oldScript = [
      "set -e",
      "# Run the Expo bundle phase in the iOS Nix shell.",
      'source "$PODS_ROOT/../.xcode.env"',
      'lt_run_in_nix bash -c "$(cat <<\'LT_NIX_XCODE_BUNDLE_SCRIPT\'',
      originalScript,
      "LT_NIX_XCODE_BUNDLE_SCRIPT",
      ')"',
    ].join("\n");
    const bundle = { shellPath: "/bin/bash", shellScript: JSON.stringify(oldScript) };
    const project = {
      getFirstTarget: () => ({ uuid: "app" }),
      pbxNativeTargetSection: () => ({
        app: { buildPhases: [{ value: "bundle", comment: "Bundle React Native code and images" }] },
      }),
      hash: { project: { objects: { PBXShellScriptBuildPhase: { bundle } } } },
    };

    wrapBundlePhaseInNix(project);
    const updatedScript = JSON.parse(bundle.shellScript);
    expect(updatedScript).not.toContain("cat <<");
    expect(updatedScript).toContain("lt_run_in_nix bash -c '");
    expect(updatedScript).toContain("updated:%s");
  });

  test("runs the build command in the current flake shell", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "lt-xcode-env-"));
    try {
      const envFile = path.join(directory, ".xcode.env");
      const argsFile = path.join(directory, "nix-args");
      const projectDir = path.join(directory, "project with spaces", "ios");
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(envFile, xcodeEnv);
      const result = spawnSync("/bin/bash", ["-c", `
        nix() {
          printf '%s\\n' "$@" > "$LT_NIX_ARGS"
          while [ "$1" != --command ]; do shift; done
          shift
          IN_NIX_SHELL=impure LT_NIX_MARKER=from-flake "$@"
        }
        export -f nix
        source "$LT_ENV_FILE"
        lt_run_in_nix bash -c 'printf "%s|%s\\n" "$LT_NIX_MARKER" "$NODE_BINARY"'
      `], {
        encoding: "utf8",
        env: {
          ...process.env,
          PROJECT_DIR: projectDir,
          LT_ENV_FILE: envFile,
          LT_NIX_ARGS: argsFile,
        },
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/from-flake\|.*\/node\n$/);
      expect(readFileSync(argsFile, "utf8").trim().split("\n")).toEqual([
        "develop",
        "--extra-experimental-features",
        "nix-command flakes",
        `${directory}/project with spaces#ios`,
        "--command",
        "bash",
        '-c',
        'printf "%s|%s\\n" "$LT_NIX_MARKER" "$NODE_BINARY"',
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("stops the build when Nix cannot load the shell", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "lt-xcode-env-"));
    try {
      const envFile = path.join(directory, ".xcode.env");
      writeFileSync(envFile, xcodeEnv);
      const result = spawnSync("/bin/bash", ["-c", `
        set -e
        nix() { return 42; }
        source "$LT_ENV_FILE"
        lt_run_in_nix bash -c true
        echo build-continued
      `], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_DIR: directory, LT_ENV_FILE: envFile },
      });

      expect(result.status).toBe(42);
      expect(result.stdout).not.toContain("build-continued");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
