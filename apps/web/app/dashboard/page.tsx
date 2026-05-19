'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { webApi } from '@/lib/api';
import { Bell, Check, CheckCheck, X, Trash2, Clock, ClipboardList, Wrench } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';
import CorrectionModal from '@/components/CorrectionModal';
import { useIsDark } from '../theme-context';

type PendingItem = {
  id: string;
  userId: string;
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
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [dismissed, setDismissed]           = useState<Set<string>>(new Set());

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
        id: e.id,
        userId: e.userId || e.user?.id || '',
        type: 'time' as const,
        userName: `${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim() || e.user?.email || '—',
        date: e.date ? new Date(e.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
        label: e.startTime && e.endTime
          ? `${new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' })} → ${new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' })}`
          : 'Pointage',
      })),
      ...workers.filter((w: any) => w.status === 'PENDING').map((w: any) => ({
        id: w.id,
        userId: w.userId || w.user?.id || '',
        type: 'worker' as const,
        userName: `${w.user?.firstName ?? ''} ${w.user?.lastName ?? ''}`.trim() || w.user?.email || '—',
        date: w.date ? new Date(w.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
        label: w.taskType?.label ?? 'Chantier',
      })),
      ...corrections.filter((c: any) => c.status === 'PENDING').map((c: any) => ({
        id: c.id,
        userId: c.userId || c.user?.id || '',
        type: 'correction' as const,
        userName: `${c.user?.firstName ?? ''} ${c.user?.lastName ?? ''}`.trim() || c.user?.email || '—',
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
        label: c.reason ?? 'Correction',
      })),
    ];
    setPending(items);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PendingItem[]>();
    pending.forEach(item => {
      if (!map.has(item.userId)) map.set(item.userId, []);
      map.get(item.userId)!.push(item);
    });
    return Array.from(map.entries()).map(([uid, items]) => ({ uid, name: items[0].userName, items }));
  }, [pending]);

  const notifications = useMemo(() => pending.filter(p => !dismissed.has(p.id)), [pending, dismissed]);

  const notifGrouped = useMemo(() => {
    const map = new Map<string, PendingItem[]>();
    notifications.forEach(item => {
      if (!map.has(item.userId)) map.set(item.userId, []);
      map.get(item.userId)!.push(item);
    });
    return Array.from(map.entries()).map(([uid, items]) => ({ uid, name: items[0].userName, items }));
  }, [notifications]);

  const handleDismiss    = (id: string) => setDismissed(d => new Set([...d, id]));
  const handleDismissAll = () => setDismissed(new Set(pending.map(p => p.id)));

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

  const doApprove = useCallback(async (item: PendingItem) => {
    if (item.type === 'time')       return webApi.timeEntries.approve(item.id);
    if (item.type === 'worker')     return webApi.workerEntries.approve(item.id);
    if (item.type === 'correction') return webApi.corrections.approve(item.id);
  }, []);

  const handleApprove = async (item: PendingItem) => {
    setLoading(l => ({ ...l, [item.id]: true }));
    try { await doApprove(item); await loadPending(); }
    finally { setLoading(l => ({ ...l, [item.id]: false })); }
  };

  const handleApproveAll = async (items: PendingItem[]) => {
    setLoading(l => { const u = { ...l }; items.forEach(i => { u[i.id] = true; }); return u; });
    try { await Promise.all(items.map(doApprove)); await loadPending(); }
    finally { setLoading(l => { const u = { ...l }; items.forEach(i => { u[i.id] = false; }); return u; }); }
  };

  const handleReject = async (item: PendingItem) => {
    setLoading(l => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time')       await webApi.timeEntries.reject(item.id);
      if (item.type === 'correction') await webApi.corrections.reject(item.id);
      await loadPending();
    } finally { setLoading(l => ({ ...l, [item.id]: false })); }
  };

  const handleDelete = async (item: PendingItem) => {
    setLoading(l => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time') await webApi.timeEntries.delete(item.id);
      await loadPending();
    } finally { setLoading(l => ({ ...l, [item.id]: false })); }
  };

  const typeConfig = {
    time:       { icon: Clock,         color: isDark ? 'bg-blue-900/40 text-blue-400'     : 'bg-blue-50 text-blue-600' },
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

  /* ── Blocs réutilisables ── */
  const weekWidget = (
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
            <span className={`text-[12px] ${sub}`}>{weekApproved} approuvée{weekApproved !== 1 ? 's' : ''}</span>
          </div>
        </div>
      ) : (
        <p className={`text-[12px] ${sub}`}>{weekEntries.length} entrée{weekEntries.length !== 1 ? 's' : ''} cette semaine</p>
      )}
    </div>
  );

  const calendarSection = (
    <div>
      <p className={`text-[12px] font-semibold uppercase tracking-wide mb-2 px-1 ${muted}`}>Mon pointage</p>
      <MonthCalendar entries={myEntries} onSelectDate={setSelectedDate} />
    </div>
  );

  const thisWeekSection = weekEntries.length > 0 ? (
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
                  ? `${new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' })} → ${new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' })}`
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
  ) : null;

  const pendingSection = (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
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
        grouped.map(({ uid, name, items }) => {
          const allBusy = items.every(i => loading[i.id]);
          return (
            <div key={uid} className={`${card} overflow-hidden`}>
              {/* En-tête du groupe */}
              <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                <p className={`flex-1 text-[13px] font-semibold truncate ${title}`}>{name}</p>
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {items.length}
                </span>
                <button
                  onClick={() => handleApproveAll(items)}
                  disabled={allBusy}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 shrink-0 ${isDark ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  <CheckCheck size={12} />
                  Tout valider
                </button>
              </div>

              {/* Entrées du groupe */}
              <div className={divide}>
                {items.map(item => {
                  const cfg = typeConfig[item.type];
                  const TypeIcon = cfg.icon;
                  const busy = loading[item.id];
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <TypeIcon size={11} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] truncate ${muted}`}>{item.date} · {item.label}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.type === 'time' && (
                          <button onClick={() => handleDelete(item)} disabled={busy}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                            <Trash2 size={11} strokeWidth={2} />
                          </button>
                        )}
                        {item.type !== 'worker' && (
                          <button onClick={() => handleReject(item)} disabled={busy}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        )}
                        <button onClick={() => handleApprove(item)} disabled={busy}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                          <Check size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className={`mb-7 ${!isSuperAdmin ? 'max-w-2xl' : ''}`}>
        <p className={`text-[13px] capitalize mb-1 ${muted}`}>{today}</p>
        <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>Tableau de bord</h1>
        {user && <p className={`text-[13px] mt-1 ${sub}`}>Bonjour, <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{user.firstName}</span></p>}
      </div>

      {isSuperAdmin ? (
        /* SUPER_ADMIN — deux colonnes sur desktop */
        <div className="flex flex-col md:flex-row gap-7 items-start">
          <div className="w-full md:w-[420px] md:shrink-0 space-y-7">
            {weekWidget}
            {calendarSection}
            {thisWeekSection}
          </div>
          <div className="w-full md:flex-1 md:min-w-0">
            {pendingSection}
          </div>
        </div>
      ) : (
        /* Autres rôles — colonne unique */
        <div className="max-w-2xl space-y-7">
          {weekWidget}
          {calendarSection}
          {thisWeekSection}
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

      {/* ── Bulle cloche (SUPER_ADMIN uniquement) ── */}
      {isSuperAdmin && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-28 right-5 md:bottom-8 md:right-8 z-40 w-13 h-13 rounded-full bg-[#0071E3] text-white shadow-xl flex items-center justify-center hover:bg-[#0077ED] transition-colors"
          style={{ width: 52, height: 52 }}
        >
          <Bell size={21} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {notifications.length > 99 ? '99+' : notifications.length}
            </span>
          )}
        </button>
      )}

      {/* ── Tiroir notifications ── */}
      {isSuperAdmin && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panneau */}
          <div
            className={`fixed top-0 right-0 bottom-0 z-50 w-full md:w-[400px] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'} ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
          >
            {/* Header tiroir */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <Bell size={16} className={muted} />
              <p className={`flex-1 text-[15px] font-semibold ${title}`}>Notifications</p>
              {notifications.length > 0 && (
                <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-red-500 text-white">
                  {notifications.length}
                </span>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  className={`text-[12px] font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  Tout enlever
                </button>
              )}
              <button
                onClick={() => setDrawerOpen(false)}
                className={`p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <X size={17} />
              </button>
            </div>

            {/* Contenu tiroir */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/40' : 'bg-green-50'}`}>
                    <Check size={20} className={isDark ? 'text-green-400' : 'text-green-500'} />
                  </div>
                  <p className={`text-[13px] ${muted}`}>Aucune notification en attente</p>
                </div>
              ) : (
                notifGrouped.map(({ uid, name, items }) => {
                  const allBusy = items.every(i => loading[i.id]);
                  return (
                    <div key={uid} className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#242424] border-gray-700/50' : 'bg-gray-50 border-gray-100'}`}>
                      {/* En-tête groupe */}
                      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <p className={`flex-1 text-[13px] font-semibold truncate ${title}`}>{name}</p>
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                          {items.length}
                        </span>
                        <button
                          onClick={() => handleApproveAll(items)}
                          disabled={allBusy}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 shrink-0 ${isDark ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                        >
                          <CheckCheck size={12} />
                          Tout valider
                        </button>
                      </div>

                      {/* Entrées */}
                      {items.map(item => {
                        const cfg = typeConfig[item.type];
                        const TypeIcon = cfg.icon;
                        const busy = loading[item.id];
                        return (
                          <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? 'border-gray-700/30' : 'border-gray-100'}`}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${cfg.color}`}>
                              <TypeIcon size={11} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[12px] truncate ${muted}`}>{item.date} · {item.label}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleDismiss(item.id)}
                                disabled={busy}
                                title="Enlever la notification"
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                <X size={11} />
                              </button>
                              <button
                                onClick={() => handleApprove(item)}
                                disabled={busy}
                                title="Valider"
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                              >
                                <Check size={11} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
