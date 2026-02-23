import fs from "fs";
import path from "path";

export function getUploadsRootDir(): string {
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "uploads");
  }

  return path.join(process.cwd(), "uploads");
}

export function ensureUploadsSubdir(subdir: string): string {
  const dir = path.join(getUploadsRootDir(), subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
