"use client";
import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { QUESTIONS, TROPES, drawItems } from '@/lib/writing-collections';
import { Button } from '@/components/ui/button';
import { WritingActions } from '@/components/WritingActions';

export function CuratedWritingTool({ kind }: { kind: 'questions' | 'trope' }) {
  const bank = kind === 'questions' ? QUESTIONS : TROPES;
  const [category, setCategory] = useState('any');
  const [items, setItems] = useState<typeof bank[number][]>(bank.slice(0, 5));
  const categories = kind === 'questions' ? [['daily', 'Daily life'], ['motives', 'Motives'], ['relationships', 'Relationships'], ['world', 'World and setting']] : [['relationship', 'Relationships'], ['adventure', 'Adventure'], ['mystery', 'Mystery']];
  const batchText = items.map((item, index) => `${index + 1}. ${'title' in item ? `${item.title}: ` : ''}${item.text}`).join('\n\n');
  return <div id="writing-tool" className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-sm font-medium"><span className="mb-2 block">{kind === 'questions' ? 'Question category' : 'Trope category'}</span><select value={category} onChange={event => { setCategory(event.target.value); setItems([]); }} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-900"><option value="any">All categories</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <Button type="button" variant="primary" className="min-h-11 whitespace-normal" onClick={() => setItems(drawItems(bank.filter(item => category === 'any' || item.category === category), 5, items.map(item => item.id)))}><Shuffle className="h-4 w-4 shrink-0" />{kind === 'questions' ? 'Draw 5 questions' : 'Draw 5 tropes'}</Button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-slate-500">{items.length ? `${items.length} selections from the free curated collection` : 'No selections in this category yet.'}</p><WritingActions text={batchText} download filename={`${kind}.txt`} /></div>
    <ol aria-label={kind === 'questions' ? 'Selected questions' : 'Selected tropes'} className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {items.map((item, index) => <li key={item.id} className="flex min-w-0 gap-4 py-5"><span className="pt-1 text-sm tabular-nums text-slate-400">{index + 1}</span><div className="min-w-0 flex-1">{'title' in item && <h2 className="mb-2 text-lg font-semibold">{item.title}</h2>}<p className="leading-relaxed">{item.text}</p></div><WritingActions text={`${'title' in item ? `${item.title}: ` : ''}${item.text}`} /></li>)}
    </ol>
  </div>;
}
