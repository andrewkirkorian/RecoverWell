/**
 * The incoming Request, available inside server-function handlers and api routes.
 *
 * Imported dynamically so this module never evaluates framework server code in a
 * client bundle — the import only happens when a handler actually runs, which is
 * always on the server.
 */
export async function serverRequest(): Promise<Request> {
  const { getRequest } = await import("@tanstack/react-start/server");
  return getRequest();
}
