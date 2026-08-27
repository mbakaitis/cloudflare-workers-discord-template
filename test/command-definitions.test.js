import { describe, expect, it } from "vitest";
import { commands } from "../src/command-definitions.js";

describe("command-definitions", () => {
  it("includes a sample ping command that responds with pong", () => {
    const ping = commands.find((command) => command.name === "ping");

    expect(ping).toBeDefined();
    expect(ping.description).toBeTypeOf("string");
    expect(ping.respond({})).toBe("pong");
  });

  it("defines every command with the fields Discord's registration API requires", () => {
    for (const command of commands) {
      expect(command.name).toBeTypeOf("string");
      expect(command.description).toBeTypeOf("string");
      expect(command.respond).toBeTypeOf("function");
    }
  });
});
