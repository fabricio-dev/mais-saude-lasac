import { authClient } from "@/lib/auth-client";
import {
  getRolePermissions,
  isAdmin,
  isGestor,
  isUser,
  type UserRole,
} from "@/types/auth";

export const usePermissions = () => {
  const session = authClient.useSession();
  const user = session.data?.user;
  const userRole = user?.role as UserRole;

  const permissions = getRolePermissions(userRole);

  return {
    user,
    userRole,
    permissions,
    isAdmin: isAdmin(userRole),
    isGestor: isGestor(userRole),
    isUser: isUser(userRole),
    isLoading: session.isPending,
    isAuthenticated: !!user,
  };
};
