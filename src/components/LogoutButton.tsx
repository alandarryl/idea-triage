'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'idea_triage_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
    >
      Déconnexion
    </button>
  );
}