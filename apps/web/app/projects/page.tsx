'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';

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

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

  if (loading) return <div className="p-8 text-[13px] text-gray-400 dark:text-gray-500">Chargement...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">Projets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Nouveau
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Nouveau projet</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              placeholder="Nom du projet"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Code (ex: PROJ-001)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={submit}
              className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors"
            >
              Créer le projet
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-[13px] font-medium py-2.5 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showForm && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">Aucun projet pour le moment</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">{project.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                project.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/40 text-red-500 dark:text-red-400'
              }`}>
                {project.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-[12px] font-mono text-blue-500 dark:text-blue-400">{project.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
