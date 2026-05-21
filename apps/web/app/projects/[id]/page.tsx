'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';
import { ChevronLeft, Clock } from 'lucide-react';
import { useIsDark } from '../../theme-context';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA', '#FFCC00'];

export default function ProjectStatsPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const isDark  = useIsDark();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    webApi.projects.stats(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  const card  = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-500';
  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: 12,
    color: isDark ? '#f9fafb' : '#111827',
    fontSize: 12,
  };

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;
  if (!data)   return <div className={`p-8 text-[13px] ${muted}`}>Projet introuvable.</div>;

  const { project, totalHours, byWorker, byTaskType } = data;

  const workerData  = byWorker.map((w: any) => ({ name: `${w.firstName} ${w.lastName}`, heures: w.hours }));
  const taskData    = byTaskType.map((t: any) => ({ name: t.label, value: t.hours }));

  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyle} className="px-3 py-2">
        <p className="font-medium mb-0.5">{label}</p>
        <p>{payload[0].value}h</p>
      </div>
    );
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const total = taskData.reduce((s: number, d: any) => s + d.value, 0);
    const pct = total > 0 ? Math.round((payload[0].value / total) * 100) : 0;
    return (
      <div style={tooltipStyle} className="px-3 py-2">
        <p className="font-medium mb-0.5">{payload[0].name}</p>
        <p>{payload[0].value}h · {pct}%</p>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/projects')}
          className={`p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>{project.name}</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{project.code}</p>
        </div>
      </div>

      {/* Total */}
      <div className={`${card} p-6 flex items-center gap-5`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <Clock size={22} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
        </div>
        <div>
          <p className={`text-[12px] font-medium uppercase tracking-wide ${muted}`}>Total heures</p>
          <p className={`text-[36px] font-bold leading-none tracking-tight mt-1 ${title}`}>{totalHours}<span className={`text-[18px] font-medium ml-1 ${sub}`}>h</span></p>
        </div>
      </div>

      {totalHours === 0 && (
        <div className={`${card} p-10 text-center`}>
          <p className={`text-[13px] ${muted}`}>Aucune heure enregistrée sur ce projet.</p>
        </div>
      )}

      {totalHours > 0 && (
        <>
          {/* Par ouvrier */}
          <div className={`${card} p-5`}>
            <h2 className={`text-[15px] font-semibold mb-5 ${title}`}>Heures par ouvrier</h2>
            <ResponsiveContainer width="100%" height={Math.max(180, workerData.length * 52)}>
              <BarChart data={workerData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} unit="h" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#d1d5db' : '#374151' }} tickLine={false} axisLine={false} width={110} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="heures" radius={[0, 8, 8, 0]} maxBarSize={32}>
                  {workerData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Par type de tâche */}
          <div className={`${card} p-5`}>
            <h2 className={`text-[15px] font-semibold mb-5 ${title}`}>Heures par activité</h2>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ percent }: { percent?: number }) => `${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {taskData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 12, color: isDark ? '#d1d5db' : '#374151' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Tableau récap */}
            <div className={`mt-4 rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              {taskData.map((t: any, i: number) => (
                <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-[13px] border-b last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className={sub}>{t.name}</span>
                  </div>
                  <span className={`font-semibold ${title}`}>{t.value}h</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
