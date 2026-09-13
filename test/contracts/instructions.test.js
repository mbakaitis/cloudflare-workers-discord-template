import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const maintainerPaths = [
  new URL("../../claude.md", import.meta.url),
  new URL("../../AGENTS.md", import.meta.url),
  new URL("../../.github/copilot-instructions.md", import.meta.url),
];
const downstreamPaths = [
  new URL("../../claude-for-users.md", import.meta.url),
  new URL("../../AGENTS-for-users.md", import.meta.url),
  new URL("../../.github/copilot-instructions-for-users.md", import.meta.url),
];

const versionDeclaration = /^\*\*Instruction contract version:\*\*\s*(\S+)\s*$/m;

/**
 * Extract the declared instruction contract version from an instruction file.
 *
 * @param {URL} path Instruction file to read.
 * @returns {Promise<string | null>} The declared version, or `null` when the
 *   file declares none.
 */
async function readDeclaredVersion(path) {
  const contents = await readFile(path, "utf8");

  return versionDeclaration.exec(contents)?.[1] ?? null;
}

describe("instruction contract version", () => {
  it("declares a Semantic Version in every maintainer instruction file", async () => {
    for (const path of maintainerPaths) {
      const version = await readDeclaredVersion(path);

      assert.match(
        version ?? "",
        /^\d+\.\d+\.\d+$/,
        `${path.pathname} must declare a SemVer instruction contract version`,
      );
    }
  });

  it("keeps the declared version identical across maintainer files", async () => {
    const versions = await Promise.all(
      maintainerPaths.map((path) => readDeclaredVersion(path)),
    );

    assert.equal(
      new Set(versions).size,
      1,
      `maintainer instruction files disagree: ${versions.join(", ")}`,
    );
  });

  it("leaves the downstream instruction files unversioned", async () => {
    for (const path of downstreamPaths) {
      assert.equal(
        await readDeclaredVersion(path),
        null,
        `${path.pathname} must not declare an instruction contract version`,
      );
    }
  });
});
