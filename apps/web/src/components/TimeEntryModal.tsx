'use client';
import { useEffect, useRef, useState } from 'react';
import { webApi } from '@/lib/api';
import { X, Search } from 'lucide-react';
import TimeInput from './TimeInput';
import { useIsDark } from '../../app/theme-context';

interface Props {
  date: string;
  user: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function TimeEntryModal({ date, user, onClose, onSaved }: Props) {
  const isDark = useIsDark();
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [taskTypes, setTaskTypes]         = useState<any[]>([]);
  const [projects, setProjects]           = useState<any[]>([]);
  const [contractHours, setContractHours] = useState<number>(38);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectList, setShowProjectList] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    startTime: '', endTime: '', breakMinutes: 0,
    activityTypeId: '', taskTypeId: '', projectId: '', note: '',
  });

  useEffect(() => {
    webApi.activityTypes.list().then(setActivityTypes).catch(console.error);
    webApi.taskTypes.list().then(setTaskTypes).catch(console.error);
    webApi.contracts.mine().then((c) => { if (c?.weeklyHours) setContractHours(c.weeklyHours); }).catch(console.error);
    if (user?.scope === 'worker') {
      webApi.projects.list().then((p: any[]) => setProjects(p.filter((x) => x.isActive))).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setShowProjectList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const workerHours: number | null = (() => {
    if (!form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const totalMin = (eh * 60 + em) - (sh * 60 + sm) - (form.breakMinutes || 0);
    if (totalMin <= 0) return null;
    return Math.round((totalMin / 60) * 2) / 2;
  })();

  const selectedProject = projects.find((p) => p.id === form.projectId);
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const submit = async () => {
    setError('');
    if (user?.scope === 'worker') {
      if (!workerHours || workerHours <= 0) return setError('Indique une heure de début et de fin valides.');
      if (!form.taskTypeId) return setError('Sélectionne un type de tâche.');
    } else {
      if (!form.startTime || !form.endTime) return setError('Indique l\'heure de début et de fin.');
      if (!form.activityTypeId) return setError('Sélectionne un type d\'activité.');
    }
    setLoading(true);
    try {
      if (user?.scope === 'worker') {
        await webApi.workerEntries.create({
          date,
          hours: workerHours!,
          taskTypeId: form.taskTypeId,
          projectId: form.projectId || undefined,
          note: form.note,
        });
      } else {
        await webApi.timeEntries.create({
          date,
          startTime: new Date(`${date}T${form.startTime}:00`).toISOString(),
          endTime:   new Date(`${date}T${form.endTime}:00`).toISOString(),
          breakMinutes: form.breakMinutes,
          activityTypeId: form.activityTypeId,
          note: form.note,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const inputClass = `w-full rounded-xl px-3 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${
    isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100 placeholder:text-gray-500' : 'border-gray-200 bg-white text-gray-900'
  }`;
  const labelClass = `block text-[12px] font-medium mb-1.5 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const optBtn = (active: boolean) => `px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${
    active
      ? isDark ? 'border-blue-500 bg-blue-900/30 text-blue-300 font-medium' : 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
      : isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-[calc(100vw-2rem)] max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>

        <div className={`flex-shrink-0 flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="min-w-0 mr-3">
            <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Pointer</h2>
            <p className={`text-[12px] capitalize mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{dateLabel}</p>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Préremplir — visible pour tous */}
          <button
            onClick={() => setForm((f) => ({
              ...f,
              startTime: '07:00',
              endTime: '15:30',
              breakMinutes: 30,
            }))}
            className={`w-full text-left px-4 py-2.5 rounded-xl border text-[13px] transition-colors ${
              isDark ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:bg-blue-900/20' : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Préremplir · </span>
            07:00 → 15:30 · 30 min pause
          </button>

          {/* Début / Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Début</label>
              <TimeInput value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} isDark={isDark} />
            </div>
            <div>
              <label className={labelClass}>Fin</label>
              <TimeInput value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} isDark={isDark} />
            </div>
          </div>

          {/* Pause */}
          <div>
            <label className={labelClass}>Pause</label>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 30, 45, 60].map((min) => (
                <button key={min} onClick={() => setForm({ ...form, breakMinutes: min })} className={optBtn(form.breakMinutes === min)}>
                  {min === 0 ? 'Aucune' : `${min} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Total calculé — workers uniquement */}
          {user?.scope === 'worker' && workerHours !== null && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium ${isDark ? 'bg-blue-900/20 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
              <span>Total calculé</span>
              <span className="text-[16px] font-semibold">{workerHours}h</span>
            </div>
          )}

          {/* Type de tâche (workers) ou type d'activité (employés) */}
          {user?.scope === 'worker' ? (
            <div>
              <label className={labelClass}>Type de tâche</label>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map((tt) => (
                  <button key={tt.id} onClick={() => setForm({ ...form, taskTypeId: tt.id })} className={optBtn(form.taskTypeId === tt.id)}>
                    {tt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Type d'activité</label>
              <div className="flex flex-wrap gap-2">
                {activityTypes.map((at) => (
                  <button key={at.id} onClick={() => setForm({ ...form, activityTypeId: at.id })} className={optBtn(form.activityTypeId === at.id)}>
                    {at.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projet (workers uniquement, si des projets existent) */}
          {user?.scope === 'worker' && projects.length > 0 && (
            <div>
              <label className={labelClass}>Projet (facultatif)</label>
              {selectedProject ? (
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-[13px] ${isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-400 bg-blue-50'}`}>
                  <span>
                    <span className={`font-mono text-[11px] mr-2 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{selectedProject.code}</span>
                    <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>{selectedProject.name}</span>
                  </span>
                  <button onClick={() => setForm({ ...form, projectId: '' })} className={isDark ? 'text-blue-400 hover:text-blue-200' : 'text-blue-500 hover:text-blue-700'}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div ref={projectRef} className="relative">
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] ${isDark ? 'border-gray-600 bg-[#2a2a2a]' : 'border-gray-200 bg-white'}`}>
                    <Search size={13} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
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
                      <div className="max-h-40 overflow-y-auto">
                        {filteredProjects.length === 0 ? (
                          <p className={`px-3 py-2.5 text-[13px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aucun résultat</p>
                        ) : (
                          filteredProjects.map((p) => (
                            <button
                              key={p.id}
                              onMouseDown={() => { setForm({ ...form, projectId: p.id }); setProjectSearch(''); setShowProjectList(false); }}
                              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                            >
                              <span className={`font-mono text-[11px] shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{p.code}</span>
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{p.name}</span>
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

          <div>
            <label className={labelClass}>Note (facultatif)</label>
            <textarea value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={`${inputClass} resize-none`} rows={2} />
          </div>

          {error && (
            <p className={`text-[12px] px-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
          )}
          <button onClick={submit} disabled={loading}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
