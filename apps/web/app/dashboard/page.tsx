'use client';
import { useEffect, useState, useCallback } from 'react';
import { webApi } from '@/lib/api';
import { Check, X, Trash2, Clock, ClipboardList, Wrench } from 'lucide-react';
import MonthCalendar from '@/components/MonthCalendar';
import TimeEntryModal from '@/components/TimeEntryModal';
import CorrectionModal from '@/components/CorrectionModal';

type PendingItem = {
  id: string;
  type: 'time' | 'worker' | 'correction';
  userName: string;
  date: string;
  label: string;
};

export default function DashboardPage() {
  const [user, setUser]                 = useState<any>(null);
  const [myEntries, setMyEntries]       = useState<any[]>([]);
  const [pending, setPending]           = useState<PendingItem[]>([]);
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);
  const [correctionEntry, setCorrectionEntry] = useState<any>(null);
  const [loading, setLoading]               = useState<Record<string, boolean>>({});

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadPending = useCallback(async () => {
    const [entries, workers, corrections] = await Promise.all([
      webApi.timeEntries.list(),
      webApi.workerEntries.list(),
      webApi.corrections.list(),
    ]);

    const items: PendingItem[] = [
      ...entries
        .filter((e: any) => e.status === 'PENDING')
        .map((e: any) => ({
          id: e.id,
          type: 'time' as const,
          userName: `${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim() || e.user?.email || '—',
          date: e.date ? new Date(e.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
          label: e.startTime && e.endTime
            ? `${new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })} → ${new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}`
            : 'Pointage',
        })),
      ...workers
        .filter((w: any) => w.status === 'PENDING')
        .map((w: any) => ({
          id: w.id,
          type: 'worker' as const,
          userName: `${w.user?.firstName ?? ''} ${w.user?.lastName ?? ''}`.trim() || w.user?.email || '—',
          date: w.date ? new Date(w.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '—',
          label: w.taskType?.label ?? 'Chantier',
        })),
      ...corrections
        .filter((c: any) => c.status === 'PENDING')
        .map((c: any) => ({
          id: c.id,
          type: 'correction' as const,
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
    } finally {
      setLoading((l) => ({ ...l, [item.id]: false }));
    }
  };

  const handleReject = async (item: PendingItem) => {
    setLoading((l) => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time')       await webApi.timeEntries.reject(item.id);
      if (item.type === 'correction') await webApi.corrections.reject(item.id);
      await loadPending();
    } finally {
      setLoading((l) => ({ ...l, [item.id]: false }));
    }
  };

  const handleDelete = async (item: PendingItem) => {
    setLoading((l) => ({ ...l, [item.id]: true }));
    try {
      if (item.type === 'time') await webApi.timeEntries.delete(item.id);
      await loadPending();
    } finally {
      setLoading((l) => ({ ...l, [item.id]: false }));
    }
  };

  const typeConfig = {
    time:       { icon: Clock,         color: 'bg-blue-50 text-blue-600',   label: 'Pointage' },
    worker:     { icon: Wrench,        color: 'bg-orange-50 text-orange-600', label: 'Chantier' },
    correction: { icon: ClipboardList, color: 'bg-purple-50 text-purple-600', label: 'Correction' },
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const weekEntries = myEntries.filter((e) => new Date(e.date) >= startOfWeek);

  const today = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-7">

      {/* Header */}
      <div>
        <p className="text-[13px] text-gray-400 capitalize mb-1">{today}</p>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Tableau de bord</h1>
        {user && <p className="text-[13px] text-gray-500 mt-1">Bonjour, <span className="text-gray-700 font-medium">{user.firstName}</span></p>}
      </div>

      {/* Calendrier */}
      <div>
        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Mon pointage</p>
        <MonthCalendar entries={myEntries} onSelectDate={setSelectedDate} />
      </div>

      {/* Bloc approbations — SUPER_ADMIN uniquement */}
      {isSuperAdmin && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">En attente</p>
            {pending.length > 0 && (
              <span className="text-[11px] font-semibold bg-red-100 text-red-500 rounded-full px-2 py-0.5">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Check size={15} className="text-green-500" />
              </div>
              <p className="text-[13px] text-gray-400">Tout est à jour, have a tea ☕</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {pending.map((item) => {
                const cfg = typeConfig[item.type];
                const TypeIcon = cfg.icon;
                const busy = loading[item.id];
                const canReject = item.type !== 'worker';
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <TypeIcon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{item.userName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.date} · {item.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.type === 'time' && (
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={busy}
                          className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      )}
                      {canReject && (
                        <button
                          onClick={() => handleReject(item)}
                          disabled={busy}
                          className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors disabled:opacity-40"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={busy}
                        className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-500 hover:bg-green-100 transition-colors disabled:opacity-40"
                      >
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

      {/* Entrées de la semaine */}
      {weekEntries.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Cette semaine</p>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {weekEntries.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 capitalize truncate">
                    {new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {e.startTime && e.endTime
                      ? `${new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })} → ${new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}`
                      : `${e.hours}h`}
                    {e.activityType && ` · ${e.activityType.label}`}
                  </p>
                </div>
                <button
                  onClick={() => setCorrectionEntry(e)}
                  className="text-[11px] text-gray-400 hover:text-[#0071E3] transition-colors underline underline-offset-2 shrink-0"
                >
                  Corriger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && user && (
        <TimeEntryModal
          date={selectedDate}
          user={user}
          onClose={() => setSelectedDate(null)}
          onSaved={() => {
            setSelectedDate(null);
            loadMyEntries(user).catch(console.error);
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
            alert('Correction envoyée.');
          }}
        />
      )}
    </div>
  );
}
