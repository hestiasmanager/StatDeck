import { createHash } from "crypto";

/**
 * Computes a deterministic SHA-256 hash of normalized text and target format.
 * Trims whitespace, lowercases, and deduplicates extra spaces.
 */
export function computeContentHash(content: string, format: string = "carousel"): string {
  const normalized = content
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 10000); // hash up to first 10,000 normalized chars

  return createHash("sha256")
    .update(`${format}:${normalized}`)
    .digest("hex");
}
