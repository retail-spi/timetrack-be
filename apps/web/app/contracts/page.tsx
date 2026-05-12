'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import { useIsDark } from '../theme-context';

const contractTypeLabel: Record<string, string> = {
  HOURS_38: '38h / semaine',
  HOURS_20: '20h / semaine',
  CUSTOM:   'Personnalisé',
};

export default function ContractsPage() {
  const isDark = useIsDark();
  const [contracts, setContracts]       = useState<any[]>([]);
  const [users, setUsers]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editHours, setEditHours] = useState<number>(38);
  const [editType, setEditType]   = useState<string>('HOURS_38');
  const [form, setForm] = useState({ userId: '', contractType: 'HOURS_38', weeklyHours: 38, startDate: '' });

  const load = async () => {
    const [c, u] = await Promise.all([webApi.contracts.list(), webApi.users.list()]);
    setContracts(c); setUsers(u); setLoading(false);
  };
  useEffect(() => {
    try { setIsSuperAdmin(JSON.parse(localStorage.getItem('auth_user') || '{}').role === 'SUPER_ADMIN'); } catch {}
    load();
  }, []);

  const submit = async () => {
    if (!form.userId || !form.startDate) return;
    await webApi.contracts.create(form);
    setShowForm(false); setForm({ userId: '', contractType: 'HOURS_38', weeklyHours: 38, startDate: '' });
    await load();
  };

  const startEdit = (c: any) => {
    setEditId(c.id); setEditHours(c.weeklyHours); setEditType(c.contractType);
  };

  const saveEdit = async (id: string) => {
    const hours = editType === 'HOURS_38' ? 38 : editType === 'HOURS_20' ? 20 : editHours;
    await webApi.contracts.update(id, { contractType: editType, weeklyHours: hours });
    setEditId(null); await load();
  };

  const deleteContract = async (id: string) => {
    if (!confirm('Supprimer ce contrat ?')) return;
    await webApi.contracts.delete(id); await load();
  };

  const card   = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title  = isDark ? 'text-white' : 'text-gray-900';
  const sub    = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted  = isDark ? 'text-gray-500' : 'text-gray-400';
  const input  = `rounded-xl px-3 py-2 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const inputFull = `w-full ${input}`;
  const row    = `border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/50 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`;
  const cancel = `flex-1 text-[13px] font-medium py-2.5 rounded-xl transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`;
  const badgeStatus = (on: boolean) => on
    ? (isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
    : (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500');

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>Contrats</h1>
        {isSuperAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors">
            <Plus size={15} /> Nouveau
          </button>
        )}
      </div>

      {showForm && (
        <div className={`${card} p-5 mb-5 max-w-md`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-[15px] font-semibold ${title}`}>Nouveau contrat</h2>
            <button onClick={() => setShowForm(false)} className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={inputFull}>
              <option value="">Sélectionner un employé</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>)}
            </select>
            <select value={form.contractType} onChange={(e) => {
              const t = e.target.value;
              setForm({ ...form, contractType: t, weeklyHours: t === 'HOURS_38' ? 38 : t === 'HOURS_20' ? 20 : form.weeklyHours });
            }} className={inputFull}>
              <option value="HOURS_38">38h / semaine</option>
              <option value="HOURS_20">20h / semaine</option>
              <option value="CUSTOM">Personnalisé</option>
            </select>
            {form.contractType === 'CUSTOM' && (
              <input type="number" placeholder="Heures / semaine" value={form.weeklyHours}
                onChange={(e) => setForm({ ...form, weeklyHours: parseFloat(e.target.value) })} className={inputFull} />
            )}
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputFull} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit} className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors">Créer le contrat</button>
            <button onClick={() => setShowForm(false)} className={cancel}>Annuler</button>
          </div>
        </div>
      )}

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {contracts.map((c) => (
          <div key={c.id} className={`${card} p-4`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className={`text-[14px] font-semibold ${title}`}>{c.user?.firstName} {c.user?.lastName}</p>
                <p className={`text-[11px] ${muted}`}>{c.user?.email}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStatus(c.isActive)}`}>{c.isActive ? 'Actif' : 'Inactif'}</span>
            </div>
            {editId === c.id ? (
              <div className="space-y-2 mt-2">
                <select value={editType} onChange={(e) => setEditType(e.target.value)} className={inputFull}>
                  <option value="HOURS_38">38h / semaine</option>
                  <option value="HOURS_20">20h / semaine</option>
                  <option value="CUSTOM">Personnalisé</option>
                </select>
                {editType === 'CUSTOM' && <input type="number" value={editHours} onChange={(e) => setEditHours(parseFloat(e.target.value))} className={inputFull} />}
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(c.id)} className="flex-1 bg-[#0071E3] text-white text-[13px] py-2 rounded-xl">Enregistrer</button>
                  <button onClick={() => setEditId(null)} className={cancel}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className={`text-[13px] ${sub}`}>{contractTypeLabel[c.contractType] || c.contractType} · {c.weeklyHours}h</p>
                  <p className={`text-[12px] ${muted}`}>Depuis le {new Date(c.startDate).toLocaleDateString('fr-BE')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className={`p-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-white/10' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'}`}><Pencil size={14} /></button>
                  <button onClick={() => deleteContract(c.id)} className={`p-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-white/10' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className={`hidden md:block ${card} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
              {['Employé','Email','Type','Heures / sem','Depuis','Statut',''].map((h) => (
                <th key={h} className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className={row}>
                <td className={`px-4 py-3 text-[13px] font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{c.user?.firstName} {c.user?.lastName}</td>
                <td className={`px-4 py-3 text-[12px] ${muted}`}>{c.user?.email}</td>
                {editId === c.id ? (
                  <>
                    <td className="px-4 py-2" colSpan={2}>
                      <div className="flex gap-2">
                        <select value={editType} onChange={(e) => setEditType(e.target.value)} className={input}>
                          <option value="HOURS_38">38h</option>
                          <option value="HOURS_20">20h</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                        {editType === 'CUSTOM' && (
                          <input type="number" value={editHours} onChange={(e) => setEditHours(parseFloat(e.target.value))} className={`${input} w-20`} />
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-[13px] ${sub}`}>{new Date(c.startDate).toLocaleDateString('fr-BE')}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStatus(c.isActive)}`}>{c.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(c.id)} className={`p-1.5 rounded-lg ${isDark ? 'text-green-400 hover:bg-white/10' : 'text-green-600 hover:bg-gray-100'}`}><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className={`p-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'}`}><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`px-4 py-3 text-[13px] ${sub}`}>{contractTypeLabel[c.contractType] || c.contractType}</td>
                    <td className={`px-4 py-3 text-[13px] font-semibold ${sub}`}>{c.weeklyHours}h</td>
                    <td className={`px-4 py-3 text-[13px] ${sub}`}>{new Date(c.startDate).toLocaleDateString('fr-BE')}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStatus(c.isActive)}`}>{c.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(c)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-white/10' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'}`}><Pencil size={14} /></button>
                        <button onClick={() => deleteContract(c.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-white/10' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
