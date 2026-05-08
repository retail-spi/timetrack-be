'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';

export default function DashboardPage() {
  const [stats, setStats]               = useState({ pending: 0, corrections: 0 });
  const [user, setUser]                 = useState<any>(null);
  const [myEntries, setMyEntries]       = useState<any[]>([]);
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

  const today = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalPending = stats.pending + stats.corrections;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-6">
        <p className="text-[13px] text-gray-400 capitalize mb-1">{today}</p>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Tableau de bord</h1>
        {user && <p className="text-[13px] text-gray-500 mt-1">Bonjour, <span className="text-gray-700 font-medium">{user.firstName}</span></p>}
      </div>

      {totalPending > 0 && (
        <Link href="/validations">
          <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors cursor-pointer">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-[13px] text-amber-700 font-medium">
              {totalPending} élément{totalPending > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
        </Link>
      )}

      <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Mon pointage</p>
      <MonthCalendar entries={myEntries} onSelectDate={setSelectedDate} />

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
