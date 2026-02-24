import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
  const url = new URL("/", request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set(COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
