'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT: 'bg-orange-100 text-orange-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  EXPORT: 'bg-gray-100 text-gray-700',
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

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <select value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les actions</option>
          {['CREATE','UPDATE','DELETE','APPROVE','REJECT','LOGIN','EXPORT'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input placeholder="Filtrer par entité..." value={filter.entity}
          onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm flex-1" />
        <button onClick={load}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Filtrer
        </button>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {logs.length === 0 && <p className="text-center text-gray-400 py-8">Aucun log</p>}
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <p className="font-medium text-sm">{log.user?.firstName} {log.user?.lastName}</p>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                {log.action}
              </span>
            </div>
            <p className="text-sm text-gray-600">{log.entity} — <span className="font-mono text-xs">{log.entityId.slice(0, 8)}...</span></p>
            <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString('fr-BE')}</p>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Utilisateur</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Entité</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun log</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString('fr-BE')}</td>
                <td className="px-4 py-3 text-sm font-medium">{log.user?.firstName} {log.user?.lastName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.entity}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}