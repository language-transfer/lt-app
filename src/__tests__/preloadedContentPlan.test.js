/* global test, expect */
const { planPreloadedTracks, renderPreloadedAssets } = require("@/scripts/preloaded-content-plan.cjs");

test("plans arbitrary course indices and emits static Metro imports", () => {
  const metadata = {
    lessons: [0, 1, 2].map((index) => ({
      variants: { lq: { object: `hash-${index}`, mimeType: "audio/mp4" } },
    })),
  };
  const tracks = planPreloadedTracks("spanish", [0, 2], metadata);
  expect(tracks.map(({ index, pointer }) => [index, pointer.object])).toEqual([
    [0, "hash-0"], [2, "hash-2"],
  ]);
  expect(renderPreloadedAssets(tracks)).toContain(
    '"spanish:2": require("./audio/spanish-2.m4a")'
  );
  expect(() => planPreloadedTracks("spanish", [3], metadata)).toThrow("Missing preloaded lesson 3");
  expect(() => planPreloadedTracks("spanish", [0, 0], metadata)).toThrow("Invalid preloaded lesson index");
});
