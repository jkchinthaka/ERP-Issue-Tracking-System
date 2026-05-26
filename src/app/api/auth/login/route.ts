import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Role, User } from "@/lib/models";
import { fail } from "@/lib/api";
import { SESSION_COOKIE, signSession, verifyPassword } from "@/lib/auth";
import { sanitizeText, toId } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const email = sanitizeText(body.email, 180).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ message: "Please enter email and password." }, { status: 400 });
    }

    const user = await User.findOne({ email, isActive: true }).lean();
    if (!user || !(await verifyPassword(password, String(user.passwordHash)))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

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
