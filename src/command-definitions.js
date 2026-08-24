/**
 * Shared Discord slash-command definitions.
 *
 * This is the one place to add, rename, or remove a command: the Worker's
 * interaction dispatch (`src/index.js`) and the registration script
 * (`scripts/register-commands.js`) both import this module, so a command's
 * name, description, and behavior can never drift out of sync between what's
 * registered with Discord and what the Worker actually handles.
 *
 * @typedef {object} CommandDefinition
 * @property {string} name - Slash command name, as registered with Discord (lowercase, no spaces).
 * @property {string} description - Shown to users in Discord's command picker.
 * @property {(interaction: object) => string} respond - Builds the reply content for an invocation of this command.
 */

/** @type {CommandDefinition[]} */
export const commands = [
  {
    name: "ping",
    description: "Replies with pong.",
    respond: () => "pong",
  },
];
