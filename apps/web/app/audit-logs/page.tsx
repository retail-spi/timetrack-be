'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { SlidersHorizontal } from 'lucide-react';
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

export default function AuditLogsPage() {
  const isDark = useIsDark();
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState({ entity: '', action: '' });

  const load = async () => { setLogs(await webApi.auditLogs.list(filter)); setLoading(false); };
  useEffect(() => { load(); }, []);

  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const row   = `border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/50 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`;
  const input = `rounded-xl px-3.5 py-2 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const aColors = actionColors(isDark);
  const fallbackBadge = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500';

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <h1 className={`text-[22px] font-semibold tracking-tight mb-6 ${title}`}>Audit logs</h1>

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
    </div>
  );
}
