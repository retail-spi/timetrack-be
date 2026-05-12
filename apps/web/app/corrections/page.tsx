'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';
import { ClipboardList } from 'lucide-react';
import { useIsDark } from '../theme-context';

const statusStyle = (s: string, isDark: boolean) => {
  if (s === 'APPROVED') return isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600';
  if (s === 'REJECTED')  return isDark ? 'bg-red-900/40 text-red-400'       : 'bg-red-50 text-red-500';
  return isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-600';
};
const statusLabel = (s: string) => {
  if (s === 'APPROVED') return 'Approuvée';
  if (s === 'REJECTED')  return 'Rejetée';
  return 'En attente';
};

export default function MyCorrectionsPage() {
  const router  = useRouter();
  const isDark  = useIsDark();
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (!u) { router.push('/login'); return; }
    const me = JSON.parse(u);
    webApi.corrections.list()
      .then((all: any[]) => setCorrections(all.filter((c) => c.submittedById === me.id)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className={`text-[22px] font-semibold tracking-tight mb-6 ${title}`}>Mes corrections</h1>

      {loading && <p className={`text-[13px] ${muted}`}>Chargement...</p>}

      {!loading && corrections.length === 0 && (
        <div className={`${card} p-12 flex flex-col items-center gap-3 text-center`}>
          <ClipboardList size={28} className={muted} />
          <p className={`text-[13px] ${muted}`}>Aucune correction soumise pour l'instant.</p>
        </div>
      )}

      <div className="space-y-3">
        {corrections.map((c) => {
          const entry = c.timeEntry ?? c.workerTimeEntry;
          const dateStr = entry?.date
            ? new Date(entry.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })
            : '—';
          const submittedAt = new Date(c.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });

          return (
            <div key={c.id} className={`${card} p-4 space-y-2`}>
              <div className="flex justify-between items-start">
                <p className={`text-[13px] font-semibold capitalize ${title}`}>{dateStr}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(c.status, isDark)}`}>
                  {statusLabel(c.status)}
                </span>
              </div>
              <p className={`text-[12px] ${sub}`}>"{c.reason}"</p>
              <p className={`text-[11px] ${muted}`}>Soumise le {submittedAt}</p>
              {c.status !== 'PENDING' && c.approvedBy && (
                <p className={`text-[11px] ${muted}`}>
                  Traitée par {c.approvedBy.firstName} {c.approvedBy.lastName}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
