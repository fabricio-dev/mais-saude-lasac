import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  AUTHENTICATION_PATH,
  getHomePathForRole,
  getRouteRole,
  normalizeRole,
} from "@/lib/role-access";

// Fica em src/ porque o app usa src/app: na raiz do projeto o Next não o lê
export async function proxy(request: NextRequest) {
  const routeRole = getRouteRole(request.nextUrl.pathname);

  if (!routeRole) {
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.redirect(new URL(AUTHENTICATION_PATH, request.url));
    }

    // Quem abre a área de outro papel vai para a própria página inicial
    if (normalizeRole(session.user.role) !== routeRole) {
      return NextResponse.redirect(
        new URL(getHomePathForRole(session.user.role), request.url),
      );
    }
  } catch {
    // Em caso de erro na verificação, redirecionar para login
    return NextResponse.redirect(new URL(AUTHENTICATION_PATH, request.url));
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
