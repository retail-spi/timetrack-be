'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Check, X } from 'lucide-react';

export default function ValidationsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [tab, setTab] = useState<'entries' | 'corrections'>('entries');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [e, c] = await Promise.all([webApi.timeEntries.list(), webApi.corrections.list()]);
    setEntries(e.filter((x: any) => x.status === 'PENDING'));
    setCorrections(c.filter((x: any) => x.status === 'PENDING'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8 text-[13px] text-gray-400">Chargement...</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight mb-6">Validations</h1>

      {/* Segmented control iOS-style */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
        {([['entries', 'Entrées', entries.length], ['corrections', 'Corrections', corrections.length]] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              tab === key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}{count > 0 ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      {tab === 'entries' && (
        <div className="space-y-3">
          {entries.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-[13px] text-gray-400">Aucune entrée en attente</p>
            </div>
          )}
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="mb-3">
                <p className="text-[14px] font-semibold text-gray-900">{e.user?.firstName} {e.user?.lastName}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {e.activityType && ` — ${e.activityType.label}`}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                  {e.breakMinutes > 0 && ` · pause ${e.breakMinutes} min`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => webApi.timeEntries.approve(e.id).then(load)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"
                >
                  <Check size={14} /> Approuver
                </button>
                <button
                  onClick={() => webApi.timeEntries.reject(e.id).then(load)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"
                >
                  <X size={14} /> Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'corrections' && (
        <div className="space-y-3">
          {corrections.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-[13px] text-gray-400">Aucune correction en attente</p>
            </div>
          )}
          {corrections.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[14px] font-semibold text-gray-900 mb-0.5">{c.submittedBy?.firstName} {c.submittedBy?.lastName}</p>
              <p className="text-[13px] text-gray-500 mb-3">{c.reason}</p>
              <pre className="text-[11px] bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3 overflow-auto text-gray-600">
                {JSON.stringify(c.proposedData, null, 2)}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={() => webApi.corrections.approve(c.id).then(load)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"
                >
                  <Check size={14} /> Approuver
                </button>
                <button
                  onClick={() => webApi.corrections.reject(c.id).then(load)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"
                >
                  <X size={14} /> Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
