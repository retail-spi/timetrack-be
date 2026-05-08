'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard, Users, FileText, FolderOpen,
  CheckSquare, Download, Search, LogOut, Menu, X,
} from 'lucide-react';
import './globals.css';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/users',       label: 'Utilisateurs',   icon: Users },
  { href: '/contracts',   label: 'Contrats',        icon: FileText },
  { href: '/projects',    label: 'Projets',         icon: FolderOpen },
  { href: '/validations', label: 'Validations',     icon: CheckSquare },
  { href: '/exports',     label: 'Exports',         icon: Download },
  { href: '/audit-logs',  label: 'Audit logs',      icon: Search },
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex min-h-screen bg-[#F5F5F7]">

          {menuOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
              onClick={() => setMenuOpen(false)}
            />
          )}

          <aside className={`
            fixed md:static inset-y-0 left-0 z-30
            w-60 bg-white border-r border-gray-200 flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
          `}>
            <div className="px-5 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h1 className="font-semibold text-[15px] text-gray-900 tracking-tight">TimeTrack</h1>
                <p className="text-[12px] text-gray-400 mt-0.5">Administration</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="md:hidden text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}>
                      <Icon size={16} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
                      {item.label}
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

          <div className="flex-1 flex flex-col min-h-screen">
            <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} />
              </button>
              <h1 className="font-semibold text-[15px] text-gray-900">TimeTrack</h1>
            </header>

            <main className="flex-1 overflow-auto overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
