'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });

  const load = async () => {
    const data = await webApi.projects.list();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name || !form.code) return;
    await webApi.projects.create(form);
    setShowForm(false);
    setForm({ name: '', code: '' });
    await load();
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Projets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-green-700"
        >
          + Nouveau
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <h2 className="font-semibold">Créer un projet</h2>
          <input placeholder="Nom du projet" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Code (ex: PROJ-001)" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-8">Aucun projet</p>
        )}
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${project.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {project.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm font-mono text-blue-600">{project.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}