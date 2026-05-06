'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);

    const loadEntries = async () => {
      try {
        if (parsed.scope === 'worker') {
          const data = await webApi.workerEntries.list();
          setEntries(data);
        } else {
          const data = await webApi.timeEntries.list();
          setEntries(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  const logout = () => { localStorage.clear(); router.push('/login'); };

  // Semaine courante
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekEntries = entries.filter((e) => new Date(e.date) >= startOfWeek);

  const totalHours = user?.scope === 'worker'
    ? weekEntries.reduce((sum, e) => sum + e.hours, 0)
    : weekEntries.reduce((sum, e) => {
        const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000;
        return sum + diff - e.breakMinutes / 60;
      }, 0);

  const pending = weekEntries.filter((e) => e.status === 'PENDING').length;
  const approved = weekEntries.filter((e) => e.status === 'APPROVED').length;

  const statusColor = (status: string) =>
    status === 'APPROVED' ? 'text-green-600 bg-green-50' :
    status === 'REJECTED' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">TimeTrack BE</h1>
          <p className="text-blue-300 text-sm">Bonjour, {user?.firstName} 👋</p>
        </div>
        <button onClick={logout} className="text-blue-300 text-sm hover:text-white">
          Déconnexion
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Résumé semaine */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Semaine en cours</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${totalHours > 38 ? 'text-red-600' : 'text-blue-900'}`}>
              {totalHours.toFixed(1)}h
            </span>
            <span className="text-gray-400">/ 38h contrat</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full ${totalHours > 38 ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min((totalHours / 38) * 100, 100)}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-amber-600">⏳ {pending} en attente</span>
            <span className="text-green-600">✅ {approved} approuvées</span>
          </div>
        </div>

        {/* Bouton ajouter */}
        <Link href="/employee/add">
          <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 text-center font-semibold cursor-pointer transition">
            + Saisir mes heures
          </div>
        </Link>

        {/* Liste entrées */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Mes entrées cette semaine</h2>
          {weekEntries.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-400">
              Aucune entrée cette semaine
            </div>
          )}
          {weekEntries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(e.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  {user?.scope === 'worker' ? (
                    <p className="text-sm text-gray-500">{e.hours}h — {e.taskType?.label}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {new Date(e.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(e.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                      {' — '}{e.activityType?.label}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(e.status)}`}>
                  {e.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}