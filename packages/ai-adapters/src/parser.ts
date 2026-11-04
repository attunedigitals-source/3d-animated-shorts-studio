import { z } from 'zod';

/**
 * Robustly extracts and validates JSON from LLM responses.
 * Handles markdown fences, preamble/postamble, and basic formatting issues.
 */
export function extractAndValidateJson<T>(rawText: string, schema: z.ZodType<T, any, any>): T {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ... ```)
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(fenceRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  } else {
    // If no explicit markdown fence, attempt to extract the first outer JSON object or array
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1).trim();
    }
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // Attempt basic JSON sanitization (replace raw control characters or trailing commas before closing braces)
    try {
      const sanitized = cleaned
        .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' '); // remove illegal unescaped ASCII control characters
      parsed = JSON.parse(sanitized);
    } catch {
      throw new Error(
        `Failed to parse AI output as JSON: ${err.message}. Raw output snippet: "${rawText.slice(0, 300)}..."`,
      );
    }
  }

  // Validate with Zod
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `[${i.path.join('.') || 'root'}]: ${i.message}`)
      .join('; ');
    throw new Error(`AI response does not conform to required schema: ${issues}`);
  }

  return result.data;
}
