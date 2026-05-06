'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
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
  const isEmployee = pathname.startsWith('/employee');
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLogin || isEmployee) {
    return (
      <html lang="fr">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen">

          {/* Overlay mobile */}
          {menuOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed md:static inset-y-0 left-0 z-30
            w-56 bg-blue-900 text-white flex flex-col
            transform transition-transform duration-300
            ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
          `}>
            <div className="p-4 border-b border-blue-800 flex justify-between items-center">
              <div>
                <h1 className="font-bold text-lg">TimeTrack BE</h1>
                <p className="text-blue-300 text-xs">Administration</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="md:hidden text-blue-300 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
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

          {/* Main */}
          <div className="flex-1 flex flex-col min-h-screen md:ml-0">
            {/* Header mobile */}
            <header className="md:hidden bg-blue-900 text-white px-4 py-3 flex items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="text-white text-2xl">
                ☰
              </button>
              <h1 className="font-bold text-lg">TimeTrack BE</h1>
            </header>

            <main className="flex-1 bg-gray-100 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}