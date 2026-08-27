import { describe, expect, it, vi } from "vitest";
import {
  buildCommandPayload,
  buildRegistrationUrl,
  registerCommands,
  resolveGuildId,
} from "../scripts/register-commands.js";
import { commands } from "../src/command-definitions.js";

describe("buildRegistrationUrl", () => {
  it("targets the global bulk-overwrite endpoint when no guild is given", () => {
    expect(buildRegistrationUrl("app-123")).toBe(
      "https://discord.com/api/v10/applications/app-123/commands",
    );
  });

  it("targets the guild-scoped bulk-overwrite endpoint when a guild is given", () => {
    expect(buildRegistrationUrl("app-123", "guild-456")).toBe(
      "https://discord.com/api/v10/applications/app-123/guilds/guild-456/commands",
    );
  });
});

describe("buildCommandPayload", () => {
  it("maps the shared command definitions to Discord's registration schema", () => {
    const payload = buildCommandPayload();

    expect(payload).toEqual(commands.map(({ name, description }) => ({ name, description })));
  });

  it("strips the Worker-only respond handler, which is not part of Discord's schema", () => {
    for (const command of buildCommandPayload()) {
      expect(command.respond).toBeUndefined();
    }
  });
});

describe("resolveGuildId", () => {
  it("returns the configured guild id when no flag is given", () => {
    expect(resolveGuildId({ guildFlag: false, discordGuildId: "guild-456" })).toBe("guild-456");
  });

  it("returns undefined for global registration when neither the flag nor a guild id is set", () => {
    expect(resolveGuildId({ guildFlag: false, discordGuildId: undefined })).toBeUndefined();
  });

  it("returns the guild id when --guild is passed and DISCORD_GUILD_ID is set", () => {
    expect(resolveGuildId({ guildFlag: true, discordGuildId: "guild-456" })).toBe("guild-456");
  });

  it("throws when --guild is passed but DISCORD_GUILD_ID is unset", () => {
    expect(() => resolveGuildId({ guildFlag: true, discordGuildId: undefined })).toThrow(
      /DISCORD_GUILD_ID/,
    );
  });
});

describe("registerCommands", () => {
  it("issues a PUT bulk-overwrite request with the bot token and command payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "1", name: "ping" }]), { status: 200 }),
    );

    const result = await registerCommands({
      applicationId: "app-123",
      token: "bot-token",
      guildId: "guild-456",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://discord.com/api/v10/applications/app-123/guilds/guild-456/commands",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bot bot-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildCommandPayload()),
      }),
    );
    expect(result).toEqual({ ok: true, status: 200, body: [{ id: "1", name: "ping" }] });
  });

  it("surfaces a failed request's status and body without throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    const result = await registerCommands({
      applicationId: "app-123",
      token: "bad-token",
      fetchImpl,
    });

    expect(result).toEqual({ ok: false, status: 401, body: { message: "Unauthorized" } });
  });
});
