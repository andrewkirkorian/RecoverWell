/** Small helpers for the form-post api routes. Their responses carry no body, so
 * patient entries never appear in a URL or in a response payload. */

export const MAX_BODY_BYTES = 100_000;

export const seeOther = (
  location: string,
  extraHeaders: Record<string, string> = {},
): Response =>
  new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store", ...extraHeaders },
  });

/** Send the visitor back to a form with a plain-language error code. */
export const seeOtherError = (path: string, code: string): Response =>
  seeOther(`${path}?e=${encodeURIComponent(code)}`);

/**
 * Read at most `maxBytes` of request body, refusing anything larger.
 *
 * `content-length` is only a hint — a chunked request can leave it out entirely —
 * so the body is streamed and counted as it arrives, and reading stops the moment
 * the cap is passed. A refusal is `null`, which the routes turn into their usual
 * plain error path; nothing here throws, so an oversized post can never crash a
 * handler.
 */
const readBodyText = async (request: Request, maxBytes: number): Promise<string | null> => {
  const body = request.body;
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
};

/** The content type every form in this app posts with. */
const URLENCODED = "application/x-www-form-urlencoded";

/**
 * The posted form, or `null` when it is missing, malformed, of an unexpected type
 * or over `MAX_BODY_BYTES`.
 */
export const readForm = async (request: Request): Promise<FormData | null> => {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  const type = (request.headers.get("content-type") ?? "").toLowerCase();
  // Every form here posts urlencoded fields; anything else is refused rather than
  // parsed by guesswork.
  if (type.length > 0 && !type.includes(URLENCODED)) return null;
  const text = await readBodyText(request, MAX_BODY_BYTES);
  if (text === null) return null;
  try {
    const form = new FormData();
    for (const [name, value] of new URLSearchParams(text)) form.append(name, value);
    return form;
  } catch {
    return null;
  }
};

export const formField = (form: FormData, name: string, maxLength = 200): string => {
  const value = form.get(name);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
};
