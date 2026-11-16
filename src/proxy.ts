import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;

  // Si APP_PASSWORD n'est pas configuré, on laisse passer (pratique en local si non défini)
  if (!appPassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // On laisse passer la page de connexion et les fichiers techniques Next.js
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('idea_triage_auth')?.value;

  if (authCookie === appPassword) {
    return NextResponse.next();
  }

  // Pour les routes API, on renvoie une erreur 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Sinon on redirige vers la page de connexion
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};