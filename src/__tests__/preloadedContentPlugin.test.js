/* global describe, test, jest, expect */
const { addPreloadedContentPhase } = require("@/plugins/withPreloadedContent");

describe("iOS preloaded-content build phase", () => {
  test("runs before JavaScript bundling and is added only once", () => {
    const phases = [
      { value: "sources", comment: "Sources" },
      { value: "bundle", comment: "Bundle React Native code and images" },
    ];
    const shellPhases = {};
    const addBuildPhase = jest.fn(
      (_files, _type, comment, _target, options) => {
        phases.push({ value: "prepare", comment });
        shellPhases.prepare = { shellScript: options.shellScript };
        expect(options.shellScript).toContain("prepare-preloaded-content.mjs");
        expect(options.shellScript).toContain("check-preloaded-content.mjs");
        return { uuid: "prepare" };
      }
    );
    const project = {
      getFirstTarget: () => ({ uuid: "app" }),
      pbxNativeTargetSection: () => ({ app: { buildPhases: phases } }),
      hash: { project: { objects: { PBXShellScriptBuildPhase: shellPhases } } },
      addBuildPhase,
    };

    addPreloadedContentPhase(project);
    addPreloadedContentPhase(project);
    expect(phases.map(({ comment }) => comment)).toEqual([
      "Sources",
      "Prepare Preloaded Content",
      "Bundle React Native code and images",
    ]);
    expect(addBuildPhase).toHaveBeenCalledTimes(1);
  });

  test("updates the script in an existing native project", () => {
    const shellPhases = { prepare: { shellScript: '"old preparation"' } };
    const project = {
      getFirstTarget: () => ({ uuid: "app" }),
      pbxNativeTargetSection: () => ({
        app: { buildPhases: [{ value: "prepare", comment: "Prepare Preloaded Content" }] },
      }),
      hash: { project: { objects: { PBXShellScriptBuildPhase: shellPhases } } },
      addBuildPhase: jest.fn(),
    };

    addPreloadedContentPhase(project);
    expect(shellPhases.prepare.shellScript).toContain("check-preloaded-content.mjs");
    expect(project.addBuildPhase).not.toHaveBeenCalled();
  });
});
