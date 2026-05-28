import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Role, User } from "@/lib/models";
import { fail } from "@/lib/api";
import { SESSION_COOKIE, signSession, verifyPassword } from "@/lib/auth";
import { clearLoginFailures, assertLoginAllowed, loginRateLimitKey, recordLoginFailure } from "@/lib/rate-limit";
import { toId } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { emailField, passwordField, validateInput, z } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: emailField(),
  password: passwordField(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password } = validateInput(loginSchema, await request.json());
    const rateLimitKey = loginRateLimitKey(request, email);
    assertLoginAllowed(rateLimitKey);

    const user = await User.findOne({ email, isActive: true }).lean();
    if (!user || !(await verifyPassword(password, String(user.passwordHash)))) {
      recordLoginFailure(rateLimitKey);
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    clearLoginFailures(rateLimitKey);

    const role = await Role.findById(user.roleId).lean();
    await createAuditLog({
      entityType: "User",
      entityId: toId(user._id),
      action: "User login",
      performedBy: toId(user._id),
      request,
    });

    const response = NextResponse.json({
      user: {
        id: toId(user._id),
        name: user.name,
        email: user.email,
        roleName: role?.roleName ?? "",
      },
    });

    response.cookies.set(SESSION_COOKIE, signSession(toId(user._id)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    return fail(error);
  }
}
