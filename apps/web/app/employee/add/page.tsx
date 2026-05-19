'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';
import { ChevronLeft, Search, X } from 'lucide-react';
import TimeInput from '@/components/TimeInput';
import { useIsDark } from '../../theme-context';

export default function AddEntryPage() {
  const router  = useRouter();
  const isDark  = useIsDark();
  const [user, setUser]             = useState<any>(null);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [taskTypes, setTaskTypes]   = useState<any[]>([]);
  const [projects, setProjects]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectList, setShowProjectList] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    activityTypeId: '',
    taskTypeId: '',
    projectId: '',
    note: '',
  });

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    webApi.activityTypes.list().then(setActivityTypes).catch(console.error);
    webApi.taskTypes.list().then(setTaskTypes).catch(console.error);
    if (parsed.scope === 'worker') {
      webApi.projects.list().then((p: any[]) => setProjects(p.filter((x) => x.isActive))).catch(console.error);
    }
  }, []);

  // Close project dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setShowProjectList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Calcule les heures ouvrier depuis start/end/break, arrondi au 0.5 le plus proche
  const workerHours: number | null = (() => {
    if (!form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const totalMin = (eh * 60 + em) - (sh * 60 + sm) - (form.breakMinutes || 0);
    if (totalMin <= 0) return null;
    const raw = totalMin / 60;
    return Math.round(raw * 2) / 2;
  })();

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const selectedProject = projects.find((p) => p.id === form.projectId);

  const selectProject = (p: any) => {
    setForm({ ...form, projectId: p.id });
    setProjectSearch('');
    setShowProjectList(false);
  };

  const clearProject = () => {
    setForm({ ...form, projectId: '' });
    setProjectSearch('');
  };

  const submit = async () => {
    setLoading(true);
    try {
      if (user?.scope === 'worker') {
        if (!workerHours || workerHours <= 0) { alert('Heures invalides — vérifiez les horaires saisis.'); setLoading(false); return; }
        await webApi.workerEntries.create({
          date: form.date,
          hours: workerHours,
          taskTypeId: form.taskTypeId,
          projectId: form.projectId || undefined,
          note: form.note,
        });
      } else {
        await webApi.timeEntries.create({
          date: form.date,
          startTime: new Date(`${form.date}T${form.startTime}:00`).toISOString(),
          endTime:   new Date(`${form.date}T${form.endTime}:00`).toISOString(),
          breakMinutes: form.breakMinutes,
          activityTypeId: form.activityTypeId,
          note: form.note,
        });
      }
      router.push('/employee/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const card   = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title  = isDark ? 'text-white' : 'text-gray-900';
  const muted  = isDark ? 'text-gray-500' : 'text-gray-400';
  const input  = `w-full rounded-xl px-3.5 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const label  = `block text-[12px] font-medium mb-1.5 uppercase tracking-wide ${muted}`;
  const optBtn = (active: boolean) => `w-full text-left px-4 py-2.5 rounded-xl border text-[13px] transition-colors ${
    active
      ? isDark ? 'border-blue-500 bg-blue-900/30 text-blue-300 font-medium' : 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
      : isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
  }`;

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 pt-1 mb-5">
        <button
          onClick={() => router.back()}
          className={`p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className={`text-[18px] font-semibold tracking-tight ${title}`}>Saisir mes heures</h1>
      </div>

      <div className={`${card} p-5 space-y-5`}>
        <div>
          <label className={label}>Date</label>
          <input type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={input} />
        </div>

        {user.scope === 'worker' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Début</label>
                <TimeInput value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} />
              </div>
              <div>
                <label className={label}>Fin</label>
                <TimeInput value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} />
              </div>
            </div>
            <div>
              <label className={label}>Pause (minutes)</label>
              <input type="number" value={form.breakMinutes}
                onChange={(e) => setForm({ ...form, breakMinutes: parseInt(e.target.value) || 0 })}
                className={input} />
            </div>
            {workerHours !== null && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium ${isDark ? 'bg-blue-900/20 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                <span>Total calculé</span>
                <span className="text-[16px] font-semibold">{workerHours}h</span>
              </div>
            )}
            <div>
              <label className={label}>Type de tâche</label>
              <div className="space-y-2">
                {taskTypes.map((tt) => (
                  <button key={tt.id} onClick={() => setForm({ ...form, taskTypeId: tt.id })} className={optBtn(form.taskTypeId === tt.id)}>
                    {tt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
              <div>
                <label className={label}>Projet (facultatif)</label>
                {selectedProject ? (
                  <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[13px] ${isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-400 bg-blue-50'}`}>
                    <span>
                      <span className={`font-mono text-[12px] mr-2 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{selectedProject.code}</span>
                      <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>{selectedProject.name}</span>
                    </span>
                    <button onClick={clearProject} className={isDark ? 'text-blue-400 hover:text-blue-200' : 'text-blue-500 hover:text-blue-700'}>
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div ref={projectRef} className="relative">
                    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13px] ${isDark ? 'border-gray-600 bg-[#2a2a2a]' : 'border-gray-200 bg-white'}`}>
                      <Search size={14} className={muted} />
                      <input
                        type="text"
                        placeholder="Rechercher un projet..."
                        value={projectSearch}
                        onFocus={() => setShowProjectList(true)}
                        onChange={(e) => { setProjectSearch(e.target.value); setShowProjectList(true); }}
                        className={`flex-1 bg-transparent outline-none text-[13px] ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>
                    {showProjectList && (
                      <div className={`absolute z-20 left-0 right-0 mt-1.5 rounded-xl border shadow-lg overflow-hidden ${isDark ? 'bg-[#2a2a2a] border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredProjects.length === 0 ? (
                            <p className={`px-3.5 py-3 text-[13px] ${muted}`}>Aucun résultat</p>
                          ) : (
                            filteredProjects.map((p) => (
                              <button
                                key={p.id}
                                onMouseDown={() => selectProject(p)}
                                className={`w-full text-left px-3.5 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                              >
                                <span className={`font-mono text-[11px] shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{p.code}</span>
                                <span className={title}>{p.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Début</label>
                <TimeInput value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} />
              </div>
              <div>
                <label className={label}>Fin</label>
                <TimeInput value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} />
              </div>
            </div>
            <div>
              <label className={label}>Pause (minutes)</label>
              <input type="number" value={form.breakMinutes}
                onChange={(e) => setForm({ ...form, breakMinutes: parseInt(e.target.value) || 0 })}
                className={input} />
            </div>
            <div>
              <label className={label}>Type d'activité</label>
              <div className="space-y-2">
                {activityTypes.map((at) => (
                  <button key={at.id} onClick={() => setForm({ ...form, activityTypeId: at.id })} className={optBtn(form.activityTypeId === at.id)}>
                    {at.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className={label}>Note (facultatif)</label>
          <textarea value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className={`${input} resize-none`} rows={3} />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
