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

  // Verificar se a rota é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute || isAdminRoute) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // Se não há sessão, redirecionar para login
      if (!session?.user) {
        return NextResponse.redirect(new URL("/authentication", request.url));
      }

      // Se é rota admin e usuário não é admin, redirecionar para dashboard
      if (isAdminRoute && session.user.role !== "admin") {
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
