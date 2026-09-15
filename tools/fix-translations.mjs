import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDecks, DECKS_DIR } from './load-decks.mjs';
import { serializeDeck, readDeckHeader } from './serialize-deck.mjs';

const GLOSS_FIXES = [
  { ko: '좋아하', p: '는', from: 'favorite', to: 'that I like' }
];

const { decks, deckFiles } = loadDecks();
let total = 0;

for (const deck of decks) {
  let changed = false;

  for (const word of deck.words) {
    for (const chunk of word.breakdown || []) {
      for (const fix of GLOSS_FIXES) {
        if (chunk.ko === fix.ko && chunk.p === fix.p && chunk.en === fix.from) {
          chunk.en = fix.to;
          changed = true;
          total++;
        }
      }
    }
  }

  if (!changed) continue;

  const file = deckFiles.find((f) => {
    const g = { KOREAN_DECKS: [] };
    new Function('window', readFileSync(join(DECKS_DIR, f), 'utf8'))(g);
    return g.KOREAN_DECKS[0]?.id === deck.id;
  });

  const filePath = join(DECKS_DIR, file);
  writeFileSync(filePath, readDeckHeader(filePath, readFileSync) + serializeDeck(deck));
  console.log(`Updated glosses in ${deck.id}`);
}

console.log(`\nApplied ${total} gloss fix(es).`);
