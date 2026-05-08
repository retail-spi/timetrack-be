'use client';
import { useState } from 'react';

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

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Exports CSV</h1>
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
          <input
            type="text"
            placeholder="2024-01-01"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
          <input
            type="text"
            placeholder="2024-12-31"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => download('time-entries')}
          disabled={!from || !to}
          className="w-full bg-blue-600 disabled:opacity-40 text-white py-3 rounded-lg font-medium text-sm"
        >
          📥 Employés bureau/commercial
        </button>
        <button
          onClick={() => download('worker-entries')}
          disabled={!from || !to}
          className="w-full bg-purple-600 disabled:opacity-40 text-white py-3 rounded-lg font-medium text-sm"
        >
          📥 Ouvriers
        </button>
      </div>
    </div>
  );
}