/**
 * Verifies the Ed25519 signature Discord attaches to every interaction request.
 *
 * Discord signs the concatenation of the `X-Signature-Timestamp` header and the
 * raw request body with the application's private key; the Worker must verify
 * that signature against the application's public key (`DISCORD_PUBLIC_KEY`)
 * before treating the request as a real interaction. This must run before any
 * interaction payload is parsed or handled — it is a Discord platform
 * requirement for the endpoint to be accepted, not optional hardening.
 *
 * Uses the runtime's native Web Crypto API (`crypto.subtle`), which supports
 * Ed25519 without any third-party dependency or Node compatibility flag.
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
 * @see https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-validating-security-tokens
 *
 * @param {Request} request - Incoming interaction request. Its body is read exactly once.
 * @param {string | undefined} publicKeyHex - The Discord application's public key, as hex.
 * @returns {Promise<{ isValid: boolean, body: string }>} Whether the signature verified, and the raw body text.
 */
export async function verifyDiscordRequest(request, publicKeyHex) {
  const signatureHex = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const body = await request.text();

  if (!signatureHex || !timestamp || !publicKeyHex) {
    return { isValid: false, body };
  }

  try {
    const publicKey = await crypto.subtle.importKey(
      "raw",
      hexToBytes(publicKeyHex),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    const isValid = await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      hexToBytes(signatureHex),
      new TextEncoder().encode(timestamp + body),
    );

    return { isValid, body };
  } catch {
    return { isValid: false, body };
  }
}

/**
 * Decodes a hex string into bytes. Throws if the string has an odd length or
 * contains non-hex characters, which `verifyDiscordRequest` treats as an
 * invalid signature rather than letting the exception propagate.
 *
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
