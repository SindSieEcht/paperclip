import { describe, expect, it } from "vitest";
import { MAX_CONNECTION_TOOL_TIMEOUT_MS, connectionToolTimeoutMs } from "../services/tool-gateway.js";

describe("connectionToolTimeoutMs", () => {
  it("reads a positive operator timeout and caps it", () => {
    expect(connectionToolTimeoutMs({ toolTimeoutMs: 300_000 })).toBe(300_000);
    expect(connectionToolTimeoutMs({ toolTimeoutMs: 99 * 60_000 })).toBe(MAX_CONNECTION_TOOL_TIMEOUT_MS);
  });

  it("ignores missing or invalid values", () => {
    for (const config of [undefined, null, {}, { toolTimeoutMs: "600000" }, { toolTimeoutMs: 0 }, { toolTimeoutMs: Number.NaN }]) {
      expect(connectionToolTimeoutMs(config)).toBeNull();
    }
  });
});
