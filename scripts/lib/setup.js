/**
 * The logic half of project setup.
 *
 * `template-manifest.json` says *what* is template-only; this module says what
 * has to happen to it, and in which order. Nothing here touches the
 * filesystem: the planner is handed a manifest and a listing of the files that
 * exist, and returns a plan the CLI executes. That split is what makes a
 * destructive one-shot script testable — a plan that deletes the wrong thing
 * can be caught in a unit test rather than in somebody's new repository.
 *
 * Three rules shape the plan:
 *
 * - **Copy before delete.** The payload in `.template/` is written over its
 *   destinations first, so a path that is both pruned and replaced ends up
 *   holding the replacement rather than nothing.
 * - **Only what is present.** Every deletion is filtered against the listing,
 *   so re-running after a half-finished run plans the remaining work instead of
 *   failing on a file that is already gone.
 * - **The script goes last.** `selfDelete` operations are ordered after
 *   everything else, because a script that deletes itself first cannot finish.
 *
 * @see docs/using-this-template.md
 */

/** Regular-expression metacharacters, plus the one wildcard a glob may use. */
const GLOB_PATTERN = /[.*+?^${}()|[\]\\]/g;

/**
 * Compile a manifest glob.
 *
 * `*` matches within a single path segment and everything else is literal.
 * Deliberately not a full glob implementation: the manifest's globs exist to
 * sweep `.changeset/*.md`, and a pattern that could recurse is a pattern that
 * could delete a directory nobody listed.
 *
 * @param {string} glob
 * @returns {RegExp}
 */
const globToRegExp = (glob) =>
  new RegExp(
    `^${glob.replace(GLOB_PATTERN, (character) =>
      character === "*" ? "[^/]*" : `\\${character}`)}$`,
  );

/**
 * Resolve the manifest's globs against the files that exist.
 *
 * @param {string[]} globs From `pruneGlobs`.
 * @param {string[]} files Repository-relative paths, as `git ls-files` lists them.
 * @returns {string[]} The matching files, in listing order.
 */
export const resolvePruneGlobs = (globs, files) => {
  const patterns = globs.map(globToRegExp);

  return files.filter((file) => patterns.some((pattern) => pattern.test(file)));
};

/** What `planInstructionFiles` accepts, quoted back when it gets something else. */
const INSTRUCTION_MODES = ["swap", "delete", "keep"];

/**
 * Decide what happens to the six AI instruction files.
 *
 * The template ships three maintainer files and three `-for-users`
 * counterparts. A project keeps one set:
 *
 * - `swap` moves each counterpart over its maintainer file, which is the
 *   three `mv` commands `docs/using-ai.md` asks a reader to run by hand.
 * - `delete` removes all six, for a project that does not use AI tooling.
 * - `keep` leaves them, for a fork that is still a template.
 *
 * A repository where the swap already happened plans nothing rather than
 * failing, so an interrupted run is safe to repeat.
 *
 * @param {object} request
 * @param {Array<{ maintainer: string, downstream: string }>} request.instructionFiles
 * @param {string[]} request.files
 * @param {"swap" | "delete" | "keep"} request.mode
 * @returns {Array<Record<string, unknown>>} Move or delete operations.
 * @throws {Error} On an unrecognized mode. Guessing here would either destroy
 *   the guidance a project wanted or leave the template's own in place.
 */
export const planInstructionFiles = ({ instructionFiles, files, mode }) => {
  const present = new Set(files);

  if (mode === "keep") {
    return [];
  }

  if (mode === "swap") {
    return instructionFiles
      .filter(({ downstream }) => present.has(downstream))
      .map(({ maintainer, downstream }) => ({
        kind: "move",
        from: downstream,
        to: maintainer,
        overwrite: present.has(maintainer),
      }));
  }

  if (mode === "delete") {
    return instructionFiles
      .flatMap(({ maintainer, downstream }) => [maintainer, downstream])
      .filter((path) => present.has(path))
      .map((path) => ({ kind: "delete", path, reason: "instruction-files" }));
  }

  throw new Error(`Unrecognized instruction-file mode ${mode} — expected one of `
    + INSTRUCTION_MODES.join(", "));
};

/**
 * Turn the manifest into an ordered list of operations.
 *
 * @param {object} request
 * @param {Record<string, any>} request.manifest The parsed `template-manifest.json`.
 * @param {string[]} request.files Repository-relative paths that exist.
 * @param {"swap" | "delete" | "keep"} [request.instructionMode] Defaults to `swap`.
 * @returns {Array<Record<string, unknown>>} `copy`, `move`, `delete`,
 *   `delete-directory`, and `remove-package-script` operations, in the order
 *   they must be applied.
 */
export const planSetup = ({ manifest, files, instructionMode = "swap" }) => {
  const present = new Set(files);
  // A destination the payload writes to is replaced, never deleted, however
  // many of the manifest's lists happen to name it.
  const replaced = new Set(manifest.copy.map((entry) => entry.to));
  const queued = new Set();
  const operations = manifest.copy.map(({ from, to }) => ({
    kind: "copy",
    from,
    to,
    overwrite: present.has(to),
  }));

  operations.push(...planInstructionFiles({
    instructionFiles: manifest.instructionFiles,
    files,
    mode: instructionMode,
  }));

  /**
   * Queue one deletion, unless it is absent, already queued, or replaced.
   *
   * @param {string} path
   * @param {string} reason Which manifest list reached it, for the printed plan.
   * @returns {void}
   */
  const queueDelete = (path, reason) => {
    if (!present.has(path) || queued.has(path) || replaced.has(path)) {
      return;
    }

    queued.add(path);
    operations.push({ kind: "delete", path, reason });
  };

  for (const path of manifest.prune) {
    queueDelete(path, "prune");
  }

  for (const path of resolvePruneGlobs(manifest.pruneGlobs, files)) {
    queueDelete(path, "prune-glob");
  }

  for (const directory of manifest.pruneDirectories) {
    const contents = files.filter((file) => file.startsWith(`${directory}/`));

    for (const path of contents) {
      queueDelete(path, "prune-directory");
    }

    if (contents.length > 0) {
      operations.push({ kind: "delete-directory", path: directory });
    }
  }

  for (const path of manifest.selfDelete.paths) {
    queueDelete(path, "self-delete");
  }

  for (const name of manifest.selfDelete.packageScripts) {
    operations.push({ kind: "remove-package-script", name });
  }

  return operations;
};
