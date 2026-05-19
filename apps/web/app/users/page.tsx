'use client';
import { useEffect, useState, useMemo } from 'react';
import { webApi } from '@/lib/api';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsDark } from '../theme-context';

const scopeLabel: Record<string, string> = { employee_office: 'Bureau', employee_commercial: 'Commercial', worker: 'Ouvrier' };
const roleLabel: Record<string, string>  = { SUPER_ADMIN: 'Super Admin', HR: 'RH', MANAGER: 'Manager', EMPLOYEE: 'Employé' };

const STATUS_COLOR: Record<string, string> = {
  APPROVED: 'bg-emerald-400',
  PENDING:  'bg-amber-400',
  REJECTED: 'bg-red-400',
};

export default function UsersPage() {
  const isDark = useIsDark();
  const [users, setUsers]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [view, setView]         = useState<'list' | 'planning'>('list');
  const [month, setMonth]       = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [allEntries, setAllEntries]             = useState<any[]>([]);
  const [allWorkerEntries, setAllWorkerEntries] = useState<any[]>([]);
  const [entriesLoaded, setEntriesLoaded]       = useState(false);
  const [entriesLoading, setEntriesLoading]     = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', scope: 'employee_office', password: 'ChangeMe123!' });

  const load = async () => { setUsers(await webApi.users.list()); setLoading(false); };

  const loadEntries = async () => {
    setEntriesLoading(true);
    try {
      const [te, we] = await Promise.all([webApi.timeEntries.list(), webApi.workerEntries.list()]);
      setAllEntries(te);
      setAllWorkerEntries(we);
      setEntriesLoaded(true);
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    try { setIsSuperAdmin(JSON.parse(localStorage.getItem('auth_user') || '{}').role === 'SUPER_ADMIN'); } catch {}
    load();
  }, []);

  useEffect(() => {
    if (view === 'planning' && !entriesLoaded) loadEntries();
  }, [view]);

  const submit = async () => {
    await webApi.users.create(form);
    setShowForm(false);
    setForm({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', scope: 'employee_office', password: 'ChangeMe123!' });
    await load();
  };
  const toggleActive = async (user: any) => { await webApi.users.update(user.id, { isActive: !user.isActive }); await load(); };

  const year       = month.getFullYear();
  const monthNum   = month.getMonth();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const todayDate = new Date();
  const isToday   = (d: number) => todayDate.getFullYear() === year && todayDate.getMonth() === monthNum && todayDate.getDate() === d;
  const isWeekend = (d: number) => { const dow = new Date(year, monthNum, d).getDay(); return dow === 0 || dow === 6; };
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const getDayKey = (uid: string, d: number) => `${uid}_${year}-${pad2(monthNum + 1)}-${pad2(d)}`;

  const entryMap = useMemo(() => {
    const map = new Map<string, any>();
    [...allEntries, ...allWorkerEntries].forEach(e => {
      const uid = e.userId ?? e.user?.id;
      if (!uid) return;
      const key = `${uid}_${(e.date || '').split('T')[0]}`;
      if (!map.has(key)) map.set(key, e);
    });
    return map;
  }, [allEntries, allWorkerEntries]);

  const monthLabel  = month.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });
  const activeUsers = users.filter(u => u.isActive);
  const minTableW   = 110 + daysInMonth * 28;

  const card   = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title  = isDark ? 'text-white' : 'text-gray-900';
  const sub    = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted  = isDark ? 'text-gray-500' : 'text-gray-400';
  const input  = `w-full rounded-xl px-3.5 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const rowCls = `border-b last:border-0 transition-colors ${isDark ? 'border-gray-700/50 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`;
  const cancel = `flex-1 text-[13px] font-medium py-2.5 rounded-xl transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`;
  const badgeBlue  = isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600';
  const badgeGray  = isDark ? 'bg-gray-700 text-gray-300'    : 'bg-gray-100 text-gray-500';
  const badgeGreen = (on: boolean) => on ? (isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500');
  const tabBtn = (active: boolean) => `px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${active ? (isDark ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-600') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`;
  const sticky = `sticky left-0 z-10 ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`;

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-5 md:p-8">

      {/* Header — toggle visible sur mobile et desktop */}
      <div className="flex justify-between items-start mb-5 gap-3">
        <div className="flex flex-col gap-2">
          <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>Utilisateurs</h1>
          <div className={`flex items-center gap-1 p-1 rounded-xl self-start ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button onClick={() => setView('list')}     className={tabBtn(view === 'list')}>Liste</button>
            <button onClick={() => setView('planning')} className={tabBtn(view === 'planning')}>Planning</button>
          </div>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors shrink-0">
            <Plus size={15} /> Nouveau
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className={`${card} p-5 mb-5 max-w-xl`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-[15px] font-semibold ${title}`}>Nouvel utilisateur</h2>
            <button onClick={() => setShowForm(false)} className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Prénom"  value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={input} />
            <input placeholder="Nom"     value={form.lastName}  onChange={e => setForm({ ...form, lastName:  e.target.value })} className={input} />
            <input placeholder="Email"   value={form.email}     onChange={e => setForm({ ...form, email:     e.target.value })} className={input} />
            <input placeholder="Mot de passe" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={input} />
            <select value={form.role}  onChange={e => setForm({ ...form, role:  e.target.value })} className={input}>
              <option value="EMPLOYEE">Employé</option><option value="MANAGER">Manager</option><option value="HR">RH</option><option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} className={input}>
              <option value="employee_office">Bureau</option><option value="employee_commercial">Commercial</option><option value="worker">Ouvrier</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit} className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors">Créer l'utilisateur</button>
            <button onClick={() => setShowForm(false)} className={cancel}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Vue Liste ── */}
      {view === 'list' && (
        <>
          {/* Mobile : cartes */}
          <div className="space-y-2.5 md:hidden">
            {users.map(user => (
              <div key={user.id} className={`${card} p-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-[14px] font-semibold ${title}`}>{user.firstName} {user.lastName}</p>
                    <p className={`text-[12px] mt-0.5 ${muted}`}>{user.email}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeBlue}`}>{roleLabel[user.role] || user.role}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeGray}`}>{scopeLabel[user.scope] || user.scope}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeGreen(user.isActive)}`}>{user.isActive ? 'Actif' : 'Inactif'}</span>
                    <button onClick={() => toggleActive(user)} className={`text-[12px] ${muted}`}>{user.isActive ? 'Désactiver' : 'Activer'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop : tableau */}
          <div className={`hidden md:block ${card} overflow-hidden`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                  {['Nom', 'Email', 'Rôle', 'Scope', 'Statut', ''].map((h, i) => (
                    <th key={i} className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={rowCls}>
                    <td className={`px-4 py-3 text-[13px] font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</td>
                    <td className={`px-4 py-3 text-[13px] ${sub}`}>{user.email}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeBlue}`}>{roleLabel[user.role] || user.role}</span></td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeGray}`}>{scopeLabel[user.scope] || user.scope}</span></td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeGreen(user.isActive)}`}>{user.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => toggleActive(user)} className={`text-[12px] ${muted}`}>{user.isActive ? 'Désactiver' : 'Activer'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Vue Planning — mobile + desktop ── */}
      {view === 'planning' && (
        <div>
          {/* Navigation mois */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <ChevronLeft size={16} />
            </button>
            <span className={`text-[14px] font-semibold capitalize w-36 text-center ${title}`}>{monthLabel}</span>
            <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <ChevronRight size={16} />
            </button>
            {entriesLoading && <span className={`text-[12px] ${muted}`}>Chargement…</span>}
            <div className="flex items-center gap-3 ml-auto">
              {[['bg-emerald-400', 'Approuvé'], ['bg-amber-400', 'En attente'], ['bg-red-400', 'Rejeté']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color}`} />
                  <span className={`text-[10px] hidden sm:inline ${muted}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau scrollable horizontalement (swipe sur mobile, scroll sur desktop) */}
          <div
            className={card}
            style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <table
              className="border-collapse"
              style={{ tableLayout: 'fixed', width: `${minTableW}px`, minWidth: '100%' }}
            >
              <colgroup>
                <col style={{ width: 110 }} />
                {days.map(d => <col key={d} style={{ width: 28 }} />)}
              </colgroup>
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                  <th className={`text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${muted} ${sticky}`}>
                    Employé
                  </th>
                  {days.map(d => {
                    const wk = isWeekend(d);
                    const dn = new Date(year, monthNum, d).toLocaleDateString('fr-BE', { weekday: 'short' }).slice(0, 2);
                    return (
                      <th key={d} className={`py-2 text-center ${isToday(d) ? (isDark ? 'text-blue-300' : 'text-blue-600') : wk ? (isDark ? 'text-gray-600' : 'text-gray-300') : muted}`}>
                        <div className="text-[11px] font-bold leading-none">{d}</div>
                        <div className={`text-[9px] font-normal capitalize leading-none mt-0.5 ${wk ? (isDark ? 'text-gray-600' : 'text-gray-300') : muted}`}>{dn}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeUsers.map(user => (
                  <tr key={user.id} className={`border-b last:border-0 ${isDark ? 'border-gray-700/30' : 'border-gray-50'}`}>
                    <td className={`px-3 py-2 ${sticky}`}>
                      <div className={`text-[12px] font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div className={`text-[10px] ${muted}`}>{scopeLabel[user.scope] || user.scope}</div>
                    </td>
                    {days.map(d => {
                      const entry = entryMap.get(getDayKey(user.id, d));
                      const wk    = isWeekend(d);
                      const td    = isToday(d);
                      const dot   = entry ? (STATUS_COLOR[entry.status] || 'bg-gray-400') : null;
                      let tip = '';
                      if (entry) {
                        if (entry.startTime && entry.endTime) {
                          const s  = new Date(entry.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
                          const e2 = new Date(entry.endTime).toLocaleTimeString('fr-BE',   { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
                          tip = `${s} → ${e2}`;
                          if (entry.breakMinutes) tip += ` (${entry.breakMinutes}min pause)`;
                        } else if (entry.hours != null) {
                          tip = `${entry.hours}h`;
                        }
                        if (entry.activityType?.label) tip += ` · ${entry.activityType.label}`;
                        if (entry.taskType?.label)     tip += ` · ${entry.taskType.label}`;
                      }
                      return (
                        <td key={d} title={tip || undefined}
                          className={['text-center py-2', wk ? (isDark ? 'bg-white/[0.02]' : 'bg-gray-50/80') : '', td ? (isDark ? 'bg-blue-900/10' : 'bg-blue-50/40') : ''].join(' ')}
                        >
                          {dot && <div className={`mx-auto w-3.5 h-3.5 rounded-sm ${dot} opacity-90`} />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
