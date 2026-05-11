'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, FileText, FolderOpen,
  CheckSquare, Download, Search, LogOut,
} from 'lucide-react';
import './globals.css';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',    short: 'Accueil',  icon: LayoutDashboard },
  { href: '/users',       label: 'Utilisateurs', short: 'Comptes',  icon: Users },
  { href: '/contracts',   label: 'Contrats',     short: 'Contrats', icon: FileText },
  { href: '/projects',    label: 'Projets',      short: 'Projets',  icon: FolderOpen },
  { href: '/validations', label: 'Validations',  short: 'Valider',  icon: CheckSquare },
  { href: '/exports',     label: 'Exports',      short: 'Exports',  icon: Download },
  { href: '/audit-logs',  label: 'Audit logs',   short: 'Audit',    icon: Search },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin    = pathname === '/login';
  const isEmployee = pathname.startsWith('/employee');

  if (isLogin || isEmployee) {
    return (
      <html lang="fr">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex min-h-screen bg-[#F5F5F7]">

          {/* Sidebar desktop uniquement */}
          <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200">
            <div className="px-5 py-5 border-b border-gray-100">
              <h1 className="font-semibold text-[15px] text-gray-900 tracking-tight">TimeTrack</h1>
              <p className="text-[12px] text-gray-400 mt-0.5">Administration</p>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href}>
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}>
                      <Icon size={16} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-3 border-t border-gray-100">
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                <LogOut size={16} className="text-gray-400" />
                Déconnexion
              </button>
            </div>
          </aside>

          {/* Header mobile — deux bulles flottantes */}
          <div className="md:hidden">
            <div
              className="fixed top-5 left-4 z-30 px-4 py-2 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <span className="font-semibold text-[15px] text-gray-900 tracking-tight">TimeTrack</span>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              className="fixed top-5 right-4 z-30 p-2.5 rounded-2xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <LogOut size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col min-h-screen md:ml-60">
            <main className="flex-1 overflow-auto overflow-x-hidden pt-20 md:pt-0 pb-28 md:pb-0">
              {children}
            </main>
          </div>

          {/* Bottom nav mobile — floating liquid glass iOS 26 */}
          <nav className="md:hidden fixed bottom-5 inset-x-4 z-30">
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <div className="flex items-center justify-around px-2 py-2">
                {navItems.map(({ href, short, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                        isActive
                          ? 'text-[#0071E3] bg-blue-50/80'
                          : 'text-gray-400'
                      }`}
                    >
                      <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} />
                      <span className="text-[9px] font-medium leading-none">{short}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

        </div>
      </body>
    </html>
  );
}
