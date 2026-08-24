import { commands } from "./command-definitions.js";
import { verifyDiscordRequest } from "./discord-signature.js";

/**
 * Discord interaction type values this template handles.
 * Add new cases to the `fetch` handler below as more interaction types are supported.
 *
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type
 */
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
};

/**
 * Discord interaction response type values this template sends.
 *
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
 */
export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
};

/**
 * Discord bot Worker entry point.
 *
 * Serves as the Discord Interactions Endpoint URL: Discord always sends
 * interactions as POST requests, so any other method is treated as a
 * non-Discord request (e.g. an uptime check) and gets a basic health response.
 *
 * Bindings (see `.dev.vars.example` and `docs/using-this-template.md`):
 *   - `DISCORD_PUBLIC_KEY` {string} - hex-encoded Ed25519 public key used to verify
 *     that incoming interaction requests actually came from Discord.
 */
export default {
  /**
   * @param {Request} request
   * @param {{ DISCORD_PUBLIC_KEY: string }} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const { isValid, body } = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return new Response("Invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const command = commands.find((candidate) => candidate.name === interaction.data.name);
      const content = command ? command.respond(interaction) : "Unknown command.";

      return Response.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content },
      });
    }

    return new Response("Unhandled interaction type", { status: 400 });
  },
};
