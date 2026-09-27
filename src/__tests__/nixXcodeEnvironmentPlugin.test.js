/* global describe, test, expect */
const { spawnSync } = require("node:child_process");
const { mkdtempSync, writeFileSync, rmSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const {
  useBashForBundlePhase,
  xcodeEnv,
} = require("@/plugins/withNixXcodeEnvironment");

describe("iOS Nix Xcode environment", () => {
  test("runs the Expo bundle phase in Bash", () => {
    const bundle = { shellPath: "/bin/sh" };
    const project = {
      getFirstTarget: () => ({ uuid: "app" }),
      pbxNativeTargetSection: () => ({
        app: { buildPhases: [{ value: "bundle", comment: "Bundle React Native code and images" }] },
      }),
      hash: { project: { objects: { PBXShellScriptBuildPhase: { bundle } } } },
    };

    useBashForBundlePhase(project);
    expect(bundle.shellPath).toBe("/bin/bash");
  });

  test("loads the flake at build time and exports its Node", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "lt-xcode-env-"));
    try {
      const envFile = path.join(directory, ".xcode.env");
      const argsFile = path.join(directory, "nix-args");
      const projectDir = path.join(directory, "project with spaces", "ios");
      writeFileSync(envFile, xcodeEnv);
      const result = spawnSync("/bin/bash", ["-c", `
        nix() {
          printf '%s\\n' "$@" > "$LT_NIX_ARGS"
          printf '%s\\n' 'export LT_NIX_MARKER=from-flake'
        }
        source "$LT_ENV_FILE"
        printf '%s|%s\\n' "$LT_NIX_MARKER" "$NODE_BINARY"
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
        "print-dev-env",
        "--extra-experimental-features",
        "nix-command flakes",
        `${projectDir}/..#ios`,
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
        nix() { return 42; }
        source "$LT_ENV_FILE"
        echo build-continued
      `], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_DIR: directory, LT_ENV_FILE: envFile },
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Could not load the iOS Nix development environment.");
      expect(result.stdout).not.toContain("build-continued");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
