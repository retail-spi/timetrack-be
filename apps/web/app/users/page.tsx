'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';

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

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Utilisateurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
        >
          + Nouveau
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <h2 className="font-semibold">Créer un utilisateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Prénom" value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Nom" value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Mot de passe" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm" />
            <select value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="EMPLOYEE">Employé</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">RH</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <select value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="employee_office">Bureau</option>
              <option value="employee_commercial">Commercial</option>
              <option value="worker">Ouvrier</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={submit}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
              Créer
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste mobile */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                    {user.role}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                    {user.scope}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
                <button onClick={() => toggleActive(user)}
                  className="text-xs text-gray-500 hover:text-red-600">
                  {user.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rôle</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Scope</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">{user.scope}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(user)}
                    className="text-sm text-gray-500 hover:text-red-600">
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