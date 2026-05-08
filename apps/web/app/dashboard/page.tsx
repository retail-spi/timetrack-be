'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import {
  Clock, AlertCircle, Users, FolderOpen,
  FileText, Download, Search,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ pending: 0, corrections: 0 });
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
      });
    }).catch(console.error);
  }, []);

  const cards = [
    {
      label: 'Entrées en attente',
      value: stats.pending,
      href: '/validations',
      icon: Clock,
      highlight: stats.pending > 0,
    },
    {
      label: 'Corrections en attente',
      value: stats.corrections,
      href: '/validations',
      icon: AlertCircle,
      highlight: stats.corrections > 0,
    },
    { label: 'Utilisateurs',  value: null, href: '/users',      icon: Users },
    { label: 'Projets',       value: null, href: '/projects',   icon: FolderOpen },
    { label: 'Contrats',      value: null, href: '/contracts',  icon: FileText },
    { label: 'Exports',       value: null, href: '/exports',    icon: Download },
    { label: 'Audit logs',    value: null, href: '/audit-logs', icon: Search },
  ];

  const today = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-[13px] text-gray-400 capitalize mb-1">{today}</p>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Tableau de bord</h1>
        {user && (
          <p className="text-[13px] text-gray-500 mt-1">
            Bonjour, <span className="text-gray-700 font-medium">{user.firstName}</span>
          </p>
        )}
      </div>

      {(stats.pending > 0 || stats.corrections > 0) && (
        <Link href="/validations">
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors cursor-pointer">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-[13px] text-amber-700 font-medium">
              {stats.pending + stats.corrections} élément{stats.pending + stats.corrections > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <div className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                card.highlight
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                  card.highlight ? 'bg-amber-100' : 'bg-gray-100'
                }`}>
                  <Icon size={16} className={card.highlight ? 'text-amber-600' : 'text-gray-500'} />
                </div>
                {card.value !== null && (
                  <p className={`text-2xl font-bold mb-0.5 ${card.highlight ? 'text-amber-700' : 'text-gray-900'}`}>
                    {card.value}
                  </p>
                )}
                <p className={`text-[12px] font-medium ${card.highlight ? 'text-amber-600' : 'text-gray-500'}`}>
                  {card.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
