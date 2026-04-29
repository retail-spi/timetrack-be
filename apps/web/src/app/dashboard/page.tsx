'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { webApi } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ pending: 0, corrections: 0, alerts: 0 });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (u) setUser(JSON.parse(u));

    Promise.all([
      webApi.timeEntries.list(),
      webApi.corrections.list(),
    ]).then(([entries, corrections]) => {
      setStats({
        pending: entries.filter((e: any) => e.status === 'PENDING').length,
        corrections: corrections.filter((c: any) => c.status === 'PENDING').length,
        alerts: 0,
      });
    }).catch(console.error);
  }, []);

  const cards = [
    { label: 'Entrées en attente', value: stats.pending, href: '/validations', color: 'bg-amber-500' },
    { label: 'Corrections en attente', value: stats.corrections, href: '/validations?tab=corrections', color: 'bg-orange-500' },
    { label: 'Utilisateurs', value: '—', href: '/users', color: 'bg-blue-600' },
    { label: 'Projets', value: '—', href: '/projects', color: 'bg-green-600' },
    { label: 'Exports', value: '→', href: '/exports', color: 'bg-purple-600' },
    { label: 'Audit logs', value: '→', href: '/audit-logs', color: 'bg-gray-600' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          {user && <p className="text-gray-500">Bienvenue, {user.firstName} — {user.role}</p>}
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className={`${card.color} text-white text-2xl font-bold w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                {typeof card.value === 'number' ? card.value : card.value}
              </div>
              <p className="text-gray-700 font-medium">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
