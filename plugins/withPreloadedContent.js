const { withXcodeProject } = require("@expo/config-plugins");

const PHASE_NAME = "Prepare Preloaded Content";
const BUNDLE_PHASE_NAME = "Bundle React Native code and images";

function addPreloadedContentPhase(project) {
  const target = project.getFirstTarget().uuid;
  const phases = project.pbxNativeTargetSection()[target].buildPhases;
  const script = [
    "set -e",
    'cd "$PROJECT_DIR/.."',
    'if [ -f "$PROJECT_DIR/../ios/.xcode.env" ]; then',
    '  . "$PROJECT_DIR/../ios/.xcode.env"',
    "fi",
    '"${NODE_BINARY:-node}" scripts/prepare-preloaded-content.mjs',
    '"${NODE_BINARY:-node}" scripts/check-preloaded-content.mjs',
  ].join("\n");
  const existing = phases.find((phase) => phase.comment === PHASE_NAME);
  if (existing) {
    const buildPhase =
      project.hash.project.objects.PBXShellScriptBuildPhase?.[existing.value];
    if (!buildPhase) throw new Error(`Could not find ${PHASE_NAME} build phase`);
    buildPhase.shellScript = '"' + script.replace(/"/g, '\\"') + '"';
    return project;
  }

  const bundleIndex = phases.findIndex(
    (phase) => phase.comment === BUNDLE_PHASE_NAME
  );
  if (bundleIndex < 0) {
    throw new Error(`Could not find ${BUNDLE_PHASE_NAME} build phase`);
  }
  const result = project.addBuildPhase(
    [],
    "PBXShellScriptBuildPhase",
    PHASE_NAME,
    target,
    { shellPath: "/bin/sh", shellScript: script }
  );
  const newIndex = phases.findIndex((phase) => phase.value === result.uuid);
  const [newPhase] = phases.splice(newIndex, 1);
  phases.splice(bundleIndex, 0, newPhase);
  return project;
}

module.exports = function withPreloadedContent(config) {
  return withXcodeProject(config, (config) => {
    config.modResults = addPreloadedContentPhase(config.modResults);
    return config;
  });
};

module.exports.addPreloadedContentPhase = addPreloadedContentPhase;
