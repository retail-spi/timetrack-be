'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';
import { ChevronLeft, ClipboardList } from 'lucide-react';

const statusStyle = (s: string) => {
  if (s === 'APPROVED') return 'bg-emerald-50 text-emerald-600';
  if (s === 'REJECTED')  return 'bg-red-50 text-red-500';
  return 'bg-amber-50 text-amber-600';
};
const statusLabel = (s: string) => {
  if (s === 'APPROVED') return 'Approuvée';
  if (s === 'REJECTED')  return 'Rejetée';
  return 'En attente';
};

export default function CorrectionsPage() {
  const router = useRouter();
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (!u) { router.push('/login'); return; }
    webApi.corrections.list()
      .then(setCorrections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">Mes corrections</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Historique de tes demandes</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5">
        {loading && (
          <p className="text-[13px] text-gray-400 text-center py-10">Chargement...</p>
        )}

        {!loading && corrections.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-3 text-center">
            <ClipboardList size={28} className="text-gray-300" />
            <p className="text-[13px] text-gray-400">Aucune correction soumise pour l'instant.</p>
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
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[13px] font-semibold text-gray-900 capitalize">{dateStr}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500">"{c.reason}"</p>
                <p className="text-[11px] text-gray-400">Soumise le {submittedAt}</p>
                {c.status !== 'PENDING' && c.approvedBy && (
                  <p className="text-[11px] text-gray-400">
                    Traitée par {c.approvedBy.firstName} {c.approvedBy.lastName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
