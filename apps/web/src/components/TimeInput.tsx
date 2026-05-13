'use client';
import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isDark?: boolean;
}

export default function TimeInput({ value, onChange, isDark }: Props) {
  const mmRef = useRef<HTMLInputElement>(null);

  const hh = value.split(':')[0] ?? '';
  const mm = value.split(':')[1] ?? '';

  const update = (newHh: string, newMm: string) => onChange(`${newHh}:${newMm}`);

  const handleHH = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    update(digits, mm);
    if (digits.length === 2) mmRef.current?.focus();
  };

  const handleMM = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    update(hh, digits);
  };

  const blurHH = () => { if (hh && !mm) update(hh, '00'); };
  const blurMM = () => { if (mm === '') update(hh, '00'); };

  const inputBase = `w-10 text-center rounded-lg py-2.5 text-[15px] font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${
    isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'
  }`;

  return (
    <div className="flex items-center gap-1">
      <input type="text" inputMode="numeric" maxLength={2} placeholder="08"
        value={hh} onChange={(e) => handleHH(e.target.value)} onBlur={blurHH} className={inputBase} />
      <span className={`text-[16px] font-semibold select-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>:</span>
      <input ref={mmRef} type="text" inputMode="numeric" maxLength={2} placeholder="00"
        value={mm} onChange={(e) => handleMM(e.target.value)} onBlur={blurMM} className={inputBase} />
    </div>
  );
}
