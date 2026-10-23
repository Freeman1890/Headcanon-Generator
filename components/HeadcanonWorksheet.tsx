"use client";
import { useEffect, useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { WORKSHEET_FIELDS, emptyWorksheet, restoreWorksheet, worksheetText, type Worksheet } from '@/lib/writing-collections';
import { WritingActions } from '@/components/WritingActions';

const key = 'headcanon-worksheet-v1';
export function HeadcanonWorksheet() {
  const [sheets, setSheets] = useState({ existing: emptyWorksheet(), original: emptyWorksheet() });
  const [original, setOriginal] = useState(false);
  const sheetKey = original ? 'original' : 'existing';
  const sheet = sheets[sheetKey];
  const setSheet = (value: Worksheet) => setSheets(previous => ({ ...previous, [sheetKey]: value }));
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [backup, setBackup] = useState<Worksheet | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = JSON.parse(localStorage.getItem(key) || 'null'); if (saved) { setSheets(saved.sheets ? { existing: restoreWorksheet(saved.sheets.existing), original: restoreWorksheet(saved.sheets.original) } : { existing: saved.original ? emptyWorksheet() : restoreWorksheet(saved.sheet), original: saved.original ? restoreWorksheet(saved.sheet) : emptyWorksheet() }); setOriginal(saved.original === true); } }
      catch { setStorageError(true); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify({ sheets, original })); }
    catch { const timer = window.setTimeout(() => setStorageError(true), 0); return () => window.clearTimeout(timer); }
  }, [sheets, original, ready]);
  const output = worksheetText(sheet, original);
  return <div id="writing-tool" className="space-y-6">
    <div role="group" aria-label="Worksheet type" className="grid max-w-lg grid-cols-2 border-b border-slate-200 dark:border-slate-700">
      {['Existing character', 'Original character'].map((label, index) => <button key={label} type="button" aria-pressed={original === Boolean(index)} onClick={() => { setOriginal(Boolean(index)); setBackup(null); }} className={`min-h-11 border-b-2 px-3 py-2 text-sm ${original === Boolean(index) ? 'border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400' : 'border-transparent'}`}>{label}</button>)}
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {WORKSHEET_FIELDS.map(field => <label key={field.key} className="min-w-0 text-sm font-medium"><span className="mb-2 block">{original ? field.original : field.label}</span><textarea value={sheet[field.key]} onChange={event => setSheet({ ...sheet, [field.key]: event.target.value })} maxLength={800} rows={3} className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-base font-normal leading-relaxed focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900" /></label>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <WritingActions text={output} download filename="headcanon-worksheet.txt" />
      <div className="flex items-center gap-2">
        <span role="status" className="text-sm text-slate-500">{storageError ? 'Browser saving is unavailable. Download your notes.' : ready ? 'Saved in this browser' : 'Opening worksheet...'}</span>
        <button type="button" title="Clear worksheet" aria-label="Clear worksheet" onClick={() => { setBackup(sheet); setSheet(emptyWorksheet()); }} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700"><RotateCcw className="h-4 w-4" /></button>
        {backup && <button type="button" title="Undo clear" aria-label="Undo clear" onClick={() => { setSheet(backup); setBackup(null); }} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700"><Undo2 className="h-4 w-4" /></button>}
      </div>
    </div>
  </div>;
}
