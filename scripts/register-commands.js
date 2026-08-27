#!/usr/bin/env node
/**
 * Registers this template's slash commands with Discord.
 *
 * Reads `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, and optionally `DISCORD_GUILD_ID`
 * from the environment (populated locally via `node --env-file=.dev.vars`) and issues
 * a `PUT` bulk-overwrite request against Discord's REST API, importing the same
 * `src/command-definitions.js` module the Worker dispatches against so the two can
 * never drift out of sync. Bulk-overwrite creates, updates, and prunes commands to
 * exactly match the repo's definitions in one call.
 *
 * This is a standalone Node.js script, not part of the deployed Worker — command
 * registration is a one-off or per-change operation, run from a developer's machine
 * or CI, never from the `fetch` handler.
 *
 * Usage:
 *   npm run register        # global by default, or guild-scoped if DISCORD_GUILD_ID is set
 *   npm run register:guild  # explicit guild-scoped registration; fails if DISCORD_GUILD_ID is unset
 *
 * @see https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
 */

import { fileURLToPath } from "node:url";
import { commands } from "../src/command-definitions.js";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Builds the Discord bulk-overwrite URL for either global or guild-scoped commands.
 *
 * @param {string} applicationId
 * @param {string} [guildId] - When set, targets guild-scoped commands instead of global ones.
 * @returns {string}
 */
export function buildRegistrationUrl(applicationId, guildId) {
  return guildId
    ? `${DISCORD_API_BASE}/applications/${applicationId}/guilds/${guildId}/commands`
    : `${DISCORD_API_BASE}/applications/${applicationId}/commands`;
}

/**
 * Builds the bulk-overwrite request payload from the shared command definitions,
 * stripping the Worker-only `respond` handler, which is not part of Discord's schema.
 *
 * @returns {Array<{ name: string, description: string }>}
 */
export function buildCommandPayload() {
  return commands.map(({ name, description }) => ({ name, description }));
}

/**
 * Resolves which guild, if any, to register commands against.
 *
 * `--guild` (or `register:guild`) requires `DISCORD_GUILD_ID` to be set and throws
 * otherwise, so a developer who intends guild-scoped registration gets a clear error
 * instead of silently falling back to global. Without the flag, a set `DISCORD_GUILD_ID`
 * still wins over global, per Stage 2's documented default.
 *
 * @param {{ guildFlag: boolean, discordGuildId: string | undefined }} options
 * @returns {string | undefined}
 */
export function resolveGuildId({ guildFlag, discordGuildId }) {
  if (guildFlag && !discordGuildId) {
    throw new Error("DISCORD_GUILD_ID must be set to use --guild.");
  }

  return discordGuildId || undefined;
}

/**
 * Issues the bulk-overwrite request against Discord's REST API.
 *
 * @param {{ applicationId: string, token: string, guildId?: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<{ ok: boolean, status: number, body: unknown }>}
 */
export async function registerCommands({ applicationId, token, guildId, fetchImpl = fetch }) {
  const response = await fetchImpl(buildRegistrationUrl(applicationId, guildId), {
    method: "PUT",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildCommandPayload()),
  });
  const body = await response.json().catch(() => undefined);

  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const { DISCORD_TOKEN, DISCORD_APPLICATION_ID, DISCORD_GUILD_ID } = process.env;
  const guildFlag = process.argv.includes("--guild");

  if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
    console.error("DISCORD_TOKEN and DISCORD_APPLICATION_ID must be set — see .dev.vars.example.");
    process.exitCode = 1;
    return;
  }

  let guildId;
  try {
    guildId = resolveGuildId({ guildFlag, discordGuildId: DISCORD_GUILD_ID });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const result = await registerCommands({ applicationId: DISCORD_APPLICATION_ID, token: DISCORD_TOKEN, guildId });

  if (!result.ok) {
    console.error(`Discord API returned ${result.status}:`, result.body);
    process.exitCode = 1;
    return;
  }

  console.log(`Registered ${commands.length} command(s) ${guildId ? `to guild ${guildId}` : "globally"}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
