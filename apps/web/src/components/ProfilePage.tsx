'use client';
import { useState, useEffect } from 'react';
import { webApi } from '@/lib/api';
import { useIsDark } from '../../app/theme-context';
import { Lock, Check, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const isDark = useIsDark();
  const [user, setUser]       = useState<any>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus]   = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('auth_user') || '{}')); } catch {}
  }, []);

  const submit = async () => {
    setStatus('idle');
    if (!current || !next || !confirm) return;
    if (next !== confirm) { setStatus('error'); setErrorMsg('Les mots de passe ne correspondent pas'); return; }
    if (next.length < 8)  { setStatus('error'); setErrorMsg('Minimum 8 caractères requis'); return; }
    setStatus('loading');
    try {
      await webApi.users.changePassword(current, next);
      setStatus('ok');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.response?.data?.message || 'Erreur lors du changement');
    }
  };

  const card  = `rounded-2xl border p-5 ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const input = `w-full rounded-xl px-3.5 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100 placeholder:text-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'}`;

  return (
    <div className="p-6 md:p-8 max-w-md">
      <h1 className={`text-[22px] font-semibold tracking-tight mb-6 ${title}`}>Mon profil</h1>

      {/* Infos */}
      <div className={`${card} mb-4`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${muted}`}>Informations</p>
        <p className={`text-[16px] font-semibold ${title}`}>{user?.firstName} {user?.lastName}</p>
        <p className={`text-[13px] mt-0.5 ${sub}`}>{user?.email}</p>
      </div>

      {/* Changer mot de passe */}
      <div className={card}>
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-4 ${muted}`}>Changer le mot de passe</p>
        <div className="space-y-3">
          <input type="password" placeholder="Mot de passe actuel" value={current}
            onChange={e => setCurrent(e.target.value)} className={input} />
          <input type="password" placeholder="Nouveau mot de passe (8 car. min.)" value={next}
            onChange={e => setNext(e.target.value)} className={input} />
          <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirm}
            onChange={e => setConfirm(e.target.value)} className={input}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        {status === 'ok' && (
          <div className="flex items-center gap-1.5 mt-3 text-emerald-500 text-[12px]">
            <Check size={13} /> Mot de passe modifié avec succès
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 mt-3 text-red-500 text-[12px]">
            <AlertCircle size={13} /> {errorMsg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={status === 'loading'}
          className="mt-4 w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Lock size={13} />
          {status === 'loading' ? 'En cours...' : 'Changer le mot de passe'}
        </button>
      </div>
    </div>
  );
}
