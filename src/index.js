/**
 * Worker entry point: a router and nothing else.
 *
 * Keeping this file free of interaction logic is deliberate. It routes, and the
 * modules under `src/discord/` decide what a response looks like, so the one
 * security-critical decision — verify before parsing — lives in exactly one
 * place and is tested there.
 */
import { pong } from "./discord/responses.js";
import { verifyInteractionRequest } from "./discord/verify.js";

/** Interaction types this Worker handles. */
const InteractionType = {
  /** Discord's endpoint-validation and keep-alive probe. */
  PING: 1,
};

/**
 * Serve a Discord interaction.
 *
 * Verification comes first and fails closed: a request without a valid
 * signature gets a `401` and its body is never parsed, because the body of an
 * unverified request is attacker-controlled input.
 *
 * Nothing here logs the interaction payload. Payloads carry user content and
 * interaction tokens are short-lived credentials that can post as the bot, and
 * observability is enabled on this Worker, so a log line would be a durable
 * record of both.
 *
 * @param {Request} request
 * @param {object} env Worker bindings.
 * @param {string} [env.DISCORD_PUBLIC_KEY] Hex-encoded Discord application
 *   public key for this environment.
 * @returns {Promise<Response>}
 */
const handleInteraction = async (request, env) => {
  const { valid, rawBody } = await verifyInteractionRequest(request, env.DISCORD_PUBLIC_KEY);

  if (!valid) {
    return new Response("invalid request signature", { status: 401 });
  }

  let interaction;
  try {
    interaction = JSON.parse(rawBody);
  } catch {
    // The signature checked out, so this is a malformed payload rather than a
    // forgery. Report the shape problem without echoing the body back.
    return new Response("invalid interaction payload", { status: 400 });
  }

  if (interaction.type === InteractionType.PING) {
    return pong();
  }

  // PING is the only type this Worker serves so far. Answer deliberately
  // rather than falling through, and say nothing about the payload.
  return new Response("unsupported interaction type", { status: 400 });
};

export default {
  /**
   * Route incoming requests.
   *
   * @param {Request} request
   * @param {object} env Worker bindings. Document each binding you add here:
   *   this project is plain JavaScript with JSDoc and generates no TypeScript
   *   binding types.
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/") {
      return new Response("OK");
    }

    if (pathname === "/interactions") {
      if (request.method !== "POST") {
        return new Response("method not allowed", {
          status: 405,
          headers: { allow: "POST" },
        });
      }

      return handleInteraction(request, env);
    }

    return new Response("not found", { status: 404 });
  },
};
