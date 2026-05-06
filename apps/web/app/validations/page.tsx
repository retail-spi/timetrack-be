'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';

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

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Validations</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('entries')}
          className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium text-sm ${tab === 'entries' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Entrées ({entries.length})
        </button>
        <button
          onClick={() => setTab('corrections')}
          className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium text-sm ${tab === 'corrections' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Corrections ({corrections.length})
        </button>
      </div>

      {tab === 'entries' && (
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-gray-500 text-center py-8">Aucune entrée en attente</p>}
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{e.user?.firstName} {e.user?.lastName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(e.date).toLocaleDateString('fr-BE')} — {e.activityType?.label}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                    {e.breakMinutes > 0 && ` (pause ${e.breakMinutes}min)`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => webApi.timeEntries.approve(e.id).then(load)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  ✓ Approuver
                </button>
                <button
                  onClick={() => webApi.timeEntries.reject(e.id).then(load)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  ✗ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'corrections' && (
        <div className="space-y-3">
          {corrections.length === 0 && <p className="text-gray-500 text-center py-8">Aucune correction en attente</p>}
          {corrections.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="font-medium">{c.submittedBy?.firstName} {c.submittedBy?.lastName}</p>
              <p className="text-sm text-gray-500 mb-2">{c.reason}</p>
              <pre className="text-xs bg-gray-50 rounded p-2 mb-3 overflow-auto">
                {JSON.stringify(c.proposedData, null, 2)}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={() => webApi.corrections.approve(c.id).then(load)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  ✓ Approuver
                </button>
                <button
                  onClick={() => webApi.corrections.reject(c.id).then(load)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  ✗ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}