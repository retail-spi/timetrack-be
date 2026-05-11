'use client';
import { useRef } from 'react';

interface Props {
  value: string; // "HH:MM"
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function TimeInput({ value, onChange }: Props) {
  const mmRef = useRef<HTMLInputElement>(null);

  const hh = value.split(':')[0] ?? '';
  const mm = value.split(':')[1] ?? '';

  const update = (newHh: string, newMm: string) => {
    onChange(`${newHh}:${newMm}`);
  };

  const handleHH = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    update(digits, mm);
    if (digits.length === 2) mmRef.current?.focus();
  };

  const handleMM = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    update(hh, digits);
  };

  const inputBase =
    'w-10 text-center border border-gray-200 rounded-lg py-2.5 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors bg-white';

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="08"
        value={hh}
        onChange={(e) => handleHH(e.target.value)}
        className={inputBase}
      />
      <span className="text-[16px] font-semibold text-gray-400 select-none">:</span>
      <input
        ref={mmRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="00"
        value={mm}
        onChange={(e) => handleMM(e.target.value)}
        className={inputBase}
      />
    </div>
  );
}
