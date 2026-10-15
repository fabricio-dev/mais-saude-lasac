import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  AUTHENTICATION_PATH,
  getHomePathForRole,
  normalizeRole,
} from "@/lib/role-access";
import type { UserRole } from "@/types/auth";

// Mesma regra do src/proxy.ts, para a página não depender só dele
export const requireRole = async (role: UserRole) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(AUTHENTICATION_PATH);
  }
  if (normalizeRole(session.user.role) !== role) {
    redirect(getHomePathForRole(session.user.role));
  }

  return session;
};
