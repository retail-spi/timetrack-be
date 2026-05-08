'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';

const contractTypeLabel: Record<string, string> = {
  HOURS_38: '38h / semaine',
  HOURS_20: '20h / semaine',
  CUSTOM: 'Personnalisé',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    userId: '', contractType: 'HOURS_38', weeklyHours: 38, startDate: '',
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

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

  if (loading) return <div className="p-8 text-[13px] text-gray-400">Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Contrats</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Nouveau
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Nouveau contrat</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <select value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className={inputClass}>
              <option value="">Sélectionner un employé</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
            <select value={form.contractType}
              onChange={(e) => {
                const type = e.target.value;
                setForm({ ...form, contractType: type, weeklyHours: type === 'HOURS_38' ? 38 : type === 'HOURS_20' ? 20 : form.weeklyHours });
              }}
              className={inputClass}>
              <option value="HOURS_38">38h / semaine</option>
              <option value="HOURS_20">20h / semaine</option>
              <option value="CUSTOM">Personnalisé</option>
            </select>
            {form.contractType === 'CUSTOM' && (
              <input type="number" placeholder="Heures / semaine" value={form.weeklyHours}
                onChange={(e) => setForm({ ...form, weeklyHours: parseFloat(e.target.value) })}
                className={inputClass} />
            )}
            <input type="date" value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={inputClass} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit}
              className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors">
              Créer le contrat
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-medium py-2.5 rounded-xl transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {contracts.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{c.user?.firstName} {c.user?.lastName}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">{contractTypeLabel[c.contractType] || c.contractType}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Depuis le {new Date(c.startDate).toLocaleDateString('fr-BE')}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                c.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {c.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Employé</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Heures / sem</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Depuis</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{c.user?.firstName} {c.user?.lastName}</td>
                <td className="px-4 py-3 text-[13px] text-gray-500">{contractTypeLabel[c.contractType] || c.contractType}</td>
                <td className="px-4 py-3 text-[13px] text-gray-500">{c.weeklyHours}h</td>
                <td className="px-4 py-3 text-[13px] text-gray-500">{new Date(c.startDate).toLocaleDateString('fr-BE')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    c.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
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
