'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Check, X } from 'lucide-react';
import { useIsDark } from '../theme-context';

export default function ValidationsPage() {
  const isDark = useIsDark();
  const [entries, setEntries]         = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [tab, setTab]     = useState<'entries' | 'corrections'>('entries');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [e, c] = await Promise.all([webApi.timeEntries.list(), webApi.corrections.list()]);
    setEntries(e.filter((x: any) => x.status === 'PENDING'));
    setCorrections(c.filter((x: any) => x.status === 'PENDING'));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className={`text-[22px] font-semibold tracking-tight mb-6 ${title}`}>Validations</h1>

      <div className={`flex rounded-xl p-1 mb-6 max-w-xs ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
        {([['entries', 'Entrées', entries.length], ['corrections', 'Corrections', corrections.length]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              tab === key
                ? isDark ? 'bg-[#3a3a3a] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}{count > 0 ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      {tab === 'entries' && (
        <div className="space-y-3">
          {entries.length === 0 && <div className={`${card} p-10 text-center`}><p className={`text-[13px] ${muted}`}>Aucune entrée en attente</p></div>}
          {entries.map((e) => (
            <div key={e.id} className={`${card} p-4`}>
              <div className="mb-3">
                <p className={`text-[14px] font-semibold ${title}`}>{e.user?.firstName} {e.user?.lastName}</p>
                <p className={`text-[13px] mt-0.5 ${sub}`}>{new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}{e.activityType && ` — ${e.activityType.label}`}</p>
                <p className={`text-[12px] mt-0.5 ${muted}`}>{new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })} → {new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}{e.breakMinutes > 0 && ` · pause ${e.breakMinutes} min`}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => webApi.timeEntries.approve(e.id).then(load)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"><Check size={14} /> Approuver</button>
                <button onClick={() => webApi.timeEntries.reject(e.id).then(load)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"><X size={14} /> Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'corrections' && (
        <div className="space-y-3">
          {corrections.length === 0 && <div className={`${card} p-10 text-center`}><p className={`text-[13px] ${muted}`}>Aucune correction en attente</p></div>}
          {corrections.map((c) => (
            <div key={c.id} className={`${card} p-4`}>
              <p className={`text-[14px] font-semibold mb-0.5 ${title}`}>{c.submittedBy?.firstName} {c.submittedBy?.lastName}</p>
              <p className={`text-[13px] mb-3 ${sub}`}>{c.reason}</p>
              <pre className={`text-[11px] rounded-xl p-3 mb-3 overflow-auto border ${isDark ? 'bg-[#2a2a2a] border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>{JSON.stringify(c.proposedData, null, 2)}</pre>
              <div className="flex gap-2">
                <button onClick={() => webApi.corrections.approve(c.id).then(load)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"><Check size={14} /> Approuver</button>
                <button onClick={() => webApi.corrections.reject(c.id).then(load)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium py-2 rounded-xl transition-colors"><X size={14} /> Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
