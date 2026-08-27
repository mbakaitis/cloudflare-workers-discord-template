import { describe, expect, it } from "vitest";
import { verifyDiscordRequest } from "../src/discord-signature.js";
import { createSignedInteractionRequest, generateTestKeyPair } from "./helpers/discord-fixtures.js";

describe("verifyDiscordRequest", () => {
  it("accepts a request signed with the matching private key", async () => {
    const { privateKey, publicKeyHex } = await generateTestKeyPair();
    const request = await createSignedInteractionRequest(privateKey, { type: 1 });

    const { isValid } = await verifyDiscordRequest(request, publicKeyHex);

    expect(isValid).toBe(true);
  });

  it("rejects a request signed with a different key than the configured public key", async () => {
    const { publicKeyHex } = await generateTestKeyPair();
    const { privateKey: otherPrivateKey } = await generateTestKeyPair();
    const request = await createSignedInteractionRequest(otherPrivateKey, { type: 1 });

    const { isValid } = await verifyDiscordRequest(request, publicKeyHex);

    expect(isValid).toBe(false);
  });

  it("rejects a request whose body was tampered with after signing", async () => {
    const { privateKey, publicKeyHex } = await generateTestKeyPair();
    const signedRequest = await createSignedInteractionRequest(privateKey, { type: 1 });
    const tamperedRequest = new Request(signedRequest.url, {
      method: "POST",
      headers: signedRequest.headers,
      body: JSON.stringify({ type: 1, tampered: true }),
    });

    const { isValid } = await verifyDiscordRequest(tamperedRequest, publicKeyHex);

    expect(isValid).toBe(false);
  });

  it("rejects a request missing the signature headers", async () => {
    const { publicKeyHex } = await generateTestKeyPair();
    const request = new Request("https://example.com/", {
      method: "POST",
      body: JSON.stringify({ type: 1 }),
    });

    const { isValid } = await verifyDiscordRequest(request, publicKeyHex);

    expect(isValid).toBe(false);
  });

  it("rejects a request when no public key is configured", async () => {
    const { privateKey } = await generateTestKeyPair();
    const request = await createSignedInteractionRequest(privateKey, { type: 1 });

    const { isValid } = await verifyDiscordRequest(request, undefined);

    expect(isValid).toBe(false);
  });

  it("does not throw on a malformed (non-hex) signature header", async () => {
    const { publicKeyHex } = await generateTestKeyPair();
    const request = new Request("https://example.com/", {
      method: "POST",
      headers: {
        "X-Signature-Ed25519": "not-valid-hex",
        "X-Signature-Timestamp": "12345",
      },
      body: JSON.stringify({ type: 1 }),
    });

    const { isValid } = await verifyDiscordRequest(request, publicKeyHex);

    expect(isValid).toBe(false);
  });

  it("returns the raw body text alongside the verification result", async () => {
    const { privateKey, publicKeyHex } = await generateTestKeyPair();
    const interaction = { type: 1 };
    const request = await createSignedInteractionRequest(privateKey, interaction);

    const { body } = await verifyDiscordRequest(request, publicKeyHex);

    expect(JSON.parse(body)).toEqual(interaction);
  });
});
