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

export const readForm = async (request: Request): Promise<FormData | null> => {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  try {
    return await request.formData();
  } catch {
    return null;
  }
};

export const formField = (form: FormData, name: string, maxLength = 200): string => {
  const value = form.get(name);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
};
