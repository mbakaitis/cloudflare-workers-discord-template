/**
 * Test-only helpers for signing fixture Discord interaction requests with a
 * locally generated Ed25519 keypair. Nothing here ships in the Worker — tests
 * use these to build requests that verify the same way a real Discord request
 * would, without ever calling Discord's API.
 */

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a fresh Ed25519 keypair for signing test fixtures.
 *
 * @returns {Promise<{ privateKey: CryptoKey, publicKeyHex: string }>}
 */
export async function generateTestKeyPair() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const publicKeyBytes = await crypto.subtle.exportKey("raw", publicKey);

  return { privateKey, publicKeyHex: bytesToHex(new Uint8Array(publicKeyBytes)) };
}

/**
 * Builds a POST Request signed the way Discord signs real interaction requests:
 * an Ed25519 signature over the timestamp header concatenated with the raw body.
 *
 * @param {CryptoKey} privateKey - From generateTestKeyPair().
 * @param {object} interaction - Interaction payload to send as the JSON body.
 * @param {{ timestamp?: string, signatureOverrideHex?: string }} [options]
 * @returns {Promise<Request>}
 */
export async function createSignedInteractionRequest(privateKey, interaction, options = {}) {
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify(interaction);
  const signatureBytes = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(timestamp + body),
  );
  const signatureHex = options.signatureOverrideHex ?? bytesToHex(new Uint8Array(signatureBytes));

  return new Request("https://example.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature-Ed25519": signatureHex,
      "X-Signature-Timestamp": timestamp,
    },
    body,
  });
}
