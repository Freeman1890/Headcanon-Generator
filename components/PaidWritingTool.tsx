"use client";
import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAccount } from '@/components/AccountProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WritingActions } from '@/components/WritingActions';
import { CommerceError, commerceRequest, type HeadcanonResult } from '@/lib/commerce';
import type { GenerationMode } from '@/commerce/src/config/generation-options';

type Kind = 'scenario' | 'dialogue' | 'plot';
const labels = { scenario: 'scene premises', dialogue: 'fictional dialogues', plot: 'plot outlines' };
const inputStyle = 'min-h-11 rounded-md border-slate-300 bg-white text-base dark:border-slate-700 dark:bg-slate-900';
function stored(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } }
function save(key: string, value: string | null) { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value); } catch { /* Requests still use the in-memory idempotency key. */ } }

export function PaidWritingTool({ kind }: { kind: Kind }) {
  const { account, refresh, openLogin, buy } = useAccount();
  const [name, setName] = useState('');
  const [second, setSecond] = useState('');
  const [fandom, setFandom] = useState('');
  const [brief, setBrief] = useState('');
  const [mode, setMode] = useState<GenerationMode>(kind === 'dialogue' ? 'relationship' : 'character');
  const [dynamic, setDynamic] = useState('any');
  const [tone, setTone] = useState('any');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const pendingKey = `headcanon-writing-pending:${kind}`;
  const draftKey = `headcanon-writing-draft:${kind}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = JSON.parse(stored(draftKey) || 'null');
        if (draft) {
          const field = (key: string, limit = 80) => typeof draft[key] === 'string' ? draft[key].slice(0, limit) : '';
          setName(field('name')); setSecond(field('second')); setFandom(field('fandom')); setBrief(field('brief', 240));
          if (kind !== 'dialogue' && ['character', 'oc', 'relationship'].includes(draft.mode)) setMode(draft.mode);
          if (['any', 'friendship', 'romance', 'rivals'].includes(draft.dynamic)) setDynamic(draft.dynamic);
          if (['any', 'fluff'].includes(draft.tone)) setTone(draft.tone);
        }
      } catch { save(draftKey, null); }
      setPending(stored(pendingKey)); setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [kind, draftKey, pendingKey]);
  useEffect(() => {
    if (ready) save(draftKey, JSON.stringify({ name, second, fandom, brief, mode, dynamic, tone }));
  }, [ready, draftKey, name, second, fandom, brief, mode, dynamic, tone]);
  const clearPending = () => { setPending(null); save(pendingKey, null); };
  const receive = (data: HeadcanonResult) => {
    if (data.status === 'failed') { clearPending(); throw new Error(data.error || 'Generation failed. No credit was charged.'); }
    if (!data.headcanons || data.headcanons.length !== 5) throw new Error('The result could not be read. Check the same request again.');
    setResults(data.headcanons); clearPending();
  };
  const poll = async (key: string) => {
    for (let i = 0; i < 40; i++) {
      let data: HeadcanonResult;
      try { data = await commerceRequest<HeadcanonResult>(`/api/generations/${key}`); }
      catch (cause) { if (cause instanceof CommerceError && cause.status === 404) clearPending(); throw cause; }
      if (data.status === 'succeeded' || data.status === 'failed') return receive(data);
      await new Promise(resolve => window.setTimeout(resolve, 2500));
    }
    throw new Error('This request is still running. Check it again without another charge.');
  };
  const generate = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const current = await refresh();
      if (!current.capabilities.generation) throw new Error('AI generation is unavailable here. No credits were charged.');
      if (!current.user) { openLogin(); return; }
      const previous = pending || stored(pendingKey);
      if (previous) { await poll(previous); return; }
      if (current.balance < 1) throw new Error(current.capabilities.payments ? 'You need one purchased credit for five results.' : 'You need 1 credit to generate. Credit purchases are temporarily paused.');
      const key = crypto.randomUUID(); setPending(key); save(pendingKey, key);
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': current.csrfToken || '', 'idempotency-key': key }, body: JSON.stringify({ kind, characterName: name, secondCharacter: mode === 'relationship' ? second : '', workName: fandom, mode, relationshipKind: mode === 'relationship' ? dynamic : 'any', tone, scenario: brief }) });
      const data = await response.json() as HeadcanonResult;
      if (!response.ok) { if (response.status < 500 || data.status === 'failed') clearPending(); throw new Error(data.error || 'Generation could not finish. Check this request before trying again.'); }
      if (response.status === 202) await poll(key); else receive(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not generate. No new result has been confirmed.'); }
    finally { setBusy(false); void refresh().catch(() => {}); }
  };
  return <div id="writing-tool" className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    <form onSubmit={event => void generate(event)} className="min-w-0 space-y-5">
      <fieldset disabled={busy || Boolean(pending)} className="min-w-0 space-y-4 disabled:opacity-70">
        {kind !== 'dialogue' && <label className="block text-sm font-medium"><span className="mb-2 block">Character setup</span><select value={mode} onChange={event => setMode(event.target.value as GenerationMode)} className={`${inputStyle} w-full border px-3`}><option value="character">Existing character</option><option value="oc">Original character</option><option value="relationship">Pair</option></select></label>}
        <label className="block text-sm font-medium"><span className="mb-2 block">{mode === 'relationship' ? 'First character' : 'Character name'}</span><Input value={name} onChange={event => setName(event.target.value)} required maxLength={80} className={inputStyle} /></label>
        {mode === 'relationship' && <><label className="block text-sm font-medium"><span className="mb-2 block">Second character</span><Input value={second} onChange={event => setSecond(event.target.value)} required maxLength={80} className={inputStyle} /></label><label className="block text-sm font-medium"><span className="mb-2 block">Relationship type</span><select value={dynamic} onChange={event => setDynamic(event.target.value)} className={`${inputStyle} w-full border px-3`}><option value="any">Any dynamic</option><option value="friendship">Friendship (no romance)</option><option value="romance">Romance / ship</option><option value="rivals">Rivals</option></select></label></>}
        <label className="block text-sm font-medium"><span className="mb-2 block">{mode === 'oc' ? 'Setting (optional)' : 'Fandom (optional)'}</span><Input value={fandom} onChange={event => setFandom(event.target.value)} maxLength={80} className={inputStyle} /></label>
        <label className="block text-sm font-medium"><span className="mb-2 block">Brief (optional)</span><textarea value={brief} onChange={event => setBrief(event.target.value)} rows={3} maxLength={240} className={`${inputStyle} w-full resize-y border p-3 font-normal`} /></label>
        <label className="block text-sm font-medium"><span className="mb-2 block">Tone</span><select value={tone} onChange={event => setTone(event.target.value)} className={`${inputStyle} w-full border px-3`}><option value="any">Any tone</option><option value="fluff">Fluff / warm and low-stakes</option></select></label>
      </fieldset>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">1 credit for 5 {labels[kind]}. 100 credits for $9.90, no subscription.{account?.user ? ` Balance: ${account.balance}.` : ' Sign-in required.'}</p>
      {pending && <p role="status" className="text-sm text-slate-600 dark:text-slate-400">A previous request needs checking. The button checks that request, without another charge.</p>}
      {account?.capabilities.payments === false && <p role="status" className="text-sm text-slate-600 dark:text-slate-400">Credit purchases are temporarily paused. Existing credits can still be used.</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {account?.user && account.capabilities.payments && account.balance < 1 && !pending && <Button type="button" variant="secondary" disabled={busy} className="min-h-11 w-full whitespace-normal" onClick={() => { setBusy(true); void buy().catch(cause => setError(cause instanceof Error ? cause.message : 'Checkout unavailable.')).finally(() => setBusy(false)); }}>Buy 100 credits · $9.90</Button>}
      <Button type="submit" variant="primary" disabled={busy || !ready} className="min-h-11 w-full whitespace-normal py-3">{busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0" />}{busy ? 'Checking your request...' : pending ? 'Check previous request' : `Generate 5 ${labels[kind]} · 1 credit`}</Button>
    </form>
    <section aria-label="Generated results" aria-busy={busy} className="min-w-0 border-t border-slate-200 pt-6 dark:border-slate-700 lg:pt-0 lg:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Your {labels[kind]}</h2>{results.length > 0 && <WritingActions text={results.join('\n\n')} download filename={`${kind}-ideas.txt`} />}</div>
      {!results.length && <p role="status" className="mt-4 leading-relaxed text-slate-500">{busy ? 'Waiting for five complete results. Your previous output will not be replaced until they arrive.' : 'No generated results yet.'}</p>}
      {results.length > 0 && <ol className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">{results.map((text, index) => <li key={`${index}-${text}`} className="flex min-w-0 items-start gap-3 py-5"><div className="min-w-0 flex-1"><p className="mb-2 text-sm text-slate-500">{index + 1}</p><p className="whitespace-pre-wrap break-words leading-relaxed">{text}</p></div><WritingActions text={text} /></li>)}</ol>}
      {kind === 'dialogue' && <p className="mt-5 text-sm text-slate-500">Fictional fan writing, not verified or official quotes.</p>}
    </section>
  </div>;
}
