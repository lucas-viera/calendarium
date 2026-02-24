import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "calendarium_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

export async function createSessionToken(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}

export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

export { COOKIE_NAME };
