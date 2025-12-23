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
