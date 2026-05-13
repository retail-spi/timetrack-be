'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { Clock, ClipboardList } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';
import CorrectionModal from '@/components/CorrectionModal';
import { useIsDark } from '../../theme-context';

const statusStyle = (status: string, isDark: boolean) => {
  if (status === 'APPROVED') return isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600';
  if (status === 'REJECTED') return isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500';
  return isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-600';
};
const statusLabel = (status: string) => {
  if (status === 'APPROVED') return 'Approuvé';
  if (status === 'REJECTED') return 'Rejeté';
  return 'En attente';
};

export default function EmployeeDashboard() {
  const router  = useRouter();
  const isDark  = useIsDark();
  const [user, setUser]                       = useState<any>(null);
  const [entries, setEntries]                 = useState<any[]>([]);
  const [contractHours, setContractHours]     = useState<number>(38);
  const [loading, setLoading]                 = useState(true);
  const [selectedDate, setSelectedDate]       = useState<string | null>(null);
  const [correctionEntry, setCorrectionEntry] = useState<any>(null);

  const loadEntries = async (parsed: any) => {
    const data = parsed.scope === 'worker'
      ? await webApi.workerEntries.list()
      : await webApi.timeEntries.list();
    setEntries(data);
  };

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    Promise.all([
      loadEntries(parsed),
      webApi.contracts.mine().then((c) => { if (c?.weeklyHours) setContractHours(c.weeklyHours); }).catch(() => {}),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekEntries = entries.filter((e) => new Date(e.date) >= startOfWeek);

  const totalHours = user?.scope === 'worker'
    ? weekEntries.reduce((sum, e) => sum + e.hours, 0)
    : weekEntries.reduce((sum, e) => {
        const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000;
        return sum + diff - e.breakMinutes / 60;
      }, 0);

  const over    = totalHours > contractHours;
  const pending  = weekEntries.filter((e) => e.status === 'PENDING').length;
  const approved = weekEntries.filter((e) => e.status === 'APPROVED').length;

  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const bar   = isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className={`text-[13px] ${muted}`}>Chargement...</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      {/* Greeting */}
      <div className="pt-1">
        <p className={`text-[22px] font-semibold tracking-tight ${title}`}>Bonjour, {user?.firstName} 👋</p>
        <p className={`text-[13px] mt-0.5 ${muted}`}>Voici ton récapitulatif de la semaine</p>
      </div>

      {/* Résumé semaine */}
      <div className={`${card} p-5`}>
        <p className={`text-[12px] font-medium uppercase tracking-wide mb-3 ${muted}`}>Semaine en cours</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-[40px] font-bold leading-none tracking-tight ${over ? 'text-red-500' : title}`}>
            {totalHours.toFixed(1)}
          </span>
          <span className={`text-[15px] ${sub}`}>h <span className="text-[13px]">/ {contractHours}h</span></span>
        </div>
        <div className={`w-full ${bar} rounded-full h-1.5 mb-3`}>
          <div
            className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-[#0071E3]'}`}
            style={{ width: `${Math.min((totalHours / contractHours) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className={`text-[12px] ${sub}`}>{pending} en attente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className={`text-[12px] ${sub}`}>{approved} approuvées</span>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div>
        <p className={`text-[12px] font-semibold uppercase tracking-wide mb-2 px-1 ${muted}`}>
          Mon pointage — cliquer une date pour pointer
        </p>
        <MonthCalendar entries={entries} onSelectDate={setSelectedDate} />
      </div>

      {/* Entrées de la semaine */}
      <div>
        <h2 className={`text-[12px] font-semibold uppercase tracking-wide mb-3 px-1 ${muted}`}>Cette semaine</h2>
        {weekEntries.length === 0 && (
          <div className={`${card} p-8 text-center`}>
            <Clock size={24} className={`mx-auto mb-2 ${muted}`} />
            <p className={`text-[13px] ${muted}`}>Aucune entrée cette semaine</p>
          </div>
        )}
        <div className="space-y-2.5">
          {weekEntries.map((e) => (
            <div key={e.id} className={`${card} p-4`}>
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold capitalize ${title}`}>
                    {new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  {user?.scope === 'worker' ? (
                    <p className={`text-[12px] mt-0.5 ${sub}`}>{e.hours}h · {e.taskType?.label}</p>
                  ) : (
                    <p className={`text-[12px] mt-0.5 ${sub}`}>
                      {new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      {' → '}
                      {new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      {e.activityType && ` · ${e.activityType.label}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(e.status, isDark)}`}>
                    {statusLabel(e.status)}
                  </span>
                  <button
                    onClick={() => setCorrectionEntry(e)}
                    className={`text-[11px] transition-colors underline underline-offset-2 ${isDark ? 'text-gray-500 hover:text-blue-400' : 'text-gray-400 hover:text-[#0071E3]'}`}
                  >
                    Corriger
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDate && user && (
        <TimeEntryModal
          date={selectedDate}
          user={user}
          onClose={() => setSelectedDate(null)}
          onSaved={() => { setSelectedDate(null); loadEntries(user).catch(console.error); }}
        />
      )}

      {correctionEntry && user && (
        <CorrectionModal
          entry={correctionEntry}
          scope={user.scope}
          onClose={() => setCorrectionEntry(null)}
          onSaved={() => {
            setCorrectionEntry(null);
            alert('Correction envoyée, elle sera traitée par l\'administrateur.');
          }}
        />
      )}
    </div>
  );
}
