import { open, realpath } from "node:fs/promises";
import path from "node:path";
import { openRunnerApiWorkspaceFile } from "./native-runtime/runner-api-files.js";

const MAX_CREDENTIAL_BYTES = 64 * 1024;

/** Bounded descriptor read; never follows symlinks or reopens a checked path. */
export async function readLocalAiCredentialFile(filename: string): Promise<string> {
  const windows = process.platform === "win32";
  // ponytail: local-only. Windows has no confined open or POSIX owner/mode, so this
  // rejects any link in the path by realpath (check-then-open race) and relies on profile ACLs.
  if (windows && (await realpath(filename)).toLowerCase() !== path.resolve(filename).toLowerCase()) {
    throw new Error("Invalid credential file");
  }
  const file = windows ? await open(filename, "r") : await openRunnerApiWorkspaceFile(filename);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_CREDENTIAL_BYTES ||
        (!windows && (stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o600))) {
      throw new Error("Invalid credential file");
    }
    const bytes = Buffer.alloc(MAX_CREDENTIAL_BYTES + 1);
    let size = 0;
    while (size < bytes.length) {
      const read = await file.read(bytes, size, bytes.length - size, size);
      if (!read.bytesRead) break;
      size += read.bytesRead;
    }
    if (size > MAX_CREDENTIAL_BYTES) throw new Error("Invalid credential file");
    return bytes.subarray(0, size).toString("utf8");
  } finally {
    await file.close();
  }
}
