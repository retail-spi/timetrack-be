'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';

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
        const hours = parseFloat(form.hours);
        await webApi.workerEntries.create({
          date: form.date,
          hours,
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-300 hover:text-white">←</button>
        <h1 className="font-bold text-lg">Saisir mes heures</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>

          {user.scope === 'worker' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heures (ex: 7.5)</label>
                <input type="number" step="0.5" value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de tâche</label>
                <div className="space-y-2">
                  {taskTypes.map((tt) => (
                    <button key={tt.id}
                      onClick={() => setForm({ ...form, taskTypeId: tt.id })}
                      className={`w-full text-left px-4 py-2 rounded-lg border transition ${
                        form.taskTypeId === tt.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300'
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                  <input type="time" value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input type="time" value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pause (minutes)</label>
                <input type="number" value={form.breakMinutes}
                  onChange={(e) => setForm({ ...form, breakMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'activité</label>
                <div className="space-y-2">
                  {activityTypes.map((at) => (
                    <button key={at.id}
                      onClick={() => setForm({ ...form, activityTypeId: at.id })}
                      className={`w-full text-left px-4 py-2 rounded-lg border transition ${
                        form.activityTypeId === at.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      {at.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (facultatif)</label>
            <textarea value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 resize-none" rows={3} />
          </div>

          <button onClick={submit} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}