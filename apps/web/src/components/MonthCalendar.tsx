'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  entries: { date: string }[];
  onSelectDate: (date: string) => void;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const MIN_YEAR = 2026;
const MIN_MONTH = 0;

// Algorithme de Meeus/Jones/Butcher pour calculer la date de Pâques
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function belgianHolidays(year: number): Set<string> {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const easter = easterDate(year);
  const fixed = [
    `${year}-01-01`, // Nouvel An
    `${year}-05-01`, // Fête du Travail
    `${year}-07-21`, // Fête Nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
  ];
  const mobile = [
    fmt(addDays(easter,  1)),  // Lundi de Pâques
    fmt(addDays(easter, 39)),  // Ascension
    fmt(addDays(easter, 49)),  // Pentecôte
    fmt(addDays(easter, 50)),  // Lundi de Pentecôte
  ];
  return new Set([...fixed, ...mobile]);
}

export default function MonthCalendar({ entries, onSelectDate }: Props) {
  const today = new Date();
  const [year,  setYear]  = useState(() => Math.max(today.getFullYear(), MIN_YEAR));
  const [month, setMonth] = useState(() => today.getFullYear() < MIN_YEAR ? MIN_MONTH : today.getMonth());

  const prev = () => {
    if (year === MIN_YEAR && month === MIN_MONTH) return;
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow === -1) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr   = today.toISOString().split('T')[0];
  const entrySet   = new Set(entries.map(e => e.date?.split('T')[0]));
  const holidays   = belgianHolidays(year);

  const dateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prev}
          disabled={year === MIN_YEAR && month === MIN_MONTH}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-[14px] font-semibold text-gray-900">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* En-têtes jours — Sam/Dim en rouge discret */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-semibold py-1 ${i >= 5 ? 'text-red-300' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds       = dateStr(d);
          const dow      = new Date(year, month, d).getDay(); // 0=dim, 6=sam
          const isWeekend  = dow === 0 || dow === 6;
          const isHoliday  = holidays.has(ds);
          const isOff      = isWeekend || isHoliday;
          const isToday    = ds === todayStr;
          const isFuture   = ds > todayStr;
          const hasEntry   = entrySet.has(ds);

          return (
            <button
              key={i}
              onClick={() => !isFuture && onSelectDate(ds)}
              disabled={isFuture}
              title={isHoliday ? 'Jour férié' : undefined}
              className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-[13px] font-medium transition-colors
                ${isToday   ? 'bg-[#0071E3] text-white' : ''}
                ${!isToday && isOff && !isFuture  ? 'text-red-300 hover:bg-red-50 cursor-pointer' : ''}
                ${!isToday && !isOff && !isFuture ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' : ''}
                ${isFuture && isOff  ? 'text-red-200 cursor-not-allowed' : ''}
                ${isFuture && !isOff ? 'text-gray-300 cursor-not-allowed' : ''}
              `}
            >
              {d}
              {isHoliday && !isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-red-300" />
              )}
              {hasEntry && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isToday ? 'bg-white/70' : 'bg-[#0071E3]'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
