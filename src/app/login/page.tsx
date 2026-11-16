import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function loginAction(formData: FormData) {
  'use server';
  const password = formData.get('password');
  const expected = process.env.APP_PASSWORD;

  if (!expected || password === expected) {
    const cookieStore = await cookies();
    cookieStore.set('idea_triage_auth', expected ?? '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });
    redirect('/');
  }

  redirect('/login?error=1');
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === '1';

  return (
    <form
      action={loginAction}
      className="w-full max-w-sm space-y-4 rounded-lg border border-black/15 p-6 shadow-sm dark:border-white/20"
    >
      <div>
        <h1 className="text-xl font-semibold">Accès protégé — Hexavia</h1>
        <p className="mt-1 text-sm opacity-70">
          Saisissez le mot de passe communiqué par INSKIP pour accéder aux idées.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mt-1 w-full rounded-md border border-black/20 bg-transparent px-3 py-2 text-sm dark:border-white/25"
        />
      </div>

      {hasError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Mot de passe incorrect. Réessayez.
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Se connecter
      </button>
    </form>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<p className="text-sm opacity-70">Chargement…</p>}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}