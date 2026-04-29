'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function ExportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const download = (type: 'time-entries' | 'worker-entries') => {
    const token = localStorage.getItem('auth_token');
    const url = `${API}/exports/${type}/csv?from=${from}&to=${to}`;
    // Lien avec auth
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}-${from}-${to}.csv`;
        a.click();
      });
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Exports CSV</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Du</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Au</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => download('time-entries')}
            disabled={!from || !to}
            className="flex-1 bg-blue-600 disabled:opacity-40 text-white py-2 rounded-lg font-medium"
          >
            📥 Employés (bureau/commercial)
          </button>
          <button
            onClick={() => download('worker-entries')}
            disabled={!from || !to}
            className="flex-1 bg-purple-600 disabled:opacity-40 text-white py-2 rounded-lg font-medium"
          >
            📥 Ouvriers
          </button>
        </div>
      </div>
    </div>
  );
}
