'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';
import { ChevronLeft } from 'lucide-react';

export default function AddEntryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    activityTypeId: '',
    hours: '',
    taskTypeId: '',
    note: '',
  });

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (!u) { router.push('/login'); return; }
    setUser(JSON.parse(u));
    webApi.activityTypes.list().then(setActivityTypes).catch(console.error);
    webApi.taskTypes.list().then(setTaskTypes).catch(console.error);
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      if (user?.scope === 'worker') {
        await webApi.workerEntries.create({
          date: form.date,
          hours: parseFloat(form.hours),
          taskTypeId: form.taskTypeId,
          note: form.note,
        });
      } else {
        await webApi.timeEntries.create({
          date: form.date,
          startTime: `${form.date}T${form.startTime}:00`,
          endTime: `${form.date}T${form.endTime}:00`,
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

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';
  const labelClass = 'block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[#0071E3] hover:text-[#0077ED] flex items-center gap-1 text-[13px] font-medium transition-colors"
        >
          <ChevronLeft size={18} /> Retour
        </button>
        <h1 className="text-[15px] font-semibold text-gray-900">Saisir mes heures</h1>
      </div>

      <div className="max-w-lg mx-auto p-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">

          <div>
            <label className={labelClass}>Date</label>
            <input type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass} />
          </div>

          {user.scope === 'worker' ? (
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
                    <button key={tt.id}
                      onClick={() => setForm({ ...form, taskTypeId: tt.id })}
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
                  <input type="time" value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fin</label>
                  <input type="time" value={form.endTime}
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
                    <button key={at.id}
                      onClick={() => setForm({ ...form, activityTypeId: at.id })}
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
              className={`${inputClass} resize-none`} rows={3} />
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
    </div>
  );
}
