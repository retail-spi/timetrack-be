'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { LogOut, Clock, ClipboardList } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';
import CorrectionModal from '@/components/CorrectionModal';

const statusStyle = (status: string) => {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-600';
  if (status === 'REJECTED') return 'bg-red-50 text-red-500';
  return 'bg-amber-50 text-amber-600';
};
const statusLabel = (status: string) => {
  if (status === 'APPROVED') return 'Approuvé';
  if (status === 'REJECTED') return 'Rejeté';
  return 'En attente';
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser]                     = useState<any>(null);
  const [entries, setEntries]               = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);
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
    loadEntries(parsed).catch(console.error).finally(() => setLoading(false));
  }, []);

  const logout = () => { localStorage.clear(); router.push('/login'); };

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

  const contractHours = 38;
  const over    = totalHours > contractHours;
  const pending = weekEntries.filter((e) => e.status === 'PENDING').length;
  const approved = weekEntries.filter((e) => e.status === 'APPROVED').length;

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <p className="text-[13px] text-gray-400">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">TimeTrack</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Bonjour, {user?.firstName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employee/corrections" className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors">
            <ClipboardList size={15} /> Corrections
          </Link>
          <button onClick={logout} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 space-y-4">
        {/* Résumé semaine */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">Semaine en cours</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-[40px] font-bold leading-none tracking-tight ${over ? 'text-red-500' : 'text-gray-900'}`}>
              {totalHours.toFixed(1)}
            </span>
            <span className="text-[15px] text-gray-400">h <span className="text-[13px]">/ {contractHours}h</span></span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
            <div
              className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-[#0071E3]'}`}
              style={{ width: `${Math.min((totalHours / contractHours) * 100, 100)}%` }}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[12px] text-gray-500">{pending} en attente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[12px] text-gray-500">{approved} approuvées</span>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div>
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Mon pointage — cliquer une date pour pointer</p>
          <MonthCalendar entries={entries} onSelectDate={setSelectedDate} />
        </div>

        {/* Entrées de la semaine */}
        <div>
          <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">Cette semaine</h2>
          {weekEntries.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <Clock size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-gray-400">Aucune entrée cette semaine</p>
            </div>
          )}
          <div className="space-y-2.5">
            {weekEntries.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-gray-900 capitalize">
                      {new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {user?.scope === 'worker' ? (
                      <p className="text-[12px] text-gray-500 mt-0.5">{e.hours}h · {e.taskType?.label}</p>
                    ) : (
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                        {e.activityType && ` · ${e.activityType.label}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(e.status)}`}>
                      {statusLabel(e.status)}
                    </span>
                    <button
                      onClick={() => setCorrectionEntry(e)}
                      className="text-[11px] text-gray-400 hover:text-[#0071E3] transition-colors underline underline-offset-2"
                    >
                      Corriger
                    </button>
                  </div>
                </div>
              </div>
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
            loadEntries(user).catch(console.error);
          }}
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
