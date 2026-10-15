import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { createToolStdioCommandTemplateSchema } from "@paperclipai/shared";
import { resolvePaperclipInstanceRoot } from "../home-paths.js";

const instanceStdioTemplatesFileSchema = z.object({
  templates: z.array(
    createToolStdioCommandTemplateSchema.extend({
      // Fixed, non-secret env the host operator sets; secrets still go through envKeys.
      env: z.record(z.string(), z.string()).default({}),
    }),
  ),
});

export type InstanceStdioTemplate = z.infer<typeof instanceStdioTemplatesFileSchema>["templates"][number];

/**
 * Host-operator stdio templates every company on this instance may use, read
 * from `<instance root>/stdio-templates.json`. Restart the server after editing.
 */
export function loadInstanceStdioTemplates(
  file = path.join(resolvePaperclipInstanceRoot(), "stdio-templates.json"),
): Record<string, InstanceStdioTemplate> {
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${(error as Error).message}`);
  }
  const parsed = instanceStdioTemplatesFileSchema.safeParse(json);
  if (!parsed.success) throw new Error(`Invalid ${file}: ${parsed.error.message}`);
  const templates: Record<string, InstanceStdioTemplate> = {};
  for (const template of parsed.data.templates) {
    if (template.templateId.startsWith("paperclip.") || templates[template.templateId]) {
      throw new Error(`Invalid ${file}: templateId "${template.templateId}" is reserved or duplicated`);
    }
    templates[template.templateId] = template;
  }
  return templates;
}
