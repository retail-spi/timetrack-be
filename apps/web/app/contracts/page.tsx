'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';
import { useIsDark } from '../theme-context';

const contractTypeLabel: Record<string, string> = { HOURS_38: '38h / semaine', HOURS_20: '20h / semaine', CUSTOM: 'Personnalisé' };

export default function ContractsPage() {
  const isDark = useIsDark();
  const [contracts, setContracts] = useState<any[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm] = useState({ userId: '', contractType: 'HOURS_38', weeklyHours: 38, startDate: '' });

  const load = async () => { const [c, u] = await Promise.all([webApi.contracts.list(), webApi.users.list()]); setContracts(c); setUsers(u); setLoading(false); };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.userId || !form.startDate) return;
    await webApi.contracts.create(form);
    setShowForm(false); setForm({ userId: '', contractType: 'HOURS_38', weeklyHours: 38, startDate: '' }); await load();
  };

  const card   = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title  = isDark ? 'text-white' : 'text-gray-900';
  const sub    = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted  = isDark ? 'text-gray-500' : 'text-gray-400';
  const input  = `w-full rounded-xl px-3.5 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const row    = `border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/50 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`;
  const cancel = `flex-1 text-[13px] font-medium py-2.5 rounded-xl transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`;
  const badgeStatus = (on: boolean) => on ? (isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500');

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>Contrats</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors">
          <Plus size={15} /> Nouveau
        </button>
      </div>

      {showForm && (
        <div className={`${card} p-5 mb-5 max-w-md`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-[15px] font-semibold ${title}`}>Nouveau contrat</h2>
            <button onClick={() => setShowForm(false)} className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={input}>
              <option value="">Sélectionner un employé</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
            <select value={form.contractType} onChange={(e) => { const t = e.target.value; setForm({ ...form, contractType: t, weeklyHours: t === 'HOURS_38' ? 38 : t === 'HOURS_20' ? 20 : form.weeklyHours }); }} className={input}>
              <option value="HOURS_38">38h / semaine</option><option value="HOURS_20">20h / semaine</option><option value="CUSTOM">Personnalisé</option>
            </select>
            {form.contractType === 'CUSTOM' && <input type="number" placeholder="Heures / semaine" value={form.weeklyHours} onChange={(e) => setForm({ ...form, weeklyHours: parseFloat(e.target.value) })} className={input} />}
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={input} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit} className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors">Créer le contrat</button>
            <button onClick={() => setShowForm(false)} className={cancel}>Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-2.5 md:hidden">
        {contracts.map((c) => (
          <div key={c.id} className={`${card} p-4`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-[14px] font-semibold ${title}`}>{c.user?.firstName} {c.user?.lastName}</p>
                <p className={`text-[13px] mt-0.5 ${sub}`}>{contractTypeLabel[c.contractType] || c.contractType}</p>
                <p className={`text-[12px] mt-0.5 ${muted}`}>Depuis le {new Date(c.startDate).toLocaleDateString('fr-BE')}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStatus(c.isActive)}`}>{c.isActive ? 'Actif' : 'Inactif'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`hidden md:block ${card} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
              {['Employé','Type','Heures / sem','Depuis','Statut'].map((h) => (
                <th key={h} className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className={row}>
                <td className={`px-4 py-3 text-[13px] font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{c.user?.firstName} {c.user?.lastName}</td>
                <td className={`px-4 py-3 text-[13px] ${sub}`}>{contractTypeLabel[c.contractType] || c.contractType}</td>
                <td className={`px-4 py-3 text-[13px] ${sub}`}>{c.weeklyHours}h</td>
                <td className={`px-4 py-3 text-[13px] ${sub}`}>{new Date(c.startDate).toLocaleDateString('fr-BE')}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStatus(c.isActive)}`}>{c.isActive ? 'Actif' : 'Inactif'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
