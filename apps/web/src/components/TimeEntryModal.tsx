'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { X } from 'lucide-react';
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
  const [contractHours, setContractHours] = useState<number>(38);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [form, setForm] = useState({
    startTime: '', endTime: '', breakMinutes: 0,
    activityTypeId: '', hours: '', taskTypeId: '', note: '',
  });

  useEffect(() => {
    webApi.activityTypes.list().then(setActivityTypes).catch(console.error);
    webApi.taskTypes.list().then(setTaskTypes).catch(console.error);
    webApi.contracts.mine().then((c) => { if (c?.weeklyHours) setContractHours(c.weeklyHours); }).catch(console.error);
  }, []);

  const submit = async () => {
    setError('');
    if (user?.scope === 'worker') {
      if (!form.hours) return setError('Indique le nombre d\'heures.');
      if (!form.taskTypeId) return setError('Sélectionne un type de tâche.');
    } else {
      if (!form.startTime || !form.endTime) return setError('Indique l\'heure de début et de fin.');
      if (!form.activityTypeId) return setError('Sélectionne un type d\'activité.');
    }
    setLoading(true);
    try {
      if (user?.scope === 'worker') {
        await webApi.workerEntries.create({
          date, hours: parseFloat(form.hours), taskTypeId: form.taskTypeId, note: form.note,
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
          {user?.scope === 'worker' ? (
            <>
              <div>
                <label className={labelClass}>Heures (ex : 7.5)</label>
                <input type="number" step="0.5" min="0" max="24" value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  className={inputClass} />
              </div>
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
            </>
          ) : (
            <>
              <button
                onClick={() => setForm((f) => ({
                  ...f,
                  startTime: '08:30',
                  endTime: contractHours >= 38 ? '16:30' : '12:30',
                  breakMinutes: contractHours >= 38 ? 30 : 0,
                }))}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-[13px] transition-colors ${
                  isDark ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:bg-blue-900/20' : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Préremplir · </span>
                {contractHours >= 38 ? '08:30 → 16:30 · 30 min pause' : '08:30 → 12:30 · sans pause'}
              </button>
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
            </>
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
