'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    contractType: 'HOURS_38',
    weeklyHours: 38,
    startDate: '',
  });

  const load = async () => {
    const [c, u] = await Promise.all([webApi.contracts.list(), webApi.users.list()]);
    setContracts(c);
    setUsers(u);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.userId || !form.startDate) return;
    await webApi.contracts.create(form);
    setShowForm(false);
    setForm({ userId: '', contractType: 'HOURS_38', weeklyHours: 38, startDate: '' });
    await load();
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contrats</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          + Nouveau contrat
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-semibold text-lg">Créer un contrat</h2>
          <div className="grid grid-cols-2 gap-4">
            <select value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="border rounded-lg px-3 py-2">
              <option value="">Sélectionner un employé</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
            <select value={form.contractType}
              onChange={(e) => {
                const type = e.target.value;
                setForm({
                  ...form,
                  contractType: type,
                  weeklyHours: type === 'HOURS_38' ? 38 : type === 'HOURS_20' ? 20 : form.weeklyHours,
                });
              }}
              className="border rounded-lg px-3 py-2">
              <option value="HOURS_38">38h/semaine</option>
              <option value="HOURS_20">20h/semaine</option>
              <option value="CUSTOM">Custom</option>
            </select>
            {form.contractType === 'CUSTOM' && (
              <input type="number" placeholder="Heures/semaine"
                value={form.weeklyHours}
                onChange={(e) => setForm({ ...form, weeklyHours: parseFloat(e.target.value) })}
                className="border rounded-lg px-3 py-2" />
            )}
            <input type="date" value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="border rounded-lg px-3 py-2" />
          </div>
          <div className="flex gap-3">
            <button onClick={submit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              Créer
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Employé</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Heures/sem</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Début</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun contrat</td></tr>
            )}
            {contracts.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {c.user?.firstName} {c.user?.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.contractType}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.weeklyHours}h</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(c.startDate).toLocaleDateString('fr-BE')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}