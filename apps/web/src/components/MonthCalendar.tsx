'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsDark } from '../../app/theme-context';

interface Props {
  entries: { date: string }[];
  onSelectDate: (date: string) => void;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MIN_YEAR = 2026;
const MIN_MONTH = 0;

function easterDate(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}

function belgianHolidays(year: number): Set<string> {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const easter = easterDate(year);
  return new Set([
    `${year}-01-01`, `${year}-05-01`, `${year}-07-21`, `${year}-08-15`,
    `${year}-11-01`, `${year}-11-11`, `${year}-12-25`,
    fmt(addDays(easter, 1)), fmt(addDays(easter, 39)), fmt(addDays(easter, 49)), fmt(addDays(easter, 50)),
  ]);
}

export default function MonthCalendar({ entries, onSelectDate }: Props) {
  const isDark = useIsDark();
  const today  = new Date();
  const [year, setYear]   = useState(() => Math.max(today.getFullYear(), MIN_YEAR));
  const [month, setMonth] = useState(() => today.getFullYear() < MIN_YEAR ? MIN_MONTH : today.getMonth());

  const prev = () => { if (year === MIN_YEAR && month === MIN_MONTH) return; if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1; if (startDow === -1) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split('T')[0];
  const entrySet = new Set(entries.map(e => e.date?.split('T')[0]));
  const holidays = belgianHolidays(year);
  const dateStr  = (d: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const cardBg  = isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const chevron = isDark ? 'text-gray-400' : 'text-gray-500';
  const chevronHover = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100';

  return (
    <div className={`rounded-2xl border p-4 md:p-5 ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} disabled={year === MIN_YEAR && month === MIN_MONTH}
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${chevronHover}`}>
          <ChevronLeft size={16} className={chevron} />
        </button>
        <span className={`text-[14px] font-semibold ${heading}`}>{MONTHS[month]} {year}</span>
        <button onClick={next} className={`p-1.5 rounded-lg transition-colors ${chevronHover}`}>
          <ChevronRight size={16} className={chevron} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-semibold py-1 ${i >= 5 ? (isDark ? 'text-red-400/60' : 'text-red-300') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = dateStr(d);
          const dow = new Date(year, month, d).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const isHoliday = holidays.has(ds);
          const isOff     = isWeekend || isHoliday;
          const isToday   = ds === todayStr;
          const isFuture  = ds > todayStr;
          const hasEntry  = entrySet.has(ds);

          let cls = 'relative flex flex-col items-center justify-center h-9 rounded-xl text-[13px] font-medium transition-colors ';
          if (isToday) {
            cls += 'bg-[#0071E3] text-white';
          } else if (isFuture) {
            cls += isOff ? (isDark ? 'text-red-400/30 cursor-not-allowed' : 'text-red-200 cursor-not-allowed') : (isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed');
          } else if (isOff) {
            cls += isDark ? 'text-red-400/70 hover:bg-red-900/20 cursor-pointer' : 'text-red-300 hover:bg-red-50 cursor-pointer';
          } else {
            cls += isDark ? 'text-gray-200 hover:bg-white/10 cursor-pointer' : 'text-gray-700 hover:bg-gray-100 cursor-pointer';
          }

          return (
            <button key={i} onClick={() => !isFuture && onSelectDate(ds)} disabled={isFuture} title={isHoliday ? 'Jour férié' : undefined} className={cls}>
              {d}
              {(isHoliday && !isToday || hasEntry) && (
                <span className="absolute bottom-0.5 flex items-center gap-0.5">
                  {isHoliday && !isToday && <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-red-400/70' : 'bg-red-300'}`} />}
                  {hasEntry && <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white/70' : isDark ? 'bg-blue-400' : 'bg-[#0071E3]'}`} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
