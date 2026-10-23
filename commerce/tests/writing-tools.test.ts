import test from 'node:test';
import assert from 'node:assert/strict';
import { WRITING_TOOLS } from '../../lib/writing-tools';
import { QUESTIONS, TROPES, drawItems, restoreWorksheet, worksheetText } from '../../lib/writing-collections';
import { generationPrompt, normalizeInput } from '../src/server/text-generation';

test('six distinct writing pages have complete original copy and valid related routes', () => {
  assert.equal(WRITING_TOOLS.length, 6);
  assert.equal(new Set(WRITING_TOOLS.map(tool => tool.path)).size, 6);
  const ids: Set<string> = new Set(WRITING_TOOLS.map(tool => tool.id));
  for (const tool of WRITING_TOOLS) {
    assert.ok(tool.description.length >= 120);
    assert.equal(tool.faqs.length, 3);
    assert.equal(tool.sections.length, 3);
    assert.ok(tool.related.every(id => ids.has(id) && id !== tool.id));
    assert.ok(tool.sections.map(section => section.body).join(' ').split(/\s+/).length >= 150);
    assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(tool)));
  }
});

test('free banks have unique original items and ten items per category', () => {
  assert.equal(QUESTIONS.length, 40);
  assert.equal(TROPES.length, 30);
  for (const bank of [QUESTIONS, TROPES]) {
    assert.equal(new Set(bank.map(item => item.text)).size, bank.length);
    for (const category of new Set(bank.map(item => item.category))) {
      const items = bank.filter(item => item.category === category);
      assert.equal(items.length, 10);
      const first = drawItems(items, 5, [], () => 0.5);
      const next = drawItems(items, 5, first.map(item => item.id), () => 0.25);
      assert.equal(new Set(first.map(item => item.id)).size, 5);
      assert.equal(new Set([...first, ...next].map(item => item.id)).size, 10);
    }
  }
  assert.deepEqual(drawItems([], 5), []);
});

test('worksheet restoration bounds untrusted values and exports actual notes', () => {
  const sheet = restoreWorksheet({ name: 'Mira', anchor: 4, detail: 'x'.repeat(900), scene: '<script>no execution</script>', other: 'not exported' });
  assert.equal(sheet.name, 'Mira'); assert.equal(sheet.anchor, ''); assert.equal(sheet.detail.length, 800);
  assert.equal(Object.keys(sheet).length, 6);
  assert.match(worksheetText(sheet, false), /What the source shows/);
  assert.match(worksheetText(sheet, true), /What they want/);
  assert.match(worksheetText(sheet, true), /Mira/);
  assert.ok(!worksheetText(sheet, true).includes('not exported'));
});

test('AI tools have distinct prompts and keep existing default request hashes intact', () => {
  const original = normalizeInput({ characterName: 'Mira' });
  assert.deepEqual(normalizeInput({ characterName: 'Mira', kind: 'headcanon' }), original);
  const pair = { characterName: 'Mira', secondCharacter: 'Jo', mode: 'relationship' };
  assert.match(generationPrompt(normalizeInput({ ...pair, kind: 'scenario' })), /location, a disruption, and an unresolved choice/);
  assert.match(generationPrompt(normalizeInput({ ...pair, kind: 'dialogue' })), /ORIGINAL fictional dialogue snippets/);
  assert.match(generationPrompt(normalizeInput({ ...pair, kind: 'plot' })), /goal, an obstacle, a turning point, and a possible ending/);
  for (const bad of [{ ...pair, kind: 'unsupported' }, { ...pair, kind: ['plot'] }, { characterName: 'Mira', kind: 'dialogue' }, { characterName: 'Mira', mode: ['oc'] }]) assert.throws(() => normalizeInput(bad));
});
