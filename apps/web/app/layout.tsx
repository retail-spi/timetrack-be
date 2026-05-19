// TimeTrack Web — Francois Dive <divefrancois@gmail.com> — SPI Global Play Retail 2026
'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, FileText, FolderOpen,
  CheckSquare, Download, Search, LogOut,
  Sun, Moon, Monitor, ClipboardList, MoreHorizontal, UserCircle,
} from 'lucide-react';
import { ThemeContext } from './theme-context';
import { inter } from './fonts';
import './globals.css';

type Theme = 'auto' | 'light' | 'dark';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',    short: 'Accueil',  icon: LayoutDashboard },
  { href: '/users',       label: 'Utilisateurs', short: 'Comptes',  icon: Users },
  { href: '/contracts',   label: 'Contrats',     short: 'Contrats', icon: FileText },
  { href: '/projects',    label: 'Projets',      short: 'Projets',  icon: FolderOpen },
  { href: '/validations', label: 'Validations',  short: 'Valider',  icon: CheckSquare },
  { href: '/exports',     label: 'Exports',      short: 'Exports',  icon: Download },
  { href: '/audit-logs',  label: 'Audit logs',   short: 'Audit',    icon: Search },
];

const ThemeIcon = ({ theme }: { theme: Theme }) => {
  if (theme === 'light') return <Sun size={15} />;
  if (theme === 'dark')  return <Moon size={15} />;
  return <Monitor size={15} />;
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const isLogin    = pathname === '/login';
  const isEmployee = pathname.startsWith('/employee');

  const [theme, setTheme]         = useState<Theme>('auto');
  const [isDark, setIsDark]       = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [userRole, setUserRole]   = useState<string | null>(null);
  const [showMore, setShowMore]   = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'auto';
    setTheme(saved);
    setMounted(true);
  }, []);

  // Re-lire le rôle à chaque changement de page (le layout ne se re-monte pas entre /login et /dashboard)
  useEffect(() => {
    try {
      const u = localStorage.getItem('auth_user');
      setUserRole(u ? JSON.parse(u).role ?? null : null);
    } catch {
      setUserRole(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    const resolve = (): boolean =>
      theme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : theme === 'dark';

    const apply = () => {
      const dark = resolve();
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    };

    apply();
    localStorage.setItem('theme', theme);

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, mounted]);

  const cycleTheme = () =>
    setTheme(t => t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto');

  const glassStyle = {
    background: isDark ? 'rgba(35,35,35,0.6)' : 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    boxShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
  };

  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #111111 100%)'
    : 'linear-gradient(135deg, #e8eaf6 0%, #fce4ec 40%, #e3f2fd 100%)';

  if (isLogin) {
    return (
      <html lang="fr" suppressHydrationWarning className={inter.className}>
        <body>{children}</body>
      </html>
    );
  }

  const textPrimary   = isDark ? 'text-white'        : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300'     : 'text-gray-500';
  const textMuted     = isDark ? 'text-gray-400'     : 'text-gray-400';
  const hoverBg       = isDark ? 'hover:bg-white/10' : 'hover:bg-white/60';
  const activeBg      = isDark ? 'bg-white/15 text-white' : 'bg-blue-50/80 text-blue-600';
  const activeIcon    = isDark ? 'text-blue-300'     : 'text-blue-500';

  const employeeNavItems = [
    { href: '/employee/dashboard',   label: 'Accueil',      icon: LayoutDashboard },
    { href: '/employee/corrections', label: 'Corrections',  icon: ClipboardList   },
  ];

  if (isEmployee) {
    return (
      <html lang="fr" suppressHydrationWarning className={inter.className}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <ThemeContext.Provider value={isDark}>
            <div className="min-h-screen transition-all duration-300" style={{ background: bgGradient }}>

              {/* Bulles flottantes haut */}
              <div
                className="fixed top-5 left-4 z-30 px-4 py-2 rounded-2xl transition-all duration-300"
                style={glassStyle}
              >
                <span className={`font-semibold text-[15px] tracking-tight ${textPrimary}`}>TimeTrack</span>
              </div>
              <div className="fixed top-5 right-4 z-30 flex items-center gap-2">
                <button
                  onClick={cycleTheme}
                  className={`p-2.5 rounded-2xl transition-all duration-300 ${textSecondary}`}
                  style={glassStyle}
                >
                  <ThemeIcon theme={theme} />
                </button>
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                  className={`p-2.5 rounded-2xl transition-all duration-300 ${textSecondary}`}
                  style={glassStyle}
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* Contenu */}
              <div className="pt-20 pb-28 max-w-lg mx-auto">
                {children}
              </div>

              {/* Bottom nav */}
              <nav className="fixed bottom-5 inset-x-4 z-30">
                <div className="rounded-3xl overflow-hidden transition-all duration-300" style={glassStyle}>
                  <div className="flex items-center justify-around px-2 py-2">
                    {[...employeeNavItems, { href: '/employee/profile', label: 'Profil', icon: UserCircle }].map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || (href === '/employee/dashboard' && pathname === '/employee/add');
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all ${
                            isActive
                              ? isDark ? 'text-blue-300 bg-white/15' : 'text-[#0071E3] bg-blue-50/80'
                              : textMuted
                          }`}
                        >
                          <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} />
                          <span className="text-[9px] font-medium leading-none">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>

            </div>
          </ThemeContext.Provider>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr" suppressHydrationWarning className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeContext.Provider value={isDark}>
        <div className="flex min-h-screen transition-all duration-300" style={{ background: bgGradient }}>

          {/* Sidebar desktop — flottante macOS */}
          <aside
            className="hidden md:flex flex-col fixed top-4 bottom-4 left-4 z-30 w-56 rounded-2xl overflow-hidden transition-all duration-300"
            style={glassStyle}
          >
            <div className="px-5 py-6">
              <h1 className={`font-bold text-[24px] tracking-tight ${textPrimary}`}>TimeTrack</h1>
              <p className={`text-[12px] mt-0.5 ${textMuted}`}>Administration</p>
            </div>
            <nav className="flex-1 px-3 py-1 space-y-0.5">
              {navItems.filter(item => !(item.href === '/validations' && userRole === 'MANAGER')).map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href}>
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                      isActive ? activeBg : `${textSecondary} ${hoverBg} hover:${textPrimary}`
                    }`}>
                      <Icon size={16} className={isActive ? activeIcon : textMuted} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-3 space-y-1">
              <Link href="/profile">
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  pathname === '/profile' ? activeBg : `${textSecondary} ${hoverBg}`
                }`}>
                  <UserCircle size={16} className={pathname === '/profile' ? activeIcon : textMuted} />
                  Mon profil
                </div>
              </Link>
              <button
                onClick={cycleTheme}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-xl ${hoverBg} font-medium transition-colors ${textSecondary}`}
              >
                <ThemeIcon theme={theme} />
                {theme === 'auto' ? 'Auto' : theme === 'light' ? 'Clair' : 'Sombre'}
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-xl ${hoverBg} font-medium transition-colors ${textSecondary}`}
              >
                <LogOut size={16} className={textMuted} />
                Déconnexion
              </button>
            </div>
          </aside>

          {/* Header mobile — bulles flottantes */}
          <div className="md:hidden">
            <div
              className="fixed top-5 left-4 z-30 px-4 py-2 rounded-2xl transition-all duration-300"
              style={glassStyle}
            >
              <span className={`font-semibold text-[15px] tracking-tight ${textPrimary}`}>TimeTrack</span>
            </div>
            <div className="fixed top-5 right-4 z-30 flex items-center gap-2">
              <button
                onClick={cycleTheme}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${textSecondary}`}
                style={glassStyle}
              >
                <ThemeIcon theme={theme} />
              </button>
              <Link
                href="/profile"
                className={`p-2.5 rounded-2xl transition-all duration-300 ${textSecondary}`}
                style={glassStyle}
              >
                <UserCircle size={18} />
              </Link>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${textSecondary}`}
                style={glassStyle}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col min-h-screen md:ml-[248px]">
            <main className="flex-1 pt-20 md:pt-0 pb-28 md:pb-0">
              {children}
            </main>
          </div>

          {/* Bottom nav mobile — floating liquid glass (rendu seulement après mount pour éviter le flash) */}
          {mounted ? userRole === 'MANAGER' ? (
            <>
              {/* Backdrop pour fermer le menu "Autres" */}
              {showMore && (
                <div className="md:hidden fixed inset-0 z-30" onClick={() => setShowMore(false)} />
              )}

              {/* Panneau "Autres" — slide up */}
              <div
                className="md:hidden fixed inset-x-4 z-40 rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  ...glassStyle,
                  bottom: showMore ? '90px' : '72px',
                  opacity: showMore ? 1 : 0,
                  transform: showMore ? 'translateY(0)' : 'translateY(16px)',
                  pointerEvents: showMore ? 'all' : 'none',
                }}
              >
                <div className="p-2">
                  {[
                    { href: '/profile',    label: 'Mon profil',   icon: UserCircle },
                    { href: '/users',      label: 'Utilisateurs', icon: Users },
                    { href: '/contracts',  label: 'Contrats',     icon: FileText },
                    { href: '/projects',   label: 'Projets',      icon: FolderOpen },
                    { href: '/exports',    label: 'Exports',      icon: Download },
                    { href: '/audit-logs', label: 'Audit logs',   icon: Search },
                  ].map(({ href, label, icon: Icon }, i) => {
                    const isActive = pathname === href;
                    return (
                      <Link key={href} href={href} onClick={() => setShowMore(false)}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? isDark ? 'bg-white/15 text-blue-300' : 'bg-blue-50/80 text-[#0071E3]'
                              : `${textSecondary} ${hoverBg}`
                          }`}
                          style={{
                            transitionDelay: showMore ? `${i * 35}ms` : '0ms',
                            transform: showMore ? 'translateY(0)' : 'translateY(8px)',
                            opacity: showMore ? 1 : 0,
                            transition: 'transform 0.25s ease, opacity 0.25s ease',
                          }}
                        >
                          <Icon size={17} className={isActive ? (isDark ? 'text-blue-300' : 'text-[#0071E3]') : textMuted} />
                          <span className="text-[13px] font-medium">{label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Nav principale manager */}
              <nav className="md:hidden fixed bottom-5 inset-x-4 z-40">
                <div className="rounded-3xl overflow-hidden transition-all duration-300" style={glassStyle}>
                  <div className="flex items-center justify-around px-2 py-2">
                    {[
                      { href: '/dashboard',   label: 'Accueil',     icon: LayoutDashboard },
                      { href: '/corrections', label: 'Corrections', icon: ClipboardList },
                    ].map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href;
                      return (
                        <Link key={href} href={href} onClick={() => setShowMore(false)}
                          className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-2xl transition-all ${
                            isActive
                              ? isDark ? 'text-blue-300 bg-white/15' : 'text-[#0071E3] bg-blue-50/80'
                              : textMuted
                          }`}
                        >
                          <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} />
                          <span className="text-[9px] font-medium leading-none">{label}</span>
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => setShowMore(v => !v)}
                      className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-2xl transition-all ${
                        showMore
                          ? isDark ? 'text-blue-300 bg-white/15' : 'text-[#0071E3] bg-blue-50/80'
                          : textMuted
                      }`}
                    >
                      <MoreHorizontal size={21} strokeWidth={showMore ? 2.2 : 1.6} />
                      <span className="text-[9px] font-medium leading-none">Autres</span>
                    </button>
                  </div>
                </div>
              </nav>
            </>
          ) : userRole === 'SUPER_ADMIN' ? (
            <>
              {showMore && (
                <div className="md:hidden fixed inset-0 z-30" onClick={() => setShowMore(false)} />
              )}

              {/* Panneau "Autres" SUPER_ADMIN */}
              <div
                className="md:hidden fixed inset-x-4 z-40 rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  ...glassStyle,
                  bottom: showMore ? '90px' : '72px',
                  opacity: showMore ? 1 : 0,
                  transform: showMore ? 'translateY(0)' : 'translateY(16px)',
                  pointerEvents: showMore ? 'all' : 'none',
                }}
              >
                <div className="p-2">
                  {[
                    { href: '/profile',    label: 'Mon profil',   icon: UserCircle },
                    { href: '/users',      label: 'Utilisateurs', icon: Users },
                    { href: '/contracts',  label: 'Contrats',     icon: FileText },
                    { href: '/projects',   label: 'Projets',      icon: FolderOpen },
                    { href: '/exports',    label: 'Exports',      icon: Download },
                    { href: '/audit-logs', label: 'Audit logs',   icon: Search },
                  ].map(({ href, label, icon: Icon }, i) => {
                    const isActive = pathname === href;
                    return (
                      <Link key={href} href={href} onClick={() => setShowMore(false)}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? isDark ? 'bg-white/15 text-blue-300' : 'bg-blue-50/80 text-[#0071E3]'
                              : `${textSecondary} ${hoverBg}`
                          }`}
                          style={{
                            transitionDelay: showMore ? `${i * 35}ms` : '0ms',
                            transform: showMore ? 'translateY(0)' : 'translateY(8px)',
                            opacity: showMore ? 1 : 0,
                            transition: 'transform 0.25s ease, opacity 0.25s ease',
                          }}
                        >
                          <Icon size={17} className={isActive ? (isDark ? 'text-blue-300' : 'text-[#0071E3]') : textMuted} />
                          <span className="text-[13px] font-medium">{label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Nav principale SUPER_ADMIN */}
              <nav className="md:hidden fixed bottom-5 inset-x-4 z-40">
                <div className="rounded-3xl overflow-hidden transition-all duration-300" style={glassStyle}>
                  <div className="flex items-center justify-around px-2 py-2">
                    {[
                      { href: '/dashboard',   label: 'Accueil',      icon: LayoutDashboard },
                      { href: '/validations', label: 'Validations',  icon: CheckSquare },
                    ].map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href;
                      return (
                        <Link key={href} href={href} onClick={() => setShowMore(false)}
                          className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-2xl transition-all ${
                            isActive
                              ? isDark ? 'text-blue-300 bg-white/15' : 'text-[#0071E3] bg-blue-50/80'
                              : textMuted
                          }`}
                        >
                          <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} />
                          <span className="text-[9px] font-medium leading-none">{label}</span>
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => setShowMore(v => !v)}
                      className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-2xl transition-all ${
                        showMore
                          ? isDark ? 'text-blue-300 bg-white/15' : 'text-[#0071E3] bg-blue-50/80'
                          : textMuted
                      }`}
                    >
                      <MoreHorizontal size={21} strokeWidth={showMore ? 2.2 : 1.6} />
                      <span className="text-[9px] font-medium leading-none">Autres</span>
                    </button>
                  </div>
                </div>
              </nav>
            </>
          ) : (
            <nav className="md:hidden fixed bottom-5 inset-x-4 z-30">
              <div className="rounded-3xl overflow-hidden transition-all duration-300" style={glassStyle}>
                <div className="flex items-center justify-around px-2 py-2">
                  {navItems.map(({ href, short, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link key={href} href={href}
                        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                          isActive
                            ? isDark ? 'text-blue-300 bg-white/15' : 'text-[#0071E3] bg-blue-50/80'
                            : textMuted
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
          ) : null}

        </div>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
