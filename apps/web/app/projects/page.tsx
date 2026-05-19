'use client';
import { useEffect, useRef, useState } from 'react';
import { webApi } from '@/lib/api';
import { Plus, Upload, X, Check, AlertCircle } from 'lucide-react';
import { useIsDark } from '../theme-context';

type CsvRow = { name: string; code: string };

function parseCsvText(text: string): CsvRow[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const cells = (line: string) => line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const first = cells(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = first.includes('name') || first.includes('code') || first.includes('nom');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  let codeIdx = 0;
  let nameIdx = 1;
  if (hasHeader) {
    codeIdx = first.indexOf('code') !== -1 ? first.indexOf('code') : first.indexOf('ref') !== -1 ? first.indexOf('ref') : 0;
    nameIdx = first.indexOf('name') !== -1 ? first.indexOf('name') : first.indexOf('nom') !== -1 ? first.indexOf('nom') : 1;
  }
  return dataLines
    .map((line) => { const cols = cells(line); return { code: (cols[codeIdx] || '').toUpperCase(), name: cols[nameIdx] || '' }; })
    .filter((r) => r.code && r.name);
}

async function parseFile(file: File): Promise<CsvRow[]> {
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  if (isExcel) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length === 0) return [];
    const first = rows[0].map((c: any) => String(c).toLowerCase().trim());
    const hasHeader = first.some((c: string) => ['code', 'name', 'nom', 'ref'].includes(c));
    let codeIdx = 0;
    let nameIdx = 1;
    if (hasHeader) {
      codeIdx = first.indexOf('code') !== -1 ? first.indexOf('code') : first.indexOf('ref') !== -1 ? first.indexOf('ref') : 0;
      nameIdx = first.indexOf('name') !== -1 ? first.indexOf('name') : first.indexOf('nom') !== -1 ? first.indexOf('nom') : 1;
    }
    const dataRows = hasHeader ? rows.slice(1) : rows;
    return dataRows
      .map((row: any[]) => ({ code: String(row[codeIdx] || '').toUpperCase().trim(), name: String(row[nameIdx] || '').trim() }))
      .filter((r) => r.code && r.name);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(parseCsvText(ev.target?.result as string));
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

export default function ProjectsPage() {
  const isDark = useIsDark();
  const fileRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [preview, setPreview] = useState<CsvRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);
  const [importError, setImportError] = useState('');

  const load = async () => { setProjects(await webApi.projects.list()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name || !form.code) return;
    await webApi.projects.create(form); setShowForm(false); setForm({ name: '', code: '' }); await load();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportResult(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        setImportError('Aucune ligne valide trouvée. Vérifiez le format du fichier (colonnes : code, nom).');
        return;
      }
      setPreview(rows);
    } catch {
      setImportError('Impossible de lire le fichier.');
    }
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const result = await webApi.projects.import(preview);
      setImportResult(result);
      setPreview(null);
      await load();
    } catch {
      setImportError("Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  const card   = `rounded-2xl border ${isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'}`;
  const title  = isDark ? 'text-white' : 'text-gray-900';
  const muted  = isDark ? 'text-gray-500' : 'text-gray-400';
  const input  = `w-full rounded-xl px-3.5 py-2.5 text-[13px] border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${isDark ? 'border-gray-600 bg-[#2a2a2a] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`;
  const cancel = `flex-1 text-[13px] font-medium py-2.5 rounded-xl transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`;
  const badgeStatus = (on: boolean) => on ? (isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500');

  if (loading) return <div className={`p-8 text-[13px] ${muted}`}>Chargement...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-[22px] font-semibold tracking-tight ${title}`}>Projets</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className={`flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors border ${isDark ? 'border-gray-600 text-gray-200 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Upload size={15} /> Importer CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFile} />
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors">
            <Plus size={15} /> Nouveau
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl mb-4 text-[13px] ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
          <Check size={16} />
          {importResult.count} projet{importResult.count > 1 ? 's' : ''} importé{importResult.count > 1 ? 's' : ''} avec succès
          <button onClick={() => setImportResult(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Import error */}
      {importError && (
        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl mb-4 text-[13px] ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
          <AlertCircle size={16} />
          {importError}
          <button onClick={() => setImportError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* CSV Preview panel */}
      {preview && (
        <div className={`${card} p-5 mb-5`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-[15px] font-semibold ${title}`}>
              Aperçu — {preview.length} projet{preview.length > 1 ? 's' : ''} détecté{preview.length > 1 ? 's' : ''}
            </h2>
            <button onClick={() => setPreview(null)} className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}><X size={18} /></button>
          </div>
          <p className={`text-[12px] mb-3 ${muted}`}>Les projets existants (même code) seront mis à jour, les nouveaux seront créés.</p>
          <div className={`rounded-xl border overflow-hidden mb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`grid grid-cols-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <span>Code</span><span>Nom</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {preview.map((row, i) => (
                <div key={i} className={`grid grid-cols-2 px-3 py-2 text-[13px] border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`font-mono ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{row.code}</span>
                  <span className={title}>{row.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              disabled={importing}
              className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors"
            >
              {importing ? 'Import en cours...' : `Importer ${preview.length} projet${preview.length > 1 ? 's' : ''}`}
            </button>
            <button onClick={() => setPreview(null)} className={cancel}>Annuler</button>
          </div>
        </div>
      )}

      {/* New project form */}
      {showForm && (
        <div className={`${card} p-5 mb-5`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-[15px] font-semibold ${title}`}>Nouveau projet</h2>
            <button onClick={() => setShowForm(false)} className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <input placeholder="Nom du projet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <input placeholder="Code (ex: PROJ-001)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${input} font-mono`} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit} className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium py-2.5 rounded-xl transition-colors">Créer le projet</button>
            <button onClick={() => setShowForm(false)} className={cancel}>Annuler</button>
          </div>
        </div>
      )}

      {/* Format hint */}
      <p className={`text-[12px] mb-4 ${muted}`}>
        Formats acceptés : Excel (.xlsx) ou CSV (.csv) — deux colonnes <span className="font-mono">code</span> et <span className="font-mono">nom</span>
      </p>

      {projects.length === 0 && !showForm && !preview && (
        <div className={`${card} p-12 text-center`}>
          <p className={`text-[13px] ${muted}`}>Aucun projet pour le moment</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((project) => (
          <div key={project.id} className={`${card} p-4`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-[14px] font-semibold leading-tight ${title}`}>{project.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStatus(project.isActive)}`}>{project.isActive ? 'Actif' : 'Inactif'}</span>
            </div>
            <p className={`text-[12px] font-mono ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{project.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
