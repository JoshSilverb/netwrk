'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCreateContact } from '@/hooks/useContacts';
import { parseSpreadsheet, getSampleValues, autoDetectMapping, ParsedSpreadsheet } from '@/lib/spreadsheet';
import { Contact } from '@/types';
import { Upload, FileSpreadsheet, X, ChevronDown, ChevronUp, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Phase = 1 | 2 | 3;
type DupDecision = 'skip' | 'import';

interface ColumnMapping {
  fullname: string;
  location: string;
  userbio: string;
  metthrough: string;
  tags: string[];
  lastcontact: string;
}

const emptyMapping = (): ColumnMapping => ({
  fullname: '',
  location: '',
  userbio: '',
  metthrough: '',
  tags: [],
  lastcontact: '',
});

interface ImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
}

export function ImportSheet({ open, onOpenChange, contacts }: ImportSheetProps) {
  const [phase, setPhase] = useState<Phase>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping());
  const [dupDecisions, setDupDecisions] = useState<Record<string, DupDecision>>({});
  const [dupOpen, setDupOpen] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const createContact = useCreateContact();
  const isImporting = progress !== null && result === null;

  function resetAll() {
    setPhase(1);
    setFile(null);
    setParsed(null);
    setMapping(emptyMapping());
    setDupDecisions({});
    setDupOpen(true);
    setProgress(null);
    setResult(null);
    setShowTagPicker(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      if (isImporting) return;
      resetAll();
    }
    onOpenChange(open);
  }

  async function handleFileAccepted(f: File) {
    setFile(f);
    const data = await parseSpreadsheet(f);
    setParsed(data);
    setMapping(autoDetectMapping(data.headers));
  }

  function detectDuplicates(): string[] {
    if (!parsed || !mapping.fullname) return [];
    const existing = new Set(contacts.map((c) => c.fullname.toLowerCase().trim()));
    return parsed.rows
      .map((r) => r[mapping.fullname]?.trim())
      .filter((name): name is string => Boolean(name) && existing.has(name.toLowerCase()));
  }

  function goToPhase3() {
    const dups = detectDuplicates();
    const decisions: Record<string, DupDecision> = {};
    dups.forEach((name) => { decisions[name.toLowerCase()] = 'skip'; });
    setDupDecisions(decisions);
    setPhase(3);
  }

  function extractTags(row: Record<string, string>): string[] {
    return mapping.tags.flatMap((col) =>
      (row[col] ?? '').split(',').map((t) => t.trim()).filter(Boolean)
    );
  }

  function buildPayload(row: Record<string, string>) {
    return {
      fullname: row[mapping.fullname] ?? '',
      location: mapping.location ? (row[mapping.location] ?? '') : '',
      userbio: mapping.userbio ? (row[mapping.userbio] ?? '') : '',
      metthrough: mapping.metthrough ? (row[mapping.metthrough] ?? '') : '',
      lastcontact: mapping.lastcontact
        ? (row[mapping.lastcontact] ?? new Date().toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10),
      tags: extractTags(row),
      socials: [],
      reminderPeriod: { weeks: null, months: null },
    };
  }

  async function runImport() {
    if (!parsed) return;
    const skipNames = new Set(
      Object.entries(dupDecisions)
        .filter(([, d]) => d === 'skip')
        .map(([name]) => name)
    );
    const toImport = parsed.rows.filter((r) => {
      const name = r[mapping.fullname]?.trim();
      return name && !skipNames.has(name.toLowerCase());
    });
    const skipped = parsed.rows.filter((r) => {
      const name = r[mapping.fullname]?.trim();
      return name && skipNames.has(name.toLowerCase());
    }).length;

    setProgress({ done: 0, total: toImport.length });
    let imported = 0, failed = 0;
    for (const row of toImport) {
      try {
        await createContact.mutateAsync(buildPayload(row));
        imported++;
      } catch {
        failed++;
      }
      setProgress((p) => p && ({ ...p, done: p.done + 1 }));
    }
    setResult({ imported, skipped, failed });
  }

  const dups = phase === 3 ? Object.keys(dupDecisions) : [];
  const importCount = (() => {
    if (!parsed) return 0;
    const skipCount = Object.values(dupDecisions).filter((d) => d === 'skip').length;
    return parsed.rowCount - skipCount;
  })();

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        className="w-[480px] flex flex-col gap-0 p-0 overflow-hidden"
        showCloseButton={!isImporting}
      >
        {/* Fixed header */}
        <div className="px-6 pt-5 pb-0 flex-shrink-0">
          <SheetHeader className="p-0 mb-4">
            <SheetTitle className="sr-only">Import contacts</SheetTitle>
            <StepIndicator phase={phase} />
          </SheetHeader>
          <PhaseTitle phase={phase} />
          <Separator className="mt-4" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === 1 && (
            <UploadPhase file={file} parsed={parsed} onFileAccepted={handleFileAccepted} onRemove={() => { setFile(null); setParsed(null); setMapping(emptyMapping()); }} />
          )}
          {phase === 2 && parsed && (
            <MappingPhase
              headers={parsed.headers}
              rows={parsed.rows}
              mapping={mapping}
              showTagPicker={showTagPicker}
              onMappingChange={setMapping}
              onShowTagPicker={setShowTagPicker}
            />
          )}
          {phase === 3 && parsed && (
            <PreviewPhase
              rowCount={parsed.rowCount}
              dups={dups}
              dupDecisions={dupDecisions}
              dupOpen={dupOpen}
              progress={progress}
              result={result}
              onDupToggle={(name, d) => setDupDecisions((prev) => ({ ...prev, [name]: d }))}
              onDupOpenToggle={() => setDupOpen((v) => !v)}
              onSkipAll={() => setDupDecisions((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, 'skip'])))}
              onImportAll={() => setDupDecisions((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, 'import'])))}
            />
          )}
        </div>

        {/* Fixed footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0">
          <FooterNav
            phase={phase}
            hasFile={!!file && !!parsed}
            hasFullname={!!mapping.fullname}
            importCount={importCount}
            isImporting={isImporting}
            isDone={!!result}
            onBack={() => setPhase((p) => (p > 1 ? ((p - 1) as Phase) : p))}
            onNext={() => {
              if (phase === 1) setPhase(2);
              else if (phase === 2) goToPhase3();
            }}
            onImport={runImport}
            onClose={() => handleClose(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ phase }: { phase: Phase }) {
  const steps = ['Upload', 'Map columns', 'Import'];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === phase;
        const isDone = stepNum < phase;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors',
                  isActive && 'bg-teal-500 text-white shadow-[0_0_0_3px_rgba(20,184,166,0.15)]',
                  isDone && 'bg-teal-100 text-teal-600 border border-teal-300',
                  !isActive && !isDone && 'bg-slate-100 text-slate-400 border border-slate-200'
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : stepNum}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive && 'text-teal-600',
                  isDone && 'text-slate-500',
                  !isActive && !isDone && 'text-slate-400'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-px mx-3', isDone ? 'bg-teal-200' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Phase title ──────────────────────────────────────────────────────────────

const PHASE_CONTENT: Record<Phase, { title: string; subtitle: string }> = {
  1: {
    title: 'Upload your spreadsheet',
    subtitle: 'Drop a CSV or Excel file to get started. We\'ll help you map columns next.',
  },
  2: {
    title: 'Map your columns',
    subtitle: 'Match each Netwrk field to a column from your spreadsheet.',
  },
  3: {
    title: 'Review & import',
    subtitle: 'Check for duplicates before importing. Duplicates are matched by full name.',
  },
};

function PhaseTitle({ phase }: { phase: Phase }) {
  const { title, subtitle } = PHASE_CONTENT[phase];
  return (
    <div className="mt-4">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

// ─── Phase 1: Upload ──────────────────────────────────────────────────────────

function UploadPhase({
  file,
  parsed,
  onFileAccepted,
  onRemove,
}: {
  file: File | null;
  parsed: ParsedSpreadsheet | null;
  onFileAccepted: (f: File) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    (f: File) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        onFileAccepted(f);
      }
    },
    [onFileAccepted]
  );

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) accept(f); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl px-6 py-12 text-center cursor-pointer transition-colors',
            dragging ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); }}
          />
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4">
            <Upload className="h-5 w-5 text-teal-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Drop your file here</p>
          <p className="text-sm text-slate-400 mt-1">or click to browse</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {['.CSV', '.XLSX', '.XLS'].map((fmt) => (
              <span key={fmt} className="font-mono text-[10px] font-medium tracking-wide px-2 py-1 rounded border border-slate-200 bg-white text-slate-500">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-teal-200 rounded-xl px-4 py-3.5 bg-teal-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-teal-200 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="h-4 w-4 text-teal-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-medium text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-teal-600 font-medium mt-0.5">
              {parsed ? `${parsed.rowCount} rows detected` : 'Parsing…'}
            </p>
          </div>
          <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-white transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-600">Tip:</span> Make sure your first row contains column headers — e.g. "Name", "City", "Notes". Netwrk will help you map each column in the next step.
      </div>
    </div>
  );
}

// ─── Phase 2: Column mapping ──────────────────────────────────────────────────

const NETWRK_FIELDS: { key: keyof Omit<ColumnMapping, 'tags'>; label: string; required?: boolean }[] = [
  { key: 'fullname', label: 'Full Name', required: true },
  { key: 'location', label: 'Location' },
  { key: 'userbio', label: 'Notes' },
  { key: 'metthrough', label: 'How You Met' },
  { key: 'lastcontact', label: 'Last Contact' },
];

function MappingPhase({
  headers,
  rows,
  mapping,
  showTagPicker,
  onMappingChange,
  onShowTagPicker,
}: {
  headers: string[];
  rows: Record<string, string>[];
  mapping: ColumnMapping;
  showTagPicker: boolean;
  onMappingChange: (m: ColumnMapping) => void;
  onShowTagPicker: (v: boolean) => void;
}) {
  function setField(key: keyof Omit<ColumnMapping, 'tags'>, value: string) {
    onMappingChange({ ...mapping, [key]: value });
  }

  function addTagColumn(col: string) {
    if (col && !mapping.tags.includes(col)) {
      onMappingChange({ ...mapping, tags: [...mapping.tags, col] });
    }
    onShowTagPicker(false);
  }

  function removeTagColumn(col: string) {
    onMappingChange({ ...mapping, tags: mapping.tags.filter((c) => c !== col) });
  }

  const availableTagCols = headers.filter((h) => !mapping.tags.includes(h));

  return (
    <div className="space-y-0 divide-y divide-slate-100">
      {NETWRK_FIELDS.map(({ key, label, required }) => {
        const selected = mapping[key];
        const samples = selected ? getSampleValues(rows, selected) : [];
        return (
          <div key={key} className="py-3.5 grid grid-cols-[140px_1fr] gap-3 items-start">
            <div className="pt-1.5">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              {required && (
                <span className="ml-1.5 text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                  required
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <select
                value={selected}
                onChange={(e) => setField(key, e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
              >
                <option value="">— skip this field —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {samples.length > 0 && (
                <p className="font-mono text-[11px] italic text-slate-400 pl-0.5">
                  {samples.join(' · ')}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Tags — multi-select */}
      <div className="py-3.5 grid grid-cols-[140px_1fr] gap-3 items-start">
        <div className="pt-1.5">
          <span className="text-sm font-medium text-slate-700">Tags</span>
        </div>
        <div className="space-y-2">
          {mapping.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {mapping.tags.map((col) => {
                const samples = getSampleValues(rows, col);
                return (
                  <div key={col} className="group">
                    <div className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-teal-50 border border-teal-200 font-mono text-xs text-teal-700">
                      {col}
                      <button
                        onClick={() => removeTagColumn(col)}
                        className="w-4 h-4 rounded-full bg-teal-200 text-teal-600 hover:bg-teal-300 flex items-center justify-center flex-shrink-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    {samples.length > 0 && (
                      <p className="font-mono text-[10px] italic text-slate-400 mt-0.5 pl-0.5">
                        {samples.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showTagPicker ? (
            <select
              autoFocus
              defaultValue=""
              onChange={(e) => addTagColumn(e.target.value)}
              onBlur={() => onShowTagPicker(false)}
              className="w-full h-9 rounded-lg border border-teal-300 bg-white px-2.5 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer appearance-none shadow-[0_0_0_3px_rgba(20,184,166,0.1)]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
            >
              <option value="">Pick a column…</option>
              {availableTagCols.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => onShowTagPicker(true)}
              className="flex items-center gap-1.5 w-full h-9 px-3 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-colors font-mono"
            >
              <Plus className="h-3 w-3" />
              {mapping.tags.length === 0 ? 'Map a column to tags' : 'Add another column'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Phase 3: Preview ─────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function PreviewPhase({
  rowCount,
  dups,
  dupDecisions,
  dupOpen,
  progress,
  result,
  onDupToggle,
  onDupOpenToggle,
  onSkipAll,
  onImportAll,
}: {
  rowCount: number;
  dups: string[];
  dupDecisions: Record<string, DupDecision>;
  dupOpen: boolean;
  progress: { done: number; total: number } | null;
  result: { imported: number; skipped: number; failed: number } | null;
  onDupToggle: (name: string, d: DupDecision) => void;
  onDupOpenToggle: () => void;
  onSkipAll: () => void;
  onImportAll: () => void;
}) {
  const skipCount = Object.values(dupDecisions).filter((d) => d === 'skip').length;
  const readyCount = rowCount - skipCount;

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-800">Import complete</p>
          <p className="text-sm text-slate-500 mt-0.5">Your contacts are ready in Netwrk</p>
        </div>
        <div className="flex gap-2 mt-1">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            {result.imported} imported
          </span>
          {result.skipped > 0 && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {result.skipped} skipped
            </span>
          )}
          {result.failed > 0 && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              {result.failed} failed
            </span>
          )}
        </div>
      </div>
    );
  }

  if (progress) {
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <p className="text-base font-semibold text-slate-800">Importing contacts…</p>
        <p className="text-sm text-slate-500">{progress.done} of {progress.total}</p>
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3.5">
          <p className="text-2xl font-bold text-teal-600 tabular-nums">{readyCount}</p>
          <p className="text-xs font-medium text-teal-700 mt-0.5">contacts ready to import</p>
        </div>
        <div className={cn('rounded-xl border px-4 py-3.5', dups.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50')}>
          <p className={cn('text-2xl font-bold tabular-nums', dups.length > 0 ? 'text-amber-600' : 'text-slate-400')}>{dups.length}</p>
          <p className={cn('text-xs font-medium mt-0.5', dups.length > 0 ? 'text-amber-700' : 'text-slate-500')}>possible duplicates</p>
        </div>
      </div>

      {/* Duplicates section */}
      {dups.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={onDupOpenToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Possible duplicates</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">
                {dups.length}
              </span>
            </div>
            {dupOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {dupOpen && (
            <div className="border-t border-slate-100">
              <div className="px-4 py-2 flex justify-end gap-3 border-b border-slate-100 bg-slate-50">
                <button onClick={onSkipAll} className="text-xs font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2">
                  Skip all
                </button>
                <button onClick={onImportAll} className="text-xs font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2">
                  Import all anyway
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {dups.map((name) => {
                  const decision = dupDecisions[name] ?? 'skip';
                  return (
                    <div key={name} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Matches an existing contact by name</p>
                      </div>
                      <div className="flex border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 text-xs font-medium">
                        <button
                          onClick={() => onDupToggle(name, 'skip')}
                          className={cn('px-2.5 py-1.5 transition-colors', decision === 'skip' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => onDupToggle(name, 'import')}
                          className={cn('px-2.5 py-1.5 transition-colors border-l border-slate-200', decision === 'import' ? 'bg-teal-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}
                        >
                          Import anyway
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Footer nav ───────────────────────────────────────────────────────────────

function FooterNav({
  phase,
  hasFile,
  hasFullname,
  importCount,
  isImporting,
  isDone,
  onBack,
  onNext,
  onImport,
  onClose,
}: {
  phase: Phase;
  hasFile: boolean;
  hasFullname: boolean;
  importCount: number;
  isImporting: boolean;
  isDone: boolean;
  onBack: () => void;
  onNext: () => void;
  onImport: () => void;
  onClose: () => void;
}) {
  if (isImporting) return null;

  if (isDone) {
    return (
      <Button onClick={onClose} className="w-full bg-teal-500 hover:bg-teal-600 text-white border-teal-600">
        Done
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {phase > 1 && (
        <Button variant="outline" onClick={onBack} className="flex-shrink-0 border-slate-200 text-slate-700">
          ← Back
        </Button>
      )}
      {phase < 3 && (
        <Button
          onClick={onNext}
          disabled={phase === 1 ? !hasFile : !hasFullname}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white border-teal-600 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400"
        >
          {phase === 1 ? 'Next: Map columns →' : 'Preview import →'}
        </Button>
      )}
      {phase === 3 && (
        <Button
          onClick={onImport}
          disabled={importCount === 0}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white border-teal-600 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400"
        >
          Import {importCount} contact{importCount !== 1 ? 's' : ''} →
        </Button>
      )}
    </div>
  );
}
