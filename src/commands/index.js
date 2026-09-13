/**
 * The command registry: one list of commands, read by both halves of the
 * template.
 *
 * The Worker dispatches interactions against this list and the command
 * registration script registers the same list with Discord. That is the whole
 * point of it being one module — two copies of a command definition drift, and
 * the failure is invisible from either side: Discord advertises a command the
 * Worker does not handle, or the Worker handles one Discord never registered.
 *
 * Because the registration script runs under plain Node, nothing in
 * `src/commands/` may import a `cloudflare:` module. A command handler receives
 * everything it needs — bindings, the execution context, the Discord REST
 * client — as arguments instead. `test/contracts/commands.test.js` enforces it.
 */

/**
 * A Discord application command definition, as sent to Discord's
 * bulk-overwrite registration endpoint.
 *
 * @see https://docs.discord.com/developers/interactions/application-commands#application-command-object
 * @typedef {object} CommandDefinition
 * @property {string} name Lowercase command name, as typed after the slash.
 * @property {string} description Shown in Discord's command picker.
 */

/**
 * Context handed to every command handler. Each field is injected rather than
 * imported so handlers stay testable without a network or a live Worker.
 *
 * @typedef {object} CommandContext
 * @property {object} env Worker bindings for the current environment.
 * @property {ExecutionContext} ctx The Worker execution context, for
 *   `waitUntil`.
 * @property {{ editOriginalResponse: Function }} rest Discord REST client from
 *   `src/discord/rest.js`.
 */

/**
 * A command: its definition and the handler that answers it.
 *
 * @typedef {object} Command
 * @property {CommandDefinition} definition What gets registered with Discord.
 * @property {(interaction: object, context: CommandContext) => Response | Promise<Response>} handler
 *   Returns the interaction response.
 */

/**
 * Every command this bot serves.
 *
 * Ships empty: a template that guesses at commands makes a downstream project
 * delete things before it can add its own. Append a `Command` here and the
 * Worker dispatches it and `npm run register:*` registers it, with no third
 * place to update.
 *
 * @type {Command[]}
 */
export const commands = [];
