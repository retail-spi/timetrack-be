'use client';
import { useEffect, useState, useCallback } from 'react';
import { webApi } from '@/lib/api';
import { Check, X, Trash2, Clock, ClipboardList, Wrench } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';
import CorrectionModal from '@/components/CorrectionModal';
import { useIsDark } from '../theme-context';

type PendingItem = {
  id: string;
  type: 'time' | 'worker' | 'correction';
  userName: string;
  date: string;
  label: string;
};

export default function DashboardPage() {
  const isDark = useIsDark();
  const [user, setUser]                     = useState<any>(null);
  const [myEntries, setMyEntries]           = useState<any[]>([]);
  const [pending, setPending]               = useState<PendingItem[]>([]);
  const [contractHours, setContractHours]   = useState<number | null>(null);
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);
  const [correctionEntry, setCorrectionEntry] = useState<any>(null);
  const [loading, setLoading]               = useState<Record<string, boolean>>({});

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const card    = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700/50' : 'bg-white border-gray-100'}`;
  const divide  = isDark ? 'divide-y divide-gray-700/50' : 'divide-y divide-gray-50';
  const title   = isDark ? 'text-white' : 'text-gray-900';
  const sub     = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted   = isDark ? 'text-gray-500' : 'text-gray-400';
  const bodyTxt = isDark ? 'text-gray-100' : 'text-gray-800';

  const loadPending = useCallback(async () => {
    const [entries, workers, corrections] = await Promise.all([
      webApi.timeEntries.list(),
      webApi.workerEntries.list(),
      webApi.corrections.list(),
    ]);
    const items: PendingItem[] = [
      ...entries.filter((e: any) => e.status === 'PENDING').map((e: any) => ({
        id: e.id, type: 'time' as const,
        userName: e.user?.firstName || e.user?.email || '—',
        date: e.date ? new Date(e.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
        label: e.startTime && e.endTime
          ? `${new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} → ${new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`
          : 'Pointage',
      })),
      ...workers.filter((w: any) => w.status === 'PENDING').map((w: any) => ({
        id: w.id, type: 'worker' as const,
        userName: `${w.user?.firstName ?? ''} ${w.user?.lastName ?? ''}`.trim() || w.user?.email || '—',
        date: w.date ? new Date(w.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
        label: w.taskType?.label ?? 'Chantier',
      })),
      ...corrections.filter((c: any) => c.status === 'PENDING').map((c: any) => ({
        id: c.id, type: 'correction' as const,
        userName: `${c.user?.firstName ?? ''} ${c.user?.lastName ?? ''}`.trim() || c.user?.email || '—',
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
        label: c.reason ?? 'Correction',
      })),
    ];
    setPending(items);
  }, []);

  const loadMyEntries = useCallback(async (currentUser: any) => {
    const list = currentUser?.scope === 'worker'
      ? await webApi.workerEntries.list()
      : await webApi.timeEntries.list();
    setMyEntries(list.filter((e: any) => e.userId === currentUser?.id || e.user?.id === currentUser?.id));
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      if (parsed.weeklyHours != null) {
        setContractHours(parsed.weeklyHours);
      } else {
        webApi.contracts.list().then((cs: any[]) => {
          const mine = cs.find((c: any) => c.userId === parsed.id && c.isActive);
          if (mine) setContractHours(mine.weeklyHours);
        }).catch(() => {});
      }
      loadMyEntries(parsed).catch(console.error);
      if (parsed.role === 'SUPER_ADMIN') loadPending().catch(console.error);
    }
  }, [loadMyEntries, loadPending]);

  const handleApprove = async (item: PendingItem) => {
    setLoading((l) => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time')       await webApi.timeEntries.approve(item.id);
      if (item.type === 'worker')     await webApi.workerEntries.approve(item.id);
      if (item.type === 'correction') await webApi.corrections.approve(item.id);
      await loadPending();
    } finally { setLoading((l) => ({ ...l, [item.id]: false })); }
  };

  const handleReject = async (item: PendingItem) => {
    setLoading((l) => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time')       await webApi.timeEntries.reject(item.id);
      if (item.type === 'correction') await webApi.corrections.reject(item.id);
      await loadPending();
    } finally { setLoading((l) => ({ ...l, [item.id]: false })); }
  };

  const handleDelete = async (item: PendingItem) => {
    setLoading((l) => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time') await webApi.timeEntries.delete(item.id);
      await loadPending();
    } finally { setLoading((l) => ({ ...l, [item.id]: false })); }
  };

  const typeConfig = {
    time:       { icon: Clock,         color: isDark ? 'bg-blue-900/40 text-blue-400'   : 'bg-blue-50 text-blue-600' },
    worker:     { icon: Wrench,        color: isDark ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-50 text-orange-600' },
    correction: { icon: ClipboardList, color: isDark ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-50 text-purple-600' },
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const weekEntries = myEntries.filter((e) => new Date(e.date) >= startOfWeek);
  const today = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });

  const totalHours = user?.scope === 'worker'
    ? weekEntries.reduce((sum: number, e: any) => sum + e.hours, 0)
    : weekEntries.reduce((sum: number, e: any) => {
        if (!e.startTime || !e.endTime) return sum;
        const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000;
        return sum + diff - (e.breakMinutes ?? 0) / 60;
      }, 0);
  const over         = contractHours !== null && totalHours > contractHours;
  const weekPending  = weekEntries.filter((e: any) => e.status === 'PENDING').length;
  const weekApproved = weekEntries.filter((e: any) => e.status === 'APPROVED').length;

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-7">
      <div>
        <p className={`text-[13px] capitalize mb-1 ${muted}`}>{today}</p>
        <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>Tableau de bord</h1>
        {user && <p className={`text-[13px] mt-1 ${sub}`}>Bonjour, <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{user.firstName}</span></p>}
      </div>

      {/* Widget semaine en cours */}
      <div className={`${card} p-5`}>
        <p className={`text-[12px] font-medium uppercase tracking-wide mb-3 ${muted}`}>Semaine en cours</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-[40px] font-bold leading-none tracking-tight ${over ? 'text-red-500' : title}`}>
            {totalHours.toFixed(1)}
          </span>
          <span className={`text-[15px] ${sub}`}>{contractHours !== null ? `h / ${contractHours}h` : 'h'}</span>
        </div>
        {contractHours !== null && (
          <div className={`w-full rounded-full h-1.5 mb-3 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
            <div
              className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-[#0071E3]'}`}
              style={{ width: `${Math.min((totalHours / contractHours) * 100, 100)}%` }}
            />
          </div>
        )}
        {user?.role !== 'SUPER_ADMIN' ? (
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className={`text-[12px] ${sub}`}>{weekPending} en attente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className={`text-[12px] ${sub}`}>{weekApproved} approuvées</span>
            </div>
          </div>
        ) : (
          <p className={`text-[12px] ${sub}`}>{weekEntries.length} entrée{weekEntries.length !== 1 ? 's' : ''} cette semaine</p>
        )}
      </div>

      <div>
        <p className={`text-[12px] font-semibold uppercase tracking-wide mb-2 px-1 ${muted}`}>Mon pointage</p>
        <MonthCalendar entries={myEntries} onSelectDate={setSelectedDate} />
      </div>

      {isSuperAdmin && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className={`text-[12px] font-semibold uppercase tracking-wide ${muted}`}>En attente</p>
            {pending.length > 0 && (
              <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-500'}`}>
                {pending.length}
              </span>
            )}
          </div>
          {pending.length === 0 ? (
            <div className={`${card} px-4 py-5 flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-green-900/40' : 'bg-green-50'}`}>
                <Check size={15} className={isDark ? 'text-green-400' : 'text-green-500'} />
              </div>
              <p className={`text-[13px] ${muted}`}>Tout est à jour, have a tea ☕</p>
            </div>
          ) : (
            <div className={`${card} ${divide} overflow-hidden`}>
              {pending.map((item) => {
                const cfg = typeConfig[item.type];
                const TypeIcon = cfg.icon;
                const busy = loading[item.id];
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <TypeIcon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${bodyTxt}`}>{item.userName}</p>
                      <p className={`text-[11px] truncate ${muted}`}>{item.date} · {item.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.type === 'time' && (
                        <button onClick={() => handleDelete(item)} disabled={busy}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      )}
                      {item.type !== 'worker' && (
                        <button onClick={() => handleReject(item)} disabled={busy}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      <button onClick={() => handleApprove(item)} disabled={busy}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                        <Check size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {weekEntries.length > 0 && (
        <div>
          <p className={`text-[12px] font-semibold uppercase tracking-wide mb-2 px-1 ${muted}`}>Cette semaine</p>
          <div className={`${card} ${divide} overflow-hidden`}>
            {weekEntries.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium capitalize truncate ${bodyTxt}`}>
                    {new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <p className={`text-[11px] truncate ${muted}`}>
                    {e.startTime && e.endTime
                      ? `${new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} → ${new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`
                      : `${e.hours}h`}
                    {e.activityType && ` · ${e.activityType.label}`}
                  </p>
                </div>
                <button onClick={() => setCorrectionEntry(e)}
                  className={`text-[11px] underline underline-offset-2 transition-colors shrink-0 ${isDark ? 'text-gray-500 hover:text-blue-400' : 'text-gray-400 hover:text-[#0071E3]'}`}>
                  Corriger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && user && (
        <TimeEntryModal date={selectedDate} user={user} onClose={() => setSelectedDate(null)}
          onSaved={() => { setSelectedDate(null); loadMyEntries(user).catch(console.error); }} />
      )}
      {correctionEntry && user && (
        <CorrectionModal entry={correctionEntry} scope={user.scope} onClose={() => setCorrectionEntry(null)}
          onSaved={() => { setCorrectionEntry(null); alert('Correction envoyée.'); }} />
      )}
    </div>
  );
}
