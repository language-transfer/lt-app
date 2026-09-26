import { createHash } from "node:crypto";
import { readFile, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "generated/preloaded-content");
const MAX_ANDROID_ASSET_BYTES = 8 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set(["m4a", "mp3", "mp4", "aac", "wav", "ogg"]);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const index = JSON.parse(
  await readFile(path.join(GENERATED_DIR, "metadata/all-courses.json"), "utf8")
);
const { courses, tracks } = JSON.parse(
  await readFile(path.join(GENERATED_DIR, "manifest.json"), "utf8")
);
const { maxIosAudioBytes } = JSON.parse(
  await readFile(path.join(ROOT, "scripts/preloaded-content.config.json"), "utf8")
);
assert(Number.isSafeInteger(maxIosAudioBytes) && maxIosAudioBytes > 0, "Invalid iOS audio budget");
const tempDir = await mkdtemp(path.join(tmpdir(), "lt-preloaded-check-"));

try {
  for (const platform of ["ios", "android"]) {
    const outDir = path.join(tempDir, platform);
    const result = spawnSync(
      path.join(ROOT, "node_modules/.bin/expo"),
      ["export", "--platform", platform, "--output-dir", outDir],
      {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, EXPO_NO_TELEMETRY: "1" },
        maxBuffer: 20 * 1024 * 1024,
      }
    );
    if (result.status !== 0) {
      throw new Error(`${platform} export failed:\n${result.stdout}\n${result.stderr}`);
    }

    const manifest = JSON.parse(await readFile(path.join(outDir, "metadata.json")));
    const { bundle, assets } = manifest.fileMetadata[platform];
    const bundleBytes = await readFile(path.join(outDir, bundle));
    const audioAssets = assets.filter(({ ext }) => AUDIO_EXTENSIONS.has(ext));

    for (const course of courses) {
      const entry = index.courses.find(({ id }) => id === course);
      assert(entry, `Missing indexed course ${course}`);
      const marker = entry.meta.object;
      assert(
        bundleBytes.includes(marker) === (platform === "ios"),
        `${platform} bundle has wrong metadata presence for ${entry.id}`
      );
    }

    if (platform === "ios") {
      const expectedAssets = new Map();
      for (const { course, index } of tracks) {
        const audio = await readFile(path.join(GENERATED_DIR, "audio", `${course}-${index}.m4a`));
        const assetHash = createHash("md5").update(audio).digest("hex");
        expectedAssets.set(assetHash, `${course} lesson ${index}`);
      }
      assert(audioAssets.length === expectedAssets.size, `Expected ${expectedAssets.size} iOS audio assets, found ${audioAssets.length}`);
      let totalAudioBytes = 0;
      for (const [assetHash, label] of expectedAssets) {
        const exported = audioAssets.find(({ path: assetPath }) => assetPath.endsWith(assetHash));
        assert(exported?.ext === "m4a", `Missing exported ${label}`);
        totalAudioBytes += (await stat(path.join(outDir, exported.path))).size;
      }
      assert(totalAudioBytes <= maxIosAudioBytes, `iOS audio grew to ${totalAudioBytes} bytes`);
      console.log(`iOS: ${tracks.length} preloaded lessons, ${(totalAudioBytes / 1048576).toFixed(1)} MiB audio`);
    } else {
      assert(audioAssets.length === 0, `Android contains ${audioAssets.length} audio assets`);
      const paths = new Set(assets.map((asset) => asset.path));
      let assetBytes = 0;
      for (const assetPath of paths) assetBytes += (await stat(path.join(outDir, assetPath))).size;
      assert(assetBytes <= MAX_ANDROID_ASSET_BYTES, `Android assets grew to ${assetBytes} bytes`);
      console.log(`Android: no preloaded audio or metadata, ${(assetBytes / 1048576).toFixed(1)} MiB assets`);
    }
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
