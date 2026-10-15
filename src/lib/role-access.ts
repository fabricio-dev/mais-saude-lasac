import type { UserRole } from "@/types/auth";

export const AUTHENTICATION_PATH = "/authentication";

// Página inicial de cada papel: para onde vai quem faz login ou abre uma área que não é a sua
const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: "/dashboard",
  gestor: "/gerente/dashboard-gestor",
  user: "/vendedor/dashboard-seller",
};

// Áreas de cada papel. Cada rota protegida pertence a um papel só.
const ROUTE_PREFIXES_BY_ROLE: Record<UserRole, string[]> = {
  admin: [
    "/admin",
    "/clinics",
    "/dashboard",
    "/management",
    "/patients",
    "/precos",
    "/sellers",
    "/whatsapp",
  ],
  gestor: ["/gerente"],
  user: ["/vendedor"],
};

const USER_ROLES = Object.keys(HOME_PATH_BY_ROLE) as UserRole[];

// Papel fora da lista (vazio ou valor antigo no banco) vale como vendedor, o de menor acesso.
// Sem isso, ninguém aceita o papel e /dashboard e /vendedor/dashboard-seller se mandam um para o outro.
export const normalizeRole = (role?: string | null): UserRole =>
  USER_ROLES.find((userRole) => userRole === role) ?? "user";

export const getHomePathForRole = (role?: string | null) =>
  HOME_PATH_BY_ROLE[normalizeRole(role)];

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const getRouteRole = (pathname: string): UserRole | undefined =>
  USER_ROLES.find((role) =>
    ROUTE_PREFIXES_BY_ROLE[role].some((prefix) =>
      matchesPrefix(pathname, prefix),
    ),
  );
