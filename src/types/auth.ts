export type UserRole = "admin" | "user";

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinic?: {
    id: string;
    name: string;
  };
}

export interface AdminActions {
  canManageUsers: boolean;
  canManageClinics: boolean;
  canManageSellers: boolean;
  canViewAllData: boolean;
}

export const getRolePermissions = (role: UserRole): AdminActions => {
  switch (role) {
    case "admin":
      return {
        canManageUsers: true,
        canManageClinics: true,
        canManageSellers: true,
        canViewAllData: true,
      };
    case "user":
    default:
      return {
        canManageUsers: false,
        canManageClinics: false,
        canManageSellers: false,
        canViewAllData: false,
      };
  }
};

export const isAdmin = (role?: string): boolean => {
  return role === "admin";
};

export const isUser = (role?: string): boolean => {
  return role === "user" || !role;
};
