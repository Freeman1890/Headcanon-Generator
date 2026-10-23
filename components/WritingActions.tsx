"use client";
import { Check, Copy, Download } from 'lucide-react';
import { useState } from 'react';

export function WritingActions({ text, filename = 'headcanon-notes.txt', download = false }: { text: string; filename?: string; download?: boolean }) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copied = copiedText === text;
  const [error, setError] = useState('');
  const copy = async () => {
    setCopiedText(null); setError('');
    try { await navigator.clipboard.writeText(text); setCopiedText(text); }
    catch { setError('Copy was blocked. You can select the text and copy it manually.'); }
  };
  const save = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); }
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const button = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800';
  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" title={copied ? 'Copied' : 'Copy text'} aria-label={copied ? 'Copied' : 'Copy text'} disabled={!text.trim()} onClick={() => void copy()} className={button}>{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
    {download && <button type="button" title="Download text" aria-label="Download text" disabled={!text.trim()} onClick={save} className={button}><Download className="h-4 w-4" /></button>}
    <span role="status" className="text-sm text-slate-600 dark:text-slate-400">{copied ? 'Copied' : error}</span>
  </div>;
}
