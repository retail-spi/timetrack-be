'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';

const scopeLabel: Record<string, string> = {
  employee_office: 'Bureau',
  employee_commercial: 'Commercial',
  worker: 'Ouvrier',
};

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR: 'RH',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employé',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '',
    role: 'EMPLOYEE', scope: 'employee_office', password: 'ChangeMe123!',
  });

  const load = async () => {
    const data = await webApi.users.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    await webApi.users.create(form);
    setShowForm(false);
    setForm({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', scope: 'employee_office', password: 'ChangeMe123!' });
    await load();
  };

  const toggleActive = async (user: any) => {
    await webApi.users.update(user.id, { isActive: !user.isActive });
    await load();
  };

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

  if (loading) return <div className="p-8 text-[13px] text-gray-400 dark:text-gray-500">Chargement...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">Utilisateurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Nouveau
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-5 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Nouvel utilisateur</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Prénom" value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className={inputClass} />
            <input placeholder="Nom" value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className={inputClass} />
            <input placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass} />
            <input placeholder="Mot de passe" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass} />
            <select value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}>
              <option value="EMPLOYEE">Employé</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">RH</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <select value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className={inputClass}>
              <option value="employee_office">Bureau</option>
              <option value="employee_commercial">Commercial</option>
              <option value="worker">Ouvrier</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit}
              className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors">
              Créer l'utilisateur
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-[13px] font-medium py-2.5 rounded-xl transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[14px] font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    {roleLabel[user.role] || user.role}
                  </span>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    {scopeLabel[user.scope] || user.scope}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  user.isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/40 text-red-500 dark:text-red-400'
                }`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
                <button onClick={() => toggleActive(user)}
                  className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {user.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    {roleLabel[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    {scopeLabel[user.scope] || user.scope}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    user.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-900/40 text-red-500 dark:text-red-400'
                  }`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleActive(user)}
                    className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {user.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
