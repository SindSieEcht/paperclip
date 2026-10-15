import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadInstanceStdioTemplates } from "../services/instance-stdio-templates.js";

function fileWith(content: unknown) {
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), "stdio-templates-")), "stdio-templates.json");
  writeFileSync(file, JSON.stringify(content));
  return file;
}

describe("loadInstanceStdioTemplates", () => {
  it("returns nothing when the file is absent", () => {
    expect(loadInstanceStdioTemplates(path.join(os.tmpdir(), "missing-stdio-templates.json"))).toEqual({});
  });

  it("keys templates by templateId with defaults", () => {
    const templates = loadInstanceStdioTemplates(fileWith({
      templates: [{ templateId: "aseprite", name: "Aseprite", command: "uv", env: { A: "1" }, tools: [{ name: "add_layer" }] }],
    }));
    expect(templates.aseprite).toMatchObject({ command: "uv", args: [], envKeys: [], env: { A: "1" } });
    expect(templates.aseprite.tools.map((tool) => tool.name)).toEqual(["add_layer"]);
  });

  it("rejects ids that would shadow a code built-in", () => {
    expect(() => loadInstanceStdioTemplates(fileWith({
      templates: [{ templateId: "paperclip.google-sheets", name: "x", command: "x" }],
    }))).toThrow(/reserved or duplicated/);
  });
});
