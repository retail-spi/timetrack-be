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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
        >
          + Nouveau projet
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-semibold text-lg">Créer un projet</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nom du projet" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2" />
            <input placeholder="Code (ex: PROJ-001)" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="border rounded-lg px-3 py-2" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 && (
          <p className="text-gray-400 col-span-3">Aucun projet trouvé</p>
        )}
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${project.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {project.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm font-mono text-blue-600">{project.code}</p>
            {project.team && (
              <p className="text-sm text-gray-500 mt-2">Équipe : {project.team.name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}