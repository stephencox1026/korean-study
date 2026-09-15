import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECKS_DIR = join(ROOT, 'decks');

export { ROOT, DECKS_DIR };

export function loadDecks() {
  const deckFiles = readdirSync(DECKS_DIR)
    .filter((name) => name.startsWith('set-') && name.endsWith('.js'))
    .sort();

  const globalScope = { KOREAN_DECKS: undefined };
  globalThis.window = globalScope;

  for (const file of deckFiles) {
    const source = readFileSync(join(DECKS_DIR, file), 'utf8');
    new Function('window', source)(globalScope);
  }

  return {
    decks: globalScope.KOREAN_DECKS || [],
    deckFiles
  };
}
