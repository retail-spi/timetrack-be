'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { SlidersHorizontal } from 'lucide-react';

const actionStyle: Record<string, string> = {
  CREATE:  'bg-emerald-50 text-emerald-600',
  UPDATE:  'bg-blue-50 text-blue-600',
  DELETE:  'bg-red-50 text-red-500',
  APPROVE: 'bg-teal-50 text-teal-600',
  REJECT:  'bg-orange-50 text-orange-600',
  LOGIN:   'bg-purple-50 text-purple-600',
  EXPORT:  'bg-gray-100 text-gray-500',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entity: '', action: '' });

  const load = async () => {
    const data = await webApi.auditLogs.list(filter);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const inputClass = 'border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors bg-white';

  if (loading) return <div className="p-8 text-[13px] text-gray-400">Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight mb-6">Audit logs</h1>

      <div className="flex flex-col md:flex-row gap-2 mb-5">
        <select
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className={inputClass}
        >
          <option value="">Toutes les actions</option>
          {['CREATE','UPDATE','DELETE','APPROVE','REJECT','LOGIN','EXPORT'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          placeholder="Filtrer par entité..."
          value={filter.entity}
          onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
          className={`${inputClass} flex-1`}
        />
        <button
          onClick={load}
          className="flex items-center justify-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <SlidersHorizontal size={14} /> Filtrer
        </button>
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {logs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-[13px] text-gray-400">Aucun log</p>
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[13px] font-medium text-gray-900">{log.user?.firstName} {log.user?.lastName}</p>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${actionStyle[log.action] || 'bg-gray-100 text-gray-500'}`}>
                {log.action}
              </span>
            </div>
            <p className="text-[12px] text-gray-500">{log.entity} · <span className="font-mono">{log.entityId.slice(0, 8)}…</span></p>
            <p className="text-[11px] text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString('fr-BE')}</p>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Entité</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[13px] text-gray-400">Aucun log</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-[12px] text-gray-400">{new Date(log.createdAt).toLocaleString('fr-BE')}</td>
                <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{log.user?.firstName} {log.user?.lastName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${actionStyle[log.action] || 'bg-gray-100 text-gray-500'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-500">{log.entity}</td>
                <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">{log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
