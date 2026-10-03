import { createHash } from "node:crypto";
import { ObjectId, type WithId } from "mongodb";

import { DbNotConfiguredError, getDb } from "~/mongo.server";
import { newToken } from "~/server/passwords.server";

/**
 * Server-side sessions stored in MongoDB. The browser only ever holds an opaque
 * random token in an httpOnly cookie; the database stores a SHA-256 hash of it,
 * so a leaked database dump does not yield usable sessions.
 */

export const SESSION_COOKIE = "rw_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
}

interface UserDoc {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/** Read one cookie out of a request. Never logged. */
export const readCookie = (request: Request, name: string): string | undefined => {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return undefined;
};

/** True when this request reached us over TLS (the published site does). */
export const isSecureRequest = (request: Request): boolean => {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
};

export const sessionCookieHeader = (
  token: string,
  request: Request,
): string =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${String(
    SESSION_DAYS * 24 * 60 * 60,
  )}${isSecureRequest(request) ? "; Secure" : ""}`;

export const clearedSessionCookieHeader = (request: Request): string =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    isSecureRequest(request) ? "; Secure" : ""
  }`;

/** Create a session row and return the token to put in the cookie. */
export async function createSession(userId: string): Promise<string> {
  const db = await getDb();
  const token = newToken();
  await db.collection("sessions").insertOne({
    tokenHash: hashToken(token),
    userId: new ObjectId(userId),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  });
  return token;
}

/** The signed-in user for this request, or null. Always scoped to the token's own row. */
export async function sessionUser(request: Request): Promise<SessionUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const db = await getDb();
  const session = await db.collection("sessions").findOne({ tokenHash: hashToken(token) });
  if (!session) return null;
  const expiresAt = session.expiresAt;
  if (expiresAt instanceof Date && expiresAt.getTime() < Date.now()) return null;
  const userId = session.userId as ObjectId;
  const user = (await db
    .collection<UserDoc>("users")
    .findOne({ _id: userId })) as WithId<UserDoc> | null;
  if (!user) return null;
  return { id: user._id.toHexString(), email: user.email };
}

/** Drop this session (logout). */
export async function destroySession(request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  const db = await getDb();
  await db.collection("sessions").deleteOne({ tokenHash: hashToken(token) });
}

export { DbNotConfiguredError };
