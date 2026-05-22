'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { SlidersHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import { useIsDark } from '../theme-context';

const actionColors = (isDark: boolean): Record<string, string> => ({
  CREATE:  isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
  UPDATE:  isDark ? 'bg-blue-900/40 text-blue-400'       : 'bg-blue-50 text-blue-600',
  DELETE:  isDark ? 'bg-red-900/40 text-red-400'         : 'bg-red-50 text-red-500',
  APPROVE: isDark ? 'bg-teal-900/40 text-teal-400'       : 'bg-teal-50 text-teal-600',
  REJECT:  isDark ? 'bg-orange-900/40 text-orange-400'   : 'bg-orange-50 text-orange-600',
  LOGIN:   isDark ? 'bg-purple-900/40 text-purple-400'   : 'bg-purple-50 text-purple-600',
  EXPORT:  isDark ? 'bg-gray-700 text-gray-300'          : 'bg-gray-100 text-gray-500',
});

type ResetTarget = 'entries' | 'logs' | null;

export default function AuditLogsPage() {
  const isDark = useIsDark();
  const [logs, setLogs]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState({ entity: '', action: '' });
  const [confirm, setConfirm]     = useState<ResetTarget>(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => { setLogs(await webApi.auditLogs.list(filter)); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      if (confirm === 'entries') await webApi.admin.resetEntries();
      if (confirm === 'logs')    await webApi.auditLogs.reset();
      setConfirm(null);
      if (confirm === 'logs') await load();
    } finally {
      setResetting(false);
    }
  };

  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const row   = `border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/50 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`;
  const input = `rounded-xl px-3.5 py-2 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const aColors = actionColors(isDark);
  const fallbackBadge = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500';

  const resetLabel = confirm === 'entries' ? 'tout l\'historique de pointage' : 'tous les audit logs';

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <h1 className={`text-[22px] font-semibold tracking-tight mb-6 ${title}`}>Audit logs</h1>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-2 mb-5">
        <select value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })} className={input}>
          <option value="">Toutes les actions</option>
          {['CREATE','UPDATE','DELETE','APPROVE','REJECT','LOGIN','EXPORT'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input placeholder="Filtrer par entité..." value={filter.entity} onChange={(e) => setFilter({ ...filter, entity: e.target.value })} className={`${input} flex-1`} />
        <button onClick={load} className="flex items-center justify-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-4 py-2 rounded-xl transition-colors">
          <SlidersHorizontal size={14} /> Filtrer
        </button>
      </div>

      {/* Logs mobile */}
      <div className="space-y-2.5 md:hidden">
        {logs.length === 0 && <div className={`${card} p-10 text-center`}><p className={`text-[13px] ${muted}`}>Aucun log</p></div>}
        {logs.map((log) => (
          <div key={log.id} className={`${card} p-4`}>
            <div className="flex justify-between items-start mb-1">
              <p className={`text-[13px] font-medium ${title}`}>{log.user?.firstName}</p>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${aColors[log.action] || fallbackBadge}`}>{log.action}</span>
            </div>
            <p className={`text-[12px] ${sub}`}>{log.entity} · <span className="font-mono">{log.entityId.slice(0, 8)}…</span></p>
            <p className={`text-[11px] mt-1 ${muted}`}>{new Date(log.createdAt).toLocaleString('fr-BE')}</p>
          </div>
        ))}
      </div>

      {/* Logs desktop */}
      <div className={`hidden md:block ${card} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
              {['Date','Utilisateur','Action','Entité','ID'].map((h) => (
                <th key={h} className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={5} className={`text-center py-10 text-[13px] ${muted}`}>Aucun log</td></tr>}
            {logs.map((log) => (
              <tr key={log.id} className={row}>
                <td className={`px-4 py-3 text-[12px] ${muted}`}>{new Date(log.createdAt).toLocaleString('fr-BE')}</td>
                <td className={`px-4 py-3 text-[13px] font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{log.user?.firstName}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${aColors[log.action] || fallbackBadge}`}>{log.action}</span></td>
                <td className={`px-4 py-3 text-[13px] ${sub}`}>{log.entity}</td>
                <td className={`px-4 py-3 text-[11px] font-mono ${muted}`}>{log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zone dangereuse */}
      <div className={`mt-8 rounded-2xl border p-5 ${isDark ? 'border-red-900/50 bg-red-950/20' : 'border-red-200 bg-red-50/50'}`}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className={isDark ? 'text-red-400' : 'text-red-500'} />
          <h2 className={`text-[14px] font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>Zone dangereuse</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setConfirm('entries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-colors ${isDark ? 'border-red-800 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-100'}`}
          >
            <Trash2 size={14} /> Vider l'historique de pointage
          </button>
          <button
            onClick={() => setConfirm('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-colors ${isDark ? 'border-red-800 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-100'}`}
          >
            <Trash2 size={14} /> Vider les audit logs
          </button>
        </div>
      </div>

      {/* Modale de confirmation */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
              <AlertTriangle size={20} className={isDark ? 'text-red-400' : 'text-red-500'} />
            </div>
            <h3 className={`text-[16px] font-semibold mb-2 ${title}`}>Confirmer la suppression</h3>
            <p className={`text-[13px] mb-6 ${sub}`}>
              Tu vas supprimer définitivement <strong>{resetLabel}</strong>. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
              >
                {resetting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
