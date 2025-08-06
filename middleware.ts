import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que requerem autenticação
  const protectedRoutes = [
    "/vendedor/dashboard-seller",
    "/vendedor/patients-seller",
  ];

  // Rotas que requerem permissões de admin
  const adminRoutes = [
    "/admin",
    "/management",
    "/dashboard",
    "/patients",
    "/sellers",
    "/clinics",
  ];

  // Rotas específicas para gestores
  const gestorRoutes = ["/gerente/dashboard-gestor"];

  // Verificar se a rota é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isGestorRoute = gestorRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute || isAdminRoute || isGestorRoute) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // Se não há sessão, redirecionar para login
      if (!session?.user) {
        return NextResponse.redirect(new URL("/authentication", request.url));
      }

      // Se é rota admin e usuário não é admin, redirecionar baseado na role
      if (isAdminRoute && session.user.role !== "admin") {
        if (session.user.role === "gestor") {
          return NextResponse.redirect(
            new URL("/gerente/dashboard-gestor", request.url),
          );
        }
        return NextResponse.redirect(
          new URL("/vendedor/dashboard-seller", request.url),
        );
      }

      // Se é rota gestor e usuário não é gestor, redirecionar baseado na role
      if (isGestorRoute && session.user.role !== "gestor") {
        if (session.user.role === "admin") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.redirect(
          new URL("/vendedor/dashboard-seller", request.url),
        );
      }
    } catch {
      // Em caso de erro na verificação, redirecionar para login
      return NextResponse.redirect(new URL("/authentication", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
