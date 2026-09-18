import { describe, expect, it } from "vitest";
import {
  planInstructionFiles,
  planSetup,
  resolvePruneGlobs,
} from "../../scripts/lib/setup.js";

/**
 * A manifest small enough to reason about, shaped exactly like
 * `template-manifest.json`. The planner is given a manifest and a file
 * listing rather than a repository, so every case here is a pure value in and
 * a pure value out — `test/contracts/manifest.template-only.test.js` is what
 * runs the planner against the real manifest and the real checkout.
 */
const manifest = {
  instructionFiles: [
    { maintainer: "claude.md", downstream: "claude-for-users.md" },
    { maintainer: "AGENTS.md", downstream: "AGENTS-for-users.md" },
  ],
  copy: [
    { from: ".template/README.md", to: "README.md" },
    { from: ".template/CHANGELOG.md", to: "CHANGELOG.md" },
  ],
  prune: ["CONTRIBUTING.md", "CHANGELOG.md", "template-manifest.json"],
  pruneGlobs: [".changeset/*.md"],
  pruneDirectories: [".template"],
  selfDelete: {
    paths: ["scripts/setup.js", "scripts/lib/setup.js"],
    packageScripts: ["setup"],
  },
};

/** Everything the sample manifest talks about, as a checkout would list it. */
const files = [
  ".changeset/config.json",
  ".changeset/one.md",
  ".changeset/two.md",
  ".template/CHANGELOG.md",
  ".template/README.md",
  "AGENTS-for-users.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "README.md",
  "claude-for-users.md",
  "claude.md",
  "scripts/lib/setup.js",
  "scripts/setup.js",
  "template-manifest.json",
];

/**
 * The paths a plan deletes, in plan order.
 *
 * @param {Array<Record<string, unknown>>} plan
 * @returns {string[]}
 */
const deleted = (plan) =>
  plan.filter((operation) => operation.kind === "delete").map((operation) => operation.path);

describe("resolvePruneGlobs", () => {
  it("expands a glob against the files that are actually present", () => {
    expect(resolvePruneGlobs([".changeset/*.md"], files)).toEqual([
      ".changeset/one.md",
      ".changeset/two.md",
    ]);
  });

  it("keeps a wildcard inside one path segment", () => {
    // `.changeset/*.md` must not reach a nested file: a glob that quietly
    // recursed would delete things the manifest never named.
    expect(resolvePruneGlobs([".changeset/*.md"], [".changeset/nested/deep.md"])).toEqual([]);
  });

  it("treats the rest of a glob as literal text", () => {
    // The `.` is a regular expression metacharacter; if it leaked through
    // unescaped, `.changeset/*.md` would also match `.changeset/xxmd`.
    expect(resolvePruneGlobs([".changeset/*.md"], [".changeset/oneXmd"])).toEqual([]);
  });

  it("resolves nothing when no glob is declared", () => {
    expect(resolvePruneGlobs([], files)).toEqual([]);
  });
});

describe("planInstructionFiles", () => {
  it("swaps each downstream counterpart over its maintainer file", () => {
    expect(
      planInstructionFiles({
        instructionFiles: manifest.instructionFiles,
        files,
        mode: "swap",
      }),
    ).toEqual([
      { kind: "move", from: "claude-for-users.md", to: "claude.md", overwrite: true },
      { kind: "move", from: "AGENTS-for-users.md", to: "AGENTS.md", overwrite: true },
    ]);
  });

  it("moves rather than overwrites when the maintainer file is already gone", () => {
    expect(
      planInstructionFiles({
        instructionFiles: manifest.instructionFiles,
        files: ["claude-for-users.md", "AGENTS-for-users.md"],
        mode: "swap",
      }),
    ).toEqual([
      { kind: "move", from: "claude-for-users.md", to: "claude.md", overwrite: false },
      { kind: "move", from: "AGENTS-for-users.md", to: "AGENTS.md", overwrite: false },
    ]);
  });

  it("does nothing when the swap already happened", () => {
    // A half-failed setup run must be safe to re-run, so a repository that
    // already carries only the maintainer names is a no-op rather than an
    // error.
    expect(
      planInstructionFiles({
        instructionFiles: manifest.instructionFiles,
        files: ["claude.md", "AGENTS.md"],
        mode: "swap",
      }),
    ).toEqual([]);
  });

  it("deletes every instruction file that is present", () => {
    expect(
      planInstructionFiles({
        instructionFiles: manifest.instructionFiles,
        files: ["claude.md", "claude-for-users.md", "AGENTS.md"],
        mode: "delete",
      }),
    ).toEqual([
      { kind: "delete", path: "claude.md", reason: "instruction-files" },
      { kind: "delete", path: "claude-for-users.md", reason: "instruction-files" },
      { kind: "delete", path: "AGENTS.md", reason: "instruction-files" },
    ]);
  });

  it("leaves the instruction files alone on request", () => {
    expect(
      planInstructionFiles({ instructionFiles: manifest.instructionFiles, files, mode: "keep" }),
    ).toEqual([]);
  });

  it("refuses an unrecognized mode rather than guessing one", () => {
    expect(() =>
      planInstructionFiles({ instructionFiles: manifest.instructionFiles, files, mode: "swp" }),
    ).toThrow(/swap|delete|keep/);
  });
});

describe("planSetup", () => {
  it("copies the payload before anything is deleted", () => {
    const plan = planSetup({ manifest, files });
    const lastCopy = plan.findLastIndex((operation) => operation.kind === "copy");
    const firstDelete = plan.findIndex((operation) => operation.kind.startsWith("delete"));

    expect(lastCopy).toBeGreaterThanOrEqual(0);
    expect(firstDelete).toBeGreaterThan(lastCopy);
  });

  it("records whether each copy overwrites a file that is already there", () => {
    const plan = planSetup({ manifest, files: [".template/README.md", ".template/CHANGELOG.md"] });

    expect(plan.filter((operation) => operation.kind === "copy")).toEqual([
      { kind: "copy", from: ".template/README.md", to: "README.md", overwrite: false },
      { kind: "copy", from: ".template/CHANGELOG.md", to: "CHANGELOG.md", overwrite: false },
    ]);
  });

  it("replaces a pruned path that a copy writes to, rather than deleting it", () => {
    // CHANGELOG.md is on both lists: the template's history does not survive,
    // but the payload writes a fresh one over it. Deleting it after the copy
    // would throw the replacement away.
    const plan = planSetup({ manifest, files });

    expect(deleted(plan)).not.toContain("CHANGELOG.md");
    expect(plan).toContainEqual({
      kind: "copy",
      from: ".template/CHANGELOG.md",
      to: "CHANGELOG.md",
      overwrite: true,
    });
  });

  it("skips a pruned path that is not present", () => {
    const plan = planSetup({ manifest, files: files.filter((file) => file !== "CONTRIBUTING.md") });

    expect(deleted(plan)).not.toContain("CONTRIBUTING.md");
  });

  it("deletes each path once, whichever list reached it first", () => {
    const overlapping = {
      ...manifest,
      prune: [...manifest.prune, ".changeset/one.md"],
    };
    const plan = planSetup({ manifest: overlapping, files });

    expect(deleted(plan).filter((path) => path === ".changeset/one.md")).toHaveLength(1);
  });

  it("empties a pruned directory before removing it", () => {
    const plan = planSetup({ manifest, files });
    const removal = plan.findIndex(
      (operation) => operation.kind === "delete-directory" && operation.path === ".template",
    );

    expect(removal).toBeGreaterThan(plan.findIndex((o) => o.path === ".template/README.md"));
    expect(plan.filter((operation) => operation.kind === "delete-directory")).toEqual([
      { kind: "delete-directory", path: ".template" },
    ]);
  });

  it("does not remove a directory that is not there", () => {
    const plan = planSetup({
      manifest,
      files: files.filter((file) => !file.startsWith(".template/")),
    });

    expect(plan.filter((operation) => operation.kind === "delete-directory")).toEqual([]);
  });

  it("leaves the changeset configuration alone while pruning the changesets", () => {
    const plan = planSetup({ manifest, files });

    expect(deleted(plan)).toContain(".changeset/one.md");
    expect(deleted(plan)).toContain(".changeset/two.md");
    expect(deleted(plan)).not.toContain(".changeset/config.json");
  });

  it("puts the setup script's own removal last", () => {
    const plan = planSetup({ manifest, files });
    const selfDeletes = [
      plan.findIndex((operation) => operation.path === "scripts/lib/setup.js"),
      plan.findIndex((operation) => operation.kind === "remove-package-script"),
    ];
    const others = plan
      .map((operation, index) => ({ operation, index }))
      .filter(({ operation }) => !manifest.selfDelete.paths.includes(operation.path))
      .filter(({ operation }) => operation.kind !== "remove-package-script")
      .map(({ index }) => index);

    for (const index of selfDeletes) {
      expect(index).toBeGreaterThan(Math.max(...others));
    }

    expect(plan.at(-1)).toEqual({ kind: "remove-package-script", name: "setup" });
  });

  it("swaps the instruction files by default, and honours an explicit mode", () => {
    expect(planSetup({ manifest, files })).toContainEqual({
      kind: "move",
      from: "claude-for-users.md",
      to: "claude.md",
      overwrite: true,
    });

    expect(
      planSetup({ manifest, files, instructionMode: "keep" }).some(
        (operation) => operation.kind === "move",
      ),
    ).toBe(false);
  });

  it("plans the same operations when the plan has already been applied once", () => {
    // Idempotence at the planning layer: given the tree setup would leave
    // behind, there is nothing left to do but the copies, which overwrite.
    const applied = [
      ".changeset/config.json",
      "AGENTS.md",
      "CHANGELOG.md",
      "README.md",
      "claude.md",
    ];
    const plan = planSetup({ manifest, files: applied });

    expect(deleted(plan)).toEqual([]);
    expect(plan.filter((operation) => operation.kind === "delete-directory")).toEqual([]);
    expect(plan.filter((operation) => operation.kind === "move")).toEqual([]);
  });
});
