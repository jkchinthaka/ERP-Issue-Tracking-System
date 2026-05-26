import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { connectToDatabase } from "./db";
import { Department, Role, User } from "./models";
import type { Permission } from "./constants";
import { ROLE_PERMISSIONS } from "./constants";
import type { AuthenticatedUser } from "./permissions";
import { toId } from "./utils";

export const SESSION_COOKIE = "nelna_erp_session";

type JwtSession = {
  userId: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "8h" });
}

export function verifySession(token: string) {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === "string" || !("userId" in decoded)) {
    throw new ApiError("Session expired. Please login again.", 401);
  }
  return decoded as JwtSession;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  let session: JwtSession;
  try {
    session = verifySession(token);
  } catch {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(session.userId).lean();
  if (!user || user.isActive === false) {
    return null;
  }

  const role = await Role.findById(user.roleId).lean();
  const department = user.departmentId ? await Department.findById(user.departmentId).lean() : null;
  const roleName = typeof role?.roleName === "string" ? role.roleName : "";
  const rolePermissions = (role?.permissions ?? ROLE_PERMISSIONS[roleName] ?? []) as Permission[];
  const userPermissions = (user.permissions ?? []) as Permission[];
  const permissions = Array.from(new Set([...rolePermissions, ...userPermissions]));

  return {
    id: toId(user._id),
    name: String(user.name),
    email: String(user.email),
    roleName,
    departmentId: toId(user.departmentId),
    departmentName: department?.name ? String(department.name) : "",
    vendorId: toId(user.vendorId),
    permissions,
  };
}

export async function requireAuth(request: NextRequest, permission?: Permission) {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new ApiError("Session expired. Please login again.", 401);
  }

  if (permission && !user.permissions.includes(permission)) {
    throw new ApiError("You do not have permission to access this page.", 403);
  }

  return user;
}
