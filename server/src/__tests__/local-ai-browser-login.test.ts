import { describe, expect, it } from "vitest";
import { normalizeConptyOutput } from "../services/local-ai-browser-login.js";

describe("normalizeConptyOutput", () => {
  it("restores the rows ConPTY draws with cursor jumps and starts hyperlinks on their own line", () => {
    const conpty =
      "sign in (c to copy)\x1b]8;id=1;https://example.test/a\x1b\\\x1b[22;1Hhttps://example.test/a\x1b]8;;\x1b\\" +
      "\x1b[25;2HPaste\x1b[1Ccode";
    expect(normalizeConptyOutput(conpty)).toBe(
      "sign in (c to copy)\r\n\x1b]8;id=1;https://example.test/a\x1b\\\r\nhttps://example.test/a\x1b]8;;\x1b\\" +
        "\r\nPaste\x1b[1Ccode",
    );
  });
});
