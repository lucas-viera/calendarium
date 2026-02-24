import { NextRequest, NextResponse } from "next/server";
import { comparePassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieOptions, COOKIE_NAME } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate input
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = result.data;

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 3. Compare password
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 4. Create session token and set cookie
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });

    const opts = getSessionCookieOptions();
    response.cookies.set(COOKIE_NAME, token, opts);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
