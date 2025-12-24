import { Directory, Paths } from "expo-file-system";
import RNFS from "react-native-fs";

export const migratePreference = (
  key: string,
  val: string
):
  | {
      changed: false;
    }
  | {
      changed: true;
      updated: string;
    } => {
  let returned: { changed: false } | { changed: true; updated: string } = {
    changed: false,
  };

  if (key === "stream-quality" || key === "download-quality") {
    try {
      // old versions of the app used 'low' and 'high' directly; now we want '"low"' and '"high"'
      // so that we can always parse
      JSON.parse(val);
    } catch {
      returned = { changed: true, updated: JSON.stringify(val) };
    }
  }

  return returned;
};

// We decided it wasn't practical to try to migrate old pre-2025 downloads;
//   we'll delete them when the app updates so that at least they don't take up space.
// This way, we don't need to manage multiple codepaths, and the new downloads are in
//   a better container format, which is nice.
export const clearOldDownloadLocations = async (): Promise<void> => {
  const courseNamesPre2025 = [
    "spanish",
    "arabic",
    "turkish",
    "german",
    "greek",
    "italian",
    "swahili",
    "french",
    "ingles",
    "music",
  ];

  const possibleRootDirs = [
    Paths.document, // probably not. I think background-downloader went in the external (public) document storage.
    // possibly on purpose! why not let you peek at the MP3s? but now they're long useless object names :/
    `file:///${RNFS.ExternalDirectoryPath}`,
  ];

  for (const dir of possibleRootDirs) {
    for (const course of courseNamesPre2025) {
      // We used to just put files in `<documents>/spanish/spanish-meta.json`, `<documents>/spanish/spanish3-hq.mp3`, etc.
      // Now that we use `<documents>/objects` and `<documents>/staging` for all downloaded files, we can safely delete these.
      // Don't reuse them in the future..!
      //  (this probably doesn't delete in-progress downloads. not sure.)
      const courseDir = new Directory(dir, course);
      if (courseDir.exists) {
        // this is recursive!
        console.warn(
          `Deleting old download directory for course ${course} at ${courseDir.uri}`
        );
        courseDir.delete();
      }
    }
  }
};
