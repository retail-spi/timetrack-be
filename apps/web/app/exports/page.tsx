'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { useIsDark } from '../theme-context';

const API = '/api/proxy';

export default function ExportsPage() {
  const isDark = useIsDark();
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');

  const download = (type: 'time-entries' | 'worker-entries') => {
    const token = localStorage.getItem('auth_token');
    fetch(`${API}/exports/${type}/csv?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob()).then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}-${from}-${to}.csv`;
        a.click();
      });
  };

  const ready = from && to;
  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const label = isDark ? 'text-gray-400' : 'text-gray-500';
  const input = `w-full rounded-xl px-3.5 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;

  return (
    <div className="p-6 md:p-8 max-w-lg">
      <h1 className={`text-[22px] font-semibold tracking-tight mb-6 ${title}`}>Exports CSV</h1>
      <div className={`${card} p-6 space-y-5`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-[12px] font-medium mb-1.5 uppercase tracking-wide ${label}`}>Du</label>
            <input type="text" placeholder="2024-01-01" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
          </div>
          <div>
            <label className={`block text-[12px] font-medium mb-1.5 uppercase tracking-wide ${label}`}>Au</label>
            <input type="text" placeholder="2024-12-31" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
          </div>
        </div>
        <div className="pt-1 space-y-2.5">
          <button onClick={() => download('time-entries')} disabled={!ready}
            className="w-full flex items-center justify-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-white text-[13px] font-medium py-3 rounded-xl transition-colors">
            <Download size={15} /> Employés bureau / commercial
          </button>
          <button onClick={() => download('worker-entries')} disabled={!ready}
            className={`w-full flex items-center justify-center gap-2 disabled:opacity-40 text-white text-[13px] font-medium py-3 rounded-xl transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-gray-800'}`}>
            <Download size={15} /> Ouvriers
          </button>
        </div>
      </div>
    </div>
  );
}
