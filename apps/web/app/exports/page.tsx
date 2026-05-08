'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';

const API = '/api/proxy';

export default function ExportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const download = (type: 'time-entries' | 'worker-entries') => {
    const token = localStorage.getItem('auth_token');
    const url = `${API}/exports/${type}/csv?from=${from}&to=${to}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}-${from}-${to}.csv`;
        a.click();
      });
  };

  const ready = from && to;

  return (
    <div className="p-6 md:p-8 max-w-lg">
      <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight mb-6">Exports CSV</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Du</label>
            <input
              type="text"
              placeholder="2024-01-01"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Au</label>
            <input
              type="text"
              placeholder="2024-12-31"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        <div className="pt-1 space-y-2.5">
          <button
            onClick={() => download('time-entries')}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-white text-[13px] font-medium py-3 rounded-xl transition-colors"
          >
            <Download size={15} /> Employés bureau / commercial
          </button>
          <button
            onClick={() => download('worker-entries')}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-[13px] font-medium py-3 rounded-xl transition-colors"
          >
            <Download size={15} /> Ouvriers
          </button>
        </div>
      </div>
    </div>
  );
}
