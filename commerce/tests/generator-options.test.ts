import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInput, generationPrompt } from '../src/server/text-generation';
import { readGeneratorDraft } from '../../lib/generator-draft';
import { FANDOM_HUBS } from '../../lib/fandom-hubs';

test('old requests keep the same normalized input and hash shape', () => {
  const expected = { characterName: 'Mira', workName: '', secondCharacter: '', mode: 'oc' };
  assert.deepEqual(normalizeInput({ characterName: ' Mira ', mode: 'oc' }), expected);
  assert.deepEqual(normalizeInput({ characterName: 'Mira', mode: 'oc', relationshipKind: 'any', tone: 'any', scenario: ' ' }), expected);
});

test('optional choices constrain the actual provider prompt', () => {
  const input = normalizeInput({ characterName: 'Mira', secondCharacter: 'Jo', mode: 'relationship', relationshipKind: 'friendship', tone: 'fluff', scenario: ' Waiting out the rain ' });
  const prompt = generationPrompt(input);
  assert.match(prompt, /strictly platonic/);
  assert.match(prompt, /warm, low-stakes fluff tone/);
  assert.match(prompt, /Anchor all five ideas in the supplied scene/);
  assert.match(prompt, /Waiting out the rain/);
  assert.match(generationPrompt(normalizeInput({ ...input, relationshipKind: 'romance' })), /non-explicit romantic interactions/);
  assert.match(generationPrompt(normalizeInput({ ...input, relationshipKind: 'rivals' })), /Do not turn the rivalry into romance/);
});

test('invalid or unsafe choices are rejected before reservation or provider calls', () => {
  for (const input of [
    { characterName: 'Mira', tone: 'unknown' },
    { characterName: 'Mira', mode: 'oc', relationshipKind: 'friendship' },
    { characterName: 'Mira', mode: 'relationship', secondCharacter: '' },
    { characterName: 'Mira', scenario: 'x'.repeat(241) },
    { characterName: 'Mira', scenario: ['rain'] },
    { characterName: 'Mira', scenario: 'explicit sex' },
  ]) assert.throws(() => normalizeInput(input));
});

test('explicit fandom links do not restore an unrelated saved draft', () => {
  const saved = { characterName: 'Old character', workName: 'Old world', secondCharacter: 'Old pair', mode: 'relationship', relationshipKind: 'romance', tone: 'fluff', scenario: 'Old scene' };
  const draft = readGeneratorDraft('?fandom=Naruto', saved);
  assert.equal(draft.workName, 'Naruto');
  assert.equal(draft.characterName, '');
  assert.equal(draft.secondCharacter, '');
  assert.equal(draft.mode, 'character');
  assert.equal(draft.scenario, '');
  assert.deepEqual(readGeneratorDraft('', saved), saved);
});

test('links restore supported choices and bound invalid query values', () => {
  const draft = readGeneratorDraft('?character=Mira&secondCharacter=Jo&mode=relationship&relationshipKind=friendship&tone=fluff&scenario=Rain', null);
  assert.equal(draft.relationshipKind, 'friendship');
  assert.equal(draft.tone, 'fluff');
  assert.equal(draft.secondCharacter, 'Jo');
  assert.equal(draft.scenario, 'Rain');
  const invalid = readGeneratorDraft(`?mode=bad&tone=bad&relationshipKind=friendship&scenario=${'x'.repeat(300)}`, null);
  assert.equal(invalid.mode, 'character');
  assert.equal(invalid.relationshipKind, 'any');
  assert.equal(invalid.tone, 'any');
  assert.equal(invalid.scenario.length, 240);
});

test('three fandom collections have distinct original examples and working input bounds', () => {
  const hubs = ['naruto', 'danganronpa', 'phighting'].map(name => FANDOM_HUBS.find(hub => hub.slug === `${name}-headcanon-generator`)!);
  const examples = hubs.flatMap(hub => hub.writingExamples!);
  assert.equal(new Set(examples.map(example => example.body)).size, 9);
  for (const hub of hubs) {
    assert.ok(hub.title.toLowerCase().includes('headcanon generator'));
    assert.equal(hub.writingExamples!.length, 3);
    assert.equal(hub.faqs.length, 3);
    assert.ok(hub.sources!.every(source => source.href.startsWith('https://')));
    assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(hub)), 'Humanizer final copy must not contain en/em dashes.');
    for (const example of hub.writingExamples!) {
      assert.ok(example.character.length <= 80);
      assert.ok(example.scenario.length <= 240);
    }
  }
});
