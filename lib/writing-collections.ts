export const QUESTION_CATEGORIES = ['daily', 'motives', 'relationships', 'world'] as const;
export type CollectionItem = { id: string; category: string; text: string; title?: string };
export const QUESTIONS = [
  ['daily', 'What do they replace immediately, even when money is tight?'],
  ['daily', 'Which ordinary chore do they put off until someone notices?'],
  ['daily', 'What do they carry that has outlived its practical use?'],
  ['daily', 'What would a visitor notice about their kitchen?'],
  ['daily', 'Which small sound tells them they are home?'],
  ['daily', 'What do they eat when nobody else is choosing?'],
  ['daily', 'What do they repair instead of replacing?'],
  ['daily', 'Which part of getting ready always takes too long?'],
  ['daily', 'What do they keep forgetting to buy?'],
  ['daily', 'What changes in their routine when they are worried?'],
  ['motives', 'What would they refuse to borrow, even from a friend?'],
  ['motives', 'Which compliment makes them uncomfortable?'],
  ['motives', 'What minor failure do they still try to correct?'],
  ['motives', 'What would they do with a free afternoon they did not expect?'],
  ['motives', 'Which promise is harder to keep than they expected?'],
  ['motives', 'What are they trying to prove, and to whom?'],
  ['motives', 'What would make them leave a job they otherwise enjoy?'],
  ['motives', 'Which easy solution would they reject on principle?'],
  ['motives', 'What would they give up to avoid asking for help?'],
  ['motives', 'What do they want that they describe as a practical necessity?'],
  ['relationships', 'Who is allowed to interrupt their usual routine?'],
  ['relationships', 'What small rule would they break for a friend?'],
  ['relationships', 'Who gets a different answer when they ask how things are going?'],
  ['relationships', 'What do they remember about someone who thinks they never listen?'],
  ['relationships', 'How do they return a favor they cannot repay with money?'],
  ['relationships', 'Which disagreement keeps coming back without becoming an argument?'],
  ['relationships', 'What would a friend notice before they admit they need rest?'],
  ['relationships', 'Whose borrowed object do they take unusually good care of?'],
  ['relationships', 'Who knows where they go when they want to be left alone?'],
  ['relationships', 'What apology would they accept without hearing the word sorry?'],
  ['world', 'Which local custom do they follow even when away from home?'],
  ['world', 'What part of their job would an outsider misunderstand?'],
  ['world', 'Which place has changed more than they are willing to admit?'],
  ['world', 'What does bad weather make impossible in their daily life?'],
  ['world', 'Which skill is useful at home but awkward elsewhere?'],
  ['world', 'What item would be cheap in their world and precious in ours?'],
  ['world', 'What public rule do people quietly ignore?'],
  ['world', 'Which errand takes much longer than it should?'],
  ['world', 'What do they miss about a place they were eager to leave?'],
  ['world', 'Which familiar landmark would they use to give directions?'],
].map<CollectionItem>(([category, text], index) => ({ id: `question-${index + 1}`, category, text }));

export const TROPES = [
  ['relationship', 'Forced proximity', 'Two neighbors share the only dry table during a roof repair. One is writing a letter about the other.'],
  ['relationship', 'Reluctant partners', 'Two people who disagree about everything must return a lost suitcase before its owner leaves.'],
  ['relationship', 'An unexpected kindness', 'A rival quietly fixes a broken clasp, then complains about how badly it was made.'],
  ['relationship', 'Mistaken intentions', 'A practical favor looks like a grand gesture to everyone except the person who arranged it.'],
  ['relationship', 'A shared secret', 'Two friends know who broke the old clock, but disagree about whether fixing it will give them away.'],
  ['relationship', 'Role reversal', 'The usual planner loses the map and has to follow someone who never admits they are nervous.'],
  ['relationship', 'An old promise', 'A casual childhood promise becomes inconveniently possible on an ordinary Tuesday.'],
  ['relationship', 'The returned favor', 'A borrowed umbrella keeps coming back with a different small repair.'],
  ['relationship', 'The missing routine', 'One person skips their usual stop, and the other discovers how much of their day depended on it.'],
  ['relationship', 'An uneasy truce', 'Two rivals agree not to argue until a shared task is finished, then find new ways to disagree politely.'],
  ['adventure', 'The wrong delivery', 'An ordinary parcel contains a map that makes sense only when held upside down.'],
  ['adventure', 'A race against closing time', 'A message must cross town before the last bridge closes for repairs.'],
  ['adventure', 'The reluctant guide', 'The only person who knows the route is the one who swore never to go back.'],
  ['adventure', 'A small quest with large consequences', 'Replacing a missing door key reveals that three neighbors have been using the same spare.'],
  ['adventure', 'An unreliable shortcut', 'A route that saves an hour on the map adds a favor nobody intended to owe.'],
  ['adventure', 'The useful mistake', 'Someone packs the wrong bag and discovers the useless item is exactly what the journey needs.'],
  ['adventure', 'A borrowed identity', 'A traveler is mistaken for the guest expected to settle a very small but bitter dispute.'],
  ['adventure', 'The last available seat', 'The only ride home has room for one person and a piece of luggage neither can leave behind.'],
  ['adventure', 'The return journey', 'The road home looks familiar until the landmarks begin appearing in the wrong order.'],
  ['adventure', 'A debt called in', 'A tiny favor from years ago is repaid with a task that cannot wait until morning.'],
  ['mystery', 'The out-of-place object', 'A clean gardening glove turns up in a room nobody has opened since winter.'],
  ['mystery', 'An unreliable witness', 'The only witness remembers the tune playing, but not which door the visitor used.'],
  ['mystery', 'The repeated message', 'Identical notes arrive on three different days, each with a different fold.'],
  ['mystery', 'The missing hour', 'A public clock stops, yet every appointment in town continues exactly on time.'],
  ['mystery', 'An accidental clue', 'A shopping receipt explains why a familiar alibi cannot be true.'],
  ['mystery', 'The wrong name', 'A returned library book contains a dedication to someone who denies borrowing it.'],
  ['mystery', 'A too-neat explanation', 'Every account agrees except for one detail nobody thought worth recording.'],
  ['mystery', 'A secret in plain sight', 'The answer has been on a noticeboard all week, hidden among ordinary reminders.'],
  ['mystery', 'The familiar stranger', 'Everyone recognizes a visitor, but each remembers meeting them in a different place.'],
  ['mystery', 'An absent detail', 'A routine photograph matters because something ordinary is not in it.'],
].map<CollectionItem>(([category, title, text], index) => ({ id: `trope-${index + 1}`, category, title, text }));

export function drawItems<T extends { id: string }>(items: readonly T[], count = 5, previous: readonly string[] = [], random = Math.random): T[] {
  const fresh = items.filter(item => !previous.includes(item.id));
  const pool = [...(fresh.length >= count ? fresh : items)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.max(0, Math.min(0.999999999, random())) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, count));
}

export const WORKSHEET_FIELDS = [
  { key: 'name', label: 'Character / fandom', original: 'Character / setting' },
  { key: 'anchor', label: 'What the source shows', original: 'What they want' },
  { key: 'detail', label: 'My headcanon', original: 'One habit or contradiction' },
  { key: 'reason', label: 'Why it might fit', original: 'What gets in their way' },
  { key: 'boundary', label: 'What is still uncertain', original: 'What I have not decided' },
  { key: 'scene', label: 'A scene that would reveal it', original: 'A scene that would test it' },
] as const;
export type Worksheet = Record<typeof WORKSHEET_FIELDS[number]['key'], string>;
export const emptyWorksheet = (): Worksheet => ({ name: '', anchor: '', detail: '', reason: '', boundary: '', scene: '' });
export function restoreWorksheet(value: unknown): Worksheet {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(WORKSHEET_FIELDS.map(field => { const text = record[field.key]; return [field.key, typeof text === 'string' ? text.slice(0, 800) : '']; })) as Worksheet;
}
export function worksheetText(value: Worksheet, original: boolean) {
  return `${original ? 'Original character worksheet' : 'Headcanon worksheet'}\n\n${WORKSHEET_FIELDS.map(field => `${original ? field.original : field.label}\n${value[field.key] || '(not filled)'}`).join('\n\n')}\n\nPersonal writing notes. Invented details are not official canon.`;
}
