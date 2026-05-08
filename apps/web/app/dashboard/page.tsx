'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { AlertCircle, Users, FolderOpen, FileText, Download, Search } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';

export default function DashboardPage() {
  const [stats, setStats]           = useState({ pending: 0, corrections: 0 });
  const [user, setUser]             = useState<any>(null);
  const [myEntries, setMyEntries]   = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = async (currentUser: any) => {
    const [entries, corrections, allEntries] = await Promise.all([
      webApi.timeEntries.list(),
      webApi.corrections.list(),
      currentUser?.scope === 'worker' ? webApi.workerEntries.list() : webApi.timeEntries.list(),
    ]);
    setStats({
      pending:     entries.filter((e: any) => e.status === 'PENDING').length,
      corrections: corrections.filter((c: any) => c.status === 'PENDING').length,
    });
    setMyEntries(allEntries.filter((e: any) => e.userId === currentUser?.id || e.user?.id === currentUser?.id));
  };

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      load(parsed).catch(console.error);
    }
  }, []);

  const quickLinks = [
    { label: 'Utilisateurs',  href: '/users',      icon: Users },
    { label: 'Projets',       href: '/projects',   icon: FolderOpen },
    { label: 'Contrats',      href: '/contracts',  icon: FileText },
    { label: 'Exports',       href: '/exports',    icon: Download },
    { label: 'Audit logs',    href: '/audit-logs', icon: Search },
  ];

  const today = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[13px] text-gray-400 capitalize mb-1">{today}</p>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Tableau de bord</h1>
        {user && <p className="text-[13px] text-gray-500 mt-1">Bonjour, <span className="text-gray-700 font-medium">{user.firstName}</span></p>}
      </div>

      {(stats.pending > 0 || stats.corrections > 0) && (
        <Link href="/validations">
          <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors cursor-pointer">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-[13px] text-amber-700 font-medium">
              {stats.pending + stats.corrections} élément{stats.pending + stats.corrections > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendrier — prend 2/3 sur desktop */}
        <div className="lg:col-span-2">
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Mon pointage</p>
          <MonthCalendar
            entries={myEntries}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Raccourcis */}
        <div>
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Navigation</p>
          <div className="space-y-2">
            <Link href="/validations">
              <div className={`bg-white rounded-2xl border p-4 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer ${
                stats.pending + stats.corrections > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  stats.pending + stats.corrections > 0 ? 'bg-amber-100' : 'bg-gray-100'
                }`}>
                  <AlertCircle size={15} className={stats.pending + stats.corrections > 0 ? 'text-amber-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className={`text-[13px] font-medium ${stats.pending + stats.corrections > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                    Validations
                  </p>
                  {stats.pending + stats.corrections > 0 && (
                    <p className="text-[11px] text-amber-500">{stats.pending + stats.corrections} en attente</p>
                  )}
                </div>
              </div>
            </Link>
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-gray-400" />
                  </div>
                  <p className="text-[13px] font-medium text-gray-700">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {selectedDate && user && (
        <TimeEntryModal
          date={selectedDate}
          user={user}
          onClose={() => setSelectedDate(null)}
          onSaved={() => {
            setSelectedDate(null);
            load(user).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
