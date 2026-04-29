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

  const approve = async (id: string) => {
    await webApi.timeEntries.approve(id);
    await load();
  };

  const reject = async (id: string) => {
    await webApi.timeEntries.reject(id);
    await load();
  };

  const approveCorrection = async (id: string) => {
    await webApi.corrections.approve(id);
    await load();
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Validations</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('entries')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'entries' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Entrées ({entries.length})
        </button>
        <button
          onClick={() => setTab('corrections')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'corrections' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Corrections ({corrections.length})
        </button>
      </div>

      {tab === 'entries' && (
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-gray-500">Aucune entrée en attente</p>}
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium">{e.user?.firstName} {e.user?.lastName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(e.date).toLocaleDateString('fr-BE')} — {e.activityType?.label}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve(e.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                  ✓ Approuver
                </button>
                <button onClick={() => reject(e.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                  ✗ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'corrections' && (
        <div className="space-y-3">
          {corrections.length === 0 && <p className="text-gray-500">Aucune correction en attente</p>}
          {corrections.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{c.submittedBy?.firstName} {c.submittedBy?.lastName}</p>
                  <p className="text-sm text-gray-500">{c.reason}</p>
                  <pre className="text-xs bg-gray-50 rounded p-2 mt-2">
                    {JSON.stringify(c.proposedData, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => approveCorrection(c.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                    ✓
                  </button>
                  <button onClick={() => webApi.corrections.reject(c.id).then(load)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    ✗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
