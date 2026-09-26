import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { planPreloadedTracks, renderPreloadedAssets } from "./preloaded-content-plan.cjs";

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "generated/preloaded-content");
const INDEX_URL = "https://downloads.languagetransfer.org/all-courses.json";
const { courses: SELECTION } = JSON.parse(
  await readFile(path.join(ROOT, "scripts/preloaded-content.config.json"), "utf8")
);
const COURSES = Object.keys(SELECTION);

const fetchBytes = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const verifyObject = (bytes, pointer) => {
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== pointer.filesize || digest !== pointer.object) {
    throw new Error(`CAS object ${pointer.object} failed size/hash verification`);
  }
};

const indexBytes = await fetchBytes(INDEX_URL);
const index = JSON.parse(indexBytes.toString("utf8"));
if (index.buildVersion !== 2 || !index.casBaseURL) {
  throw new Error("Unexpected course-index format");
}

await rm(GENERATED_DIR, { recursive: true, force: true });
await mkdir(path.join(GENERATED_DIR, "metadata"), { recursive: true });
await mkdir(path.join(GENERATED_DIR, "audio"), { recursive: true });
const tracks = [];

for (const course of COURSES) {
  const entry = index.courses.find((item) => item.id === course);
  if (!entry) throw new Error(`Missing course ${course} in remote index`);

  const metaBytes = await fetchBytes(`${index.casBaseURL}/${entry.meta.object}`);
  verifyObject(metaBytes, entry.meta);
  const metadata = JSON.parse(metaBytes.toString("utf8"));
  if (metadata.buildVersion !== 2 || metadata.lessons.length !== entry.lessons) {
    throw new Error(`Unexpected metadata for ${course}`);
  }
  await writeFile(path.join(GENERATED_DIR, "metadata", `${course}.json`), metaBytes);
  for (const track of planPreloadedTracks(course, SELECTION[course], metadata)) {
    const audioBytes = await fetchBytes(`${index.casBaseURL}/${track.pointer.object}`);
    verifyObject(audioBytes, track.pointer);
    await writeFile(
      path.join(GENERATED_DIR, "audio", `${course}-${track.index}.m4a`),
      audioBytes
    );
    tracks.push({ course, index: track.index });
  }
}

await writeFile(path.join(GENERATED_DIR, "metadata", "all-courses.json"), indexBytes);
await writeFile(
  path.join(GENERATED_DIR, "assets.js"),
  renderPreloadedAssets(tracks)
);
await writeFile(
  path.join(GENERATED_DIR, "manifest.json"),
  JSON.stringify({ courses: COURSES, tracks })
);
console.log(`Prepared ${tracks.length} preloaded lessons for ${COURSES.length} courses`);
