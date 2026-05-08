'use client';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';
import { X } from 'lucide-react';

interface Props {
  date: string;
  user: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function TimeEntryModal({ date, user, onClose, onSaved }: Props) {
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [taskTypes, setTaskTypes]         = useState<any[]>([]);
  const [loading, setLoading]             = useState(false);
  const [form, setForm] = useState({
    startTime: '', endTime: '', breakMinutes: 0,
    activityTypeId: '', hours: '', taskTypeId: '', note: '',
  });

  useEffect(() => {
    webApi.activityTypes.list().then(setActivityTypes).catch(console.error);
    webApi.taskTypes.list().then(setTaskTypes).catch(console.error);
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      if (user?.scope === 'worker') {
        await webApi.workerEntries.create({
          date, hours: parseFloat(form.hours), taskTypeId: form.taskTypeId, note: form.note,
        });
      } else {
        await webApi.timeEntries.create({
          date,
          startTime: `${date}T${form.startTime}:00`,
          endTime:   `${date}T${form.endTime}:00`,
          breakMinutes: form.breakMinutes,
          activityTypeId: form.activityTypeId,
          note: form.note,
        });
      }
      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';
  const labelClass = 'block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* w-[calc(100vw-2rem)] force la largeur à viewport - 2×padding, impossible de déborder */}
      <div className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white">

        {/* Header — ne scroll pas */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0 mr-3">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Pointer</h2>
            <p className="text-[12px] text-gray-400 capitalize mt-0.5 truncate">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Contenu — scroll vertical uniquement */}
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
                <div className="space-y-2">
                  {taskTypes.map((tt) => (
                    <button key={tt.id} onClick={() => setForm({ ...form, taskTypeId: tt.id })}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-[13px] transition-colors ${
                        form.taskTypeId === tt.id
                          ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {tt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Début</label>
                  <input type="text" inputMode="numeric" placeholder="08:00" value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fin</label>
                  <input type="text" inputMode="numeric" placeholder="17:00" value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pause (minutes)</label>
                <input type="number" value={form.breakMinutes}
                  onChange={(e) => setForm({ ...form, breakMinutes: parseInt(e.target.value) || 0 })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Type d'activité</label>
                <div className="space-y-2">
                  {activityTypes.map((at) => (
                    <button key={at.id} onClick={() => setForm({ ...form, activityTypeId: at.id })}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-[13px] transition-colors ${
                        form.activityTypeId === at.id
                          ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
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

          <button onClick={submit} disabled={loading}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
