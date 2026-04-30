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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          + Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-semibold text-lg">Créer un utilisateur</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Prénom" value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="border rounded-lg px-3 py-2" />
            <input placeholder="Nom" value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="border rounded-lg px-3 py-2" />
            <input placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-3 py-2" />
            <input placeholder="Mot de passe" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border rounded-lg px-3 py-2" />
            <select value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border rounded-lg px-3 py-2">
              <option value="EMPLOYEE">Employé</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">RH</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <select value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="border rounded-lg px-3 py-2">
              <option value="employee_office">Bureau</option>
              <option value="employee_commercial">Commercial</option>
              <option value="worker">Ouvrier</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={submit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">
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
                  <button
                    onClick={() => toggleActive(user)}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
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