import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";

const PROTECTED_PATHS = ["/dashboard"];
const LANDING_PATH = "/";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function getValidToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    await verifySessionToken(token);
    return token;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasValidSession = (await getValidToken(request)) !== null;

  // Logged-in users visiting landing -> redirect to dashboard
  if (pathname === LANDING_PATH && hasValidSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protected paths: require valid session
  if (isProtectedPath(pathname)) {
    if (!hasValidSession) {
      const url = request.nextUrl.clone();
      url.pathname = LANDING_PATH;
      const res = NextResponse.redirect(url);
      res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
      return res;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
