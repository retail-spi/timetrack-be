'use client';
import { useState } from 'react';
import { webApi } from '@/lib/api';
import { X } from 'lucide-react';
import TimeInput from './TimeInput';

interface Entry {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  hours?: number;
  activityType?: { label: string };
  taskType?: { label: string };
}

interface Props {
  entry: Entry;
  scope: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CorrectionModal({ entry, scope, onClose, onSaved }: Props) {
  const isWorker = scope === 'worker';

  const initStart = entry.startTime
    ? new Date(entry.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : '';
  const initEnd = entry.endTime
    ? new Date(entry.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : '';

  const [reason, setReason]           = useState('');
  const [startTime, setStartTime]     = useState(initStart);
  const [endTime, setEndTime]         = useState(initEnd);
  const [breakMinutes, setBreakMinutes] = useState(entry.breakMinutes ?? 0);
  const [hours, setHours]             = useState(String(entry.hours ?? ''));
  const [loading, setLoading]         = useState(false);

  const dateLabel = new Date(`${entry.date.split('T')[0]}T12:00:00`).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const submit = async () => {
    if (!reason.trim()) { alert('Merci d\'indiquer une raison.'); return; }
    setLoading(true);
    try {
      const proposedData = isWorker
        ? { hours: parseFloat(hours) }
        : {
            startTime: `${entry.date.split('T')[0]}T${startTime}:00`,
            endTime:   `${entry.date.split('T')[0]}T${endTime}:00`,
            breakMinutes,
          };

      await webApi.corrections.create({
        ...(isWorker ? { workerTimeEntryId: entry.id } : { timeEntryId: entry.id }),
        reason,
        proposedData,
      });
      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';
  const labelClass = 'block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white">

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0 mr-3">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Demande de correction</h2>
            <p className="text-[12px] text-gray-400 capitalize mt-0.5 truncate">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Raison */}
          <div>
            <label className={labelClass}>Raison de la correction</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : erreur de saisie sur l'heure de fin"
              className={`${inputClass} resize-none`}
              rows={2}
            />
          </div>

          {/* Données proposées */}
          {isWorker ? (
            <div>
              <label className={labelClass}>Nouvelles heures</label>
              <input
                type="number" step="0.5" min="0" max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputClass}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nouveau début</label>
                  <TimeInput value={startTime} onChange={setStartTime} />
                </div>
                <div>
                  <label className={labelClass}>Nouvelle fin</label>
                  <TimeInput value={endTime} onChange={setEndTime} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pause (minutes)</label>
                <input
                  type="number" min="0"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors"
          >
            {loading ? 'Envoi...' : 'Envoyer la correction'}
          </button>
        </div>
      </div>
    </div>
  );
}
