'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

const navItems = [
  { href: '/dashboard', label: '🏠 Dashboard' },
  { href: '/users', label: '👥 Utilisateurs' },
  { href: '/contracts', label: '📄 Contrats' },
  { href: '/projects', label: '📁 Projets' },
  { href: '/validations', label: '✅ Validations' },
  { href: '/exports', label: '📥 Exports' },
  { href: '/audit-logs', label: '🔍 Audit logs' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <html lang="fr">
      <body>
        {isLogin ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <aside className="w-56 bg-blue-900 text-white flex flex-col">
              <div className="p-4 border-b border-blue-800">
                <h1 className="font-bold text-lg">TimeTrack BE</h1>
                <p className="text-blue-300 text-xs">Administration</p>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      pathname === item.href
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </nav>
              <div className="p-3 border-t border-blue-800">
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                  className="w-full text-left px-3 py-2 text-sm text-blue-300 hover:text-white rounded-lg hover:bg-blue-800"
                >
                  🚪 Déconnexion
                </button>
              </div>
            </aside>
            <main className="flex-1 bg-gray-100 overflow-auto">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}