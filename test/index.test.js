import { env, exports } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker, { InteractionResponseType, InteractionType } from "../src/index.js";
import { createSignedInteractionRequest, generateTestKeyPair } from "./helpers/discord-fixtures.js";

describe("Worker", () => {
  it("returns a healthy response for non-POST requests", async () => {
    const response = await exports.default.fetch("https://example.com/health");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });

  it("rejects interaction requests with an invalid signature", async () => {
    const { publicKeyHex } = await generateTestKeyPair();
    const { privateKey: wrongPrivateKey } = await generateTestKeyPair();
    const request = await createSignedInteractionRequest(wrongPrivateKey, {
      type: InteractionType.PING,
    });
    const testEnv = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, testEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(401);
  });

  it("responds to Discord's PING with PONG", async () => {
    const { privateKey, publicKeyHex } = await generateTestKeyPair();
    const request = await createSignedInteractionRequest(privateKey, {
      type: InteractionType.PING,
    });
    const testEnv = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, testEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: InteractionResponseType.PONG });
  });

  it("dispatches the /ping application command to its shared definition", async () => {
    const { privateKey, publicKeyHex } = await generateTestKeyPair();
    const interaction = {
      type: InteractionType.APPLICATION_COMMAND,
      data: { id: "1", name: "ping" },
    };
    const request = await createSignedInteractionRequest(privateKey, interaction);
    const testEnv = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, testEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "pong" },
    });
  });

  it("responds with a fallback message for an unrecognized command name", async () => {
    const { privateKey, publicKeyHex } = await generateTestKeyPair();
    const interaction = {
      type: InteractionType.APPLICATION_COMMAND,
      data: { id: "2", name: "not-a-real-command" },
    };
    const request = await createSignedInteractionRequest(privateKey, interaction);
    const testEnv = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, testEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Unknown command." },
    });
  });
});
