import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadDecks, ROOT } from './load-decks.mjs';
import { auditWord } from './marker-rules.mjs';

const { decks } = loadDecks();
const issues = [];

for (const deck of decks) {
  for (const word of deck.words) {
    issues.push(...auditWord(word, deck.id));
  }
}

const byDeck = {};
for (const issue of issues) {
  const deckId = issue.label.split(' ')[0];
  if (!byDeck[deckId]) byDeck[deckId] = [];
  byDeck[deckId].push(issue);
}

console.log(`Marker audit: ${issues.length} issue(s) across ${decks.length} decks.`);

for (const [deckId, deckIssues] of Object.entries(byDeck).sort()) {
  console.log(`\n${deckId} (${deckIssues.length}):`);
  for (const issue of deckIssues.slice(0, 8)) {
    console.log(`  [${issue.type}] ${issue.message}`);
  }
  if (deckIssues.length > 8) {
    console.log(`  ... and ${deckIssues.length - 8} more`);
  }
}

const reviewDir = join(ROOT, 'tools', 'review');
mkdirSync(reviewDir, { recursive: true });

const csv = ['deck,korean,type,message', ...issues.map((i) => {
  const [, korean] = i.label.match(/^(\S+) "(.+)"$/) || [null, i.label, ''];
  return `${i.label.split(' ')[0]},"${korean || ''}",${i.type},"${i.message.replace(/"/g, '""')}"`;
})].join('\n');

writeFileSync(join(reviewDir, 'marker-issues.csv'), csv);

if (issues.length) {
  console.log(`\nFull report: tools/review/marker-issues.csv`);
  process.exit(1);
}

console.log('\nAll marker boxing checks passed.');
