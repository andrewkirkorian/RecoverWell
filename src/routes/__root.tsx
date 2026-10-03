import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

/**
 * Content Security Policy for the whole app.
 *
 * There is no HTML-injection sink in this app — nothing a patient types is ever
 * rendered as markup — so this is belt and braces: it pins every resource to this
 * origin, forbids being framed, forbids plugins, and stops a posted form from
 * being sent anywhere but here. `'unsafe-inline'` is needed for script and style
 * because the framework ships its hydration state and the local-date snippet as
 * inline tags; that is the one relaxation, and it is the minimum that keeps the
 * pages working. (`frame-ancestors` is not listed: browsers ignore it in a meta
 * tag — it belongs in a response header.)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f8fafc" },
      { title: "RecoverWell" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
