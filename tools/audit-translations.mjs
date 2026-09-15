import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadDecks, ROOT } from './load-decks.mjs';

const { decks } = loadDecks();
const flags = [];

const AWKWARD = [
  /^I am a /,
  /^It is /,
  /^There is /,
  /\bvery very\b/i,
  /\bthe the\b/i
];

function flagWord(deck, word) {
  const label = `${deck.id} "${word.korean}"`;
  const issues = [];

  if (!word.sentenceEnglish || !/[.?!]$/.test(word.sentenceEnglish.trim())) {
    issues.push('sentenceEnglish missing terminal punctuation');
  }

  if (word.sentenceEnglish && word.sentenceEnglish.length < 8) {
    issues.push('sentenceEnglish unusually short');
  }

  for (const pattern of AWKWARD) {
    if (pattern.test(word.sentenceEnglish)) {
      issues.push(`sentenceEnglish matches awkward pattern: ${pattern}`);
    }
  }

  const glosses = (word.breakdown || []).map((c) => c.en.toLowerCase());
  const head = word.english.toLowerCase().split(/[,;()]/)[0].trim();

  if (head.length > 2 && !word.sentenceEnglish.toLowerCase().includes(head.split(' ')[0])) {
    const firstWord = head.split(' ')[0];
    if (firstWord.length > 3 && !glosses.some((g) => g.includes(firstWord))) {
      issues.push(`headword "${word.english}" may not align with sentenceEnglish`);
    }
  }

  for (const chunk of word.breakdown || []) {
    if (chunk.ko === '좋아하' && chunk.p === '는' && chunk.en === 'favorite') {
      issues.push('modifier -는 gloss should be "that I like" not "favorite"');
    }
  }

  const romSyllables = word.romanization.split(' ').join('').length;
  const koLen = word.korean.length;
  if (romSyllables < koLen * 1.5 || romSyllables > koLen * 5) {
    issues.push('romanization length outlier vs korean');
  }

  return issues.map((msg) => ({ deckId: deck.id, korean: word.korean, message: msg }));
}

const entries = [];

for (const deck of decks) {
  for (const word of deck.words) {
    entries.push({
      deckId: deck.id,
      deckTitle: deck.title,
      korean: word.korean,
      romanization: word.romanization,
      english: word.english,
      sentenceKorean: word.sentenceKorean,
      sentenceEnglish: word.sentenceEnglish,
      breakdown: word.breakdown
    });
    flags.push(...flagWord(deck, word));
  }
}

const reviewDir = join(ROOT, 'tools', 'review');
mkdirSync(reviewDir, { recursive: true });
writeFileSync(join(reviewDir, 'entries.json'), JSON.stringify(entries, null, 2));

const csv = ['deck,korean,issue', ...flags.map((f) => {
  return `${f.deckId},"${f.korean.replace(/"/g, '""')}","${f.message.replace(/"/g, '""')}"`;
})].join('\n');
writeFileSync(join(reviewDir, 'translation-flags.csv'), csv);

console.log(`Exported ${entries.length} entries to tools/review/entries.json`);
console.log(`Translation flags: ${flags.length} heuristic warning(s).`);

if (flags.length) {
  const byDeck = {};
  for (const f of flags) {
    byDeck[f.deckId] = (byDeck[f.deckId] || 0) + 1;
  }
  for (const [id, count] of Object.entries(byDeck).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${id}: ${count}`);
  }
  console.log(`\nFull report: tools/review/translation-flags.csv`);
}
