/* ==========================================================================
   Deck checker. Run it after editing or adding any deck:

       node tools/check-decks.mjs

   It loads every decks/set-*.js the same way the browser does, then validates
   the data. The important check is the last one: a breakdown has to rebuild its
   own sentence exactly, which makes a skipped or invented chunk impossible to
   miss across hundreds of entries.
   ========================================================================== */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { auditWord } from './marker-rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECKS_DIR = join(ROOT, 'decks');
// Default is 50; some decks (e.g. particles) have a different target count.
const EXPECTED_WORD_COUNTS = {
  'set-01-body': 50,
  'set-02-family': 50,
  'set-03-greetings': 50,
  'set-04-time': 50,
  'set-05-position': 50,
  'set-06-house': 50,
  'set-07-connectors': 50,
  'set-08-animals': 50,
  'set-09-markers': 28,
  'set-10-verbs': 50,
  'set-11-numbers': 50,
  'set-12-food': 50,
  'set-13-adjectives': 50,
  'set-14-places': 50,
  'set-15-colors': 50,
  'set-16-shopping': 50,
  'set-17-weather': 50,
  'set-18-clothing': 50,
  'set-19-health': 50,
  'set-20-school': 50,
  'set-21-work': 50,
  'set-22-hobbies': 50,
  'set-23-transport': 50,
  'set-24-kitchen': 50,
  'set-25-sino-days': 50,
  'set-26-emotions': 50,
  'set-27-nature': 50,
  'set-28-technology': 50,
  'set-29-professions': 50,
  'set-30-culture': 50,
  'set-31-formal-speech': 50,
  'set-32-counters': 50,
  'set-33-produce': 50,
  'set-34-home-life': 50,
  'set-35-travel': 50
};

const DEFAULT_WORD_COUNT = 50;

const DAY_FILTER_DECKS = ['set-25-sino-days'];
const VALID_DAY_CHARACTERS = ['월', '화', '수', '목', '금', '토', '일'];

// Words that are deliberately the same in two decks, because the Korean really
// is ambiguous or taught in two contexts. Anything not listed here gets reported.
const ALLOWED_CROSS_DECK_DUPLICATES = [
  '위',
  '와',
  '하고',
  '이',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
  '일요일'
];

const problems = [];
const notes = [];
const markerWarnings = [];

function fail(where, message) {
  problems.push(`${where}: ${message}`);
}

// --- Load decks the way index.html does ----------------------------------

const deckFiles = readdirSync(DECKS_DIR)
  .filter((name) => name.startsWith('set-') && name.endsWith('.js'))
  .sort();

if (!deckFiles.length) {
  console.error('No decks/set-*.js files found.');
  process.exit(1);
}

const globalScope = { KOREAN_DECKS: undefined };
globalThis.window = globalScope;

for (const file of deckFiles) {
  const source = readFileSync(join(DECKS_DIR, file), 'utf8');
  try {
    // Deck files are plain scripts that push onto window.KOREAN_DECKS.
    new Function('window', source)(globalScope);
  } catch (err) {
    fail(file, `failed to evaluate: ${err.message}`);
  }
}

const decks = globalScope.KOREAN_DECKS || [];
if (decks.length !== deckFiles.length) {
  fail('decks/', `${deckFiles.length} files registered ${decks.length} decks`);
}

// --- Per-deck validation --------------------------------------------------

const stripped = (text) => text.replace(/[\s.,?!~…'"()]/g, '');
const seenIds = new Set();
const koreanOwners = new Map(); // korean -> [deck ids]

for (const deck of decks) {
  const where = deck.id || '(deck with no id)';

  if (!deck.id || !deck.title) fail(where, 'missing id or title');
  if (seenIds.has(deck.id)) fail(where, 'duplicate deck id');
  seenIds.add(deck.id);

  const words = deck.words || [];
  const expectedCount = EXPECTED_WORD_COUNTS[deck.id] ?? DEFAULT_WORD_COUNT;
  if (words.length !== expectedCount) {
    fail(where, `has ${words.length} words, expected ${expectedCount}`);
  }

  const seenKorean = new Set();
  const expectsDayCharacter = DAY_FILTER_DECKS.includes(deck.id);

  words.forEach((word, i) => {
    const label = `${where}[${i + 1}] ${word.korean || '(no korean)'}`;

    // 1. Every field present and non-empty.
    for (const field of ['korean', 'romanization', 'english', 'sentenceKorean', 'sentenceEnglish']) {
      if (typeof word[field] !== 'string' || !word[field].trim()) {
        fail(label, `field "${field}" is missing or empty`);
      }
    }
    if (!Array.isArray(word.breakdown) || !word.breakdown.length) {
      fail(label, 'breakdown is missing or empty');
      return;
    }

    if (expectsDayCharacter) {
      if (!VALID_DAY_CHARACTERS.includes(word.dayCharacter)) {
        fail(label, `dayCharacter must be one of ${VALID_DAY_CHARACTERS.join(', ')}`);
      }
    } else if (word.dayCharacter !== undefined) {
      fail(label, 'dayCharacter is only allowed on day-filter decks');
    }

    // 2. No duplicate headword inside a deck, and track cross-deck reuse.
    if (seenKorean.has(word.korean)) fail(label, 'duplicate korean in this deck');
    seenKorean.add(word.korean);
    if (!koreanOwners.has(word.korean)) koreanOwners.set(word.korean, []);
    koreanOwners.get(word.korean).push(deck.id);

    // 3. Romanization stays plain ASCII.
    if (!/^[a-z ]+$/.test(word.romanization)) {
      fail(label, `romanization "${word.romanization}" is not lowercase ascii letters and spaces`);
    }

    // 4. No Korean left inside the English fields, and no latin in the Korean.
    if (/[\uAC00-\uD7A3]/.test(word.english) || /[\uAC00-\uD7A3]/.test(word.sentenceEnglish)) {
      fail(label, 'hangul found in an english field');
    }
    if (/[a-zA-Z]/.test(word.korean) || /[a-zA-Z]/.test(word.sentenceKorean)) {
      fail(label, 'latin letters found in a korean field');
    }

    // 5. The headword must not appear only as a particle on another chunk, which
    // boxes it like a marker in the breakdown UI instead of its own column.
    const headwordInKo = word.breakdown.some((chunk) => chunk.ko === word.korean);
    const headwordOnlyInP = word.breakdown.some((chunk) => chunk.p === word.korean) && !headwordInKo;
    if (headwordOnlyInP) {
      fail(label, 'headword appears only as a particle (p), not as its own ko chunk');
    }

    // 6. The sentence has to actually use the word it teaches.
    if (!stripped(word.sentenceKorean).includes(stripped(word.korean))) {
      fail(label, `sentenceKorean does not contain the headword: "${word.sentenceKorean}"`);
    }
    if (stripped(word.sentenceKorean) === stripped(word.korean)) {
      fail(label, 'sentenceKorean is just the headword on its own');
    }

    // 6. English sentence looks like a sentence.
    if (!/[.?!]$/.test(word.sentenceEnglish.trim())) {
      fail(label, 'sentenceEnglish does not end with punctuation');
    }

    // 7. The breakdown must rebuild the sentence exactly.
    const chunks = word.breakdown;
    chunks.forEach((chunk, c) => {
      if (!chunk.ko || typeof chunk.ko !== 'string') {
        fail(label, `breakdown chunk ${c + 1} has no ko`);
      }
      if (!chunk.en || typeof chunk.en !== 'string') {
        fail(label, `breakdown chunk ${c + 1} (${chunk.ko}) has no en gloss`);
      }
      if (chunk.p !== undefined && (typeof chunk.p !== 'string' || !chunk.p)) {
        fail(label, `breakdown chunk ${c + 1} (${chunk.ko}) has an empty p`);
      }
      for (const key of Object.keys(chunk)) {
        if (!['ko', 'p', 'en'].includes(key)) {
          fail(label, `breakdown chunk ${c + 1} has unexpected key "${key}"`);
        }
      }
    });

    const rebuilt = chunks.map((chunk) => chunk.ko + (chunk.p || '')).join('');
    const target = stripped(word.sentenceKorean);
    if (stripped(rebuilt) !== target) {
      fail(
        label,
        'breakdown does not rebuild the sentence\n' +
          `        sentence: ${target}\n` +
          `        rebuilt:  ${stripped(rebuilt)}`
      );
    }

    for (const issue of auditWord(word, deck.id)) {
      markerWarnings.push(`${label}: ${issue.message}`);
    }
  });
}

// --- Cross-deck duplicates ------------------------------------------------

for (const [korean, owners] of koreanOwners) {
  const unique = [...new Set(owners)];
  if (unique.length > 1 && !ALLOWED_CROSS_DECK_DUPLICATES.includes(korean)) {
    fail('cross-deck', `"${korean}" appears in ${unique.join(' and ')}`);
  } else if (unique.length > 1) {
    notes.push(`allowed duplicate: "${korean}" in ${unique.join(' and ')}`);
  }
}

// --- Report ---------------------------------------------------------------

const totalWords = decks.reduce((n, d) => n + (d.words || []).length, 0);
const totalChunks = decks.reduce(
  (n, d) => n + (d.words || []).reduce((m, w) => m + (w.breakdown || []).length, 0),
  0
);

console.log(`Checked ${decks.length} decks, ${totalWords} words, ${totalChunks} breakdown chunks.`);
for (const note of notes) console.log(`  note: ${note}`);
if (markerWarnings.length) {
  console.log(`\n${markerWarnings.length} marker boxing warning(s):`);
  for (const warning of markerWarnings.slice(0, 10)) console.log(`  ${warning}`);
  if (markerWarnings.length > 10) {
    console.log(`  ... and ${markerWarnings.length - 10} more (run node tools/audit-breakdowns.mjs)`);
  }
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.log(`  ${problem}`);
  process.exit(1);
}

console.log('All checks passed.');
