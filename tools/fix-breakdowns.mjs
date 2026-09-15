import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDecks, DECKS_DIR } from './load-decks.mjs';
import { fixWordBreakdown } from './marker-rules.mjs';
import { serializeDeck, readDeckHeader } from './serialize-deck.mjs';

const { decks, deckFiles } = loadDecks();
let totalFixed = 0;

for (const deck of decks) {
  let deckChanged = false;
  for (const word of deck.words) {
    if (fixWordBreakdown(word, deck.id)) {
      deckChanged = true;
      totalFixed++;
    }
  }

  if (!deckChanged) continue;

  const file = deckFiles.find((f) => {
    const g = { KOREAN_DECKS: [] };
    new Function('window', readFileSync(join(DECKS_DIR, f), 'utf8'))(g);
    return g.KOREAN_DECKS[0]?.id === deck.id;
  });

  if (!file) {
    console.error(`Could not find file for deck ${deck.id}`);
    continue;
  }

  const filePath = join(DECKS_DIR, file);
  const header = readDeckHeader(filePath, readFileSync);
  const body = serializeDeck(deck);
  writeFileSync(filePath, header + body);
  console.log(`Fixed ${deck.id} (${file})`);
}

console.log(`\nUpdated ${totalFixed} entries across decks.`);
