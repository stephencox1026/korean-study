/**
 * Extract Connections category groups from flashcard decks.
 * Run: node tools/build-deck-groups.mjs
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDecks, DECKS_DIR, ROOT } from './load-decks.mjs';

const SECTION_RE = /^\s*\/\/\s*---\s*(.+?)\s*---\s*$/;
const MIN_WORDS = 4;
const GENERIC_NAMES = new Set(['other', 'quality', 'size', 'range', 'object']);

/** Deck-level topic tags — one topic per puzzle max */
const DECK_TOPICS = {
  'set-12-food': 'food',
  'set-24-kitchen': 'food',
  'set-33-produce': 'food',
  'set-19-health': 'health',
  'set-26-emotions': 'feelings',
  'set-06-house': 'home',
  'set-34-home-life': 'home',
  'set-14-places': 'places',
  'set-23-transport': 'travel',
  'set-35-travel': 'travel',
};

function stripDeckTitle(title) {
  return title.replace(/^Set\s+\d+\s*-\s*/i, '').trim();
}

function labelForSection(deckTitle, sectionName, nameCounts) {
  const base = sectionName.trim();
  const lower = base.toLowerCase();
  if (GENERIC_NAMES.has(lower) || (nameCounts.get(lower) || 0) > 1) {
    return `${stripDeckTitle(deckTitle)}: ${base}`;
  }
  return base;
}

function parseSectionsFromSource(source) {
  const sections = [];
  let current = null;

  for (const line of source.split('\n')) {
    const header = line.match(SECTION_RE);
    if (header) {
      current = header[1].trim();
      sections.push({ name: current, wordCount: 0 });
      continue;
    }
    if (current !== null && /korean:\s*['"]/.test(line)) {
      sections[sections.length - 1].wordCount += 1;
    }
  }

  return sections;
}

function assignWordsToSections(deck, sectionDefs) {
  if (!sectionDefs.length) return [];

  const groups = [];
  let wordIdx = 0;

  for (const def of sectionDefs) {
    const words = [];
    for (let i = 0; i < def.wordCount && wordIdx < deck.words.length; i++) {
      const w = deck.words[wordIdx++];
      words.push({
        korean: w.korean,
        romanization: w.romanization || '',
        english: w.english || '',
      });
    }
    if (words.length >= MIN_WORDS) {
      groups.push({ sectionName: def.name, words });
    }
  }

  while (wordIdx < deck.words.length) wordIdx++;

  return groups;
}

function normalizeWord(w) {
  return {
    korean: w.korean,
    romanization: w.romanization || '',
    english: w.english || '',
  };
}

function buildGroups() {
  const { decks, deckFiles } = loadDecks();
  const fileByDeckId = new Map();

  for (const file of deckFiles) {
    const source = readFileSync(join(DECKS_DIR, file), 'utf8');
    const idMatch = source.match(/id:\s*'([^']+)'/);
    if (idMatch) fileByDeckId.set(idMatch[1], source);
  }

  const rawGroups = [];
  const nameCounts = new Map();

  for (const deck of decks) {
    const source = fileByDeckId.get(deck.id) || '';
    const sectionDefs = parseSectionsFromSource(source);
    const sectionGroups = assignWordsToSections(deck, sectionDefs);
    const topic = DECK_TOPICS[deck.id] || deck.id;

    for (const sg of sectionGroups) {
      const lower = sg.sectionName.toLowerCase();
      nameCounts.set(lower, (nameCounts.get(lower) || 0) + 1);
      rawGroups.push({
        id: `${deck.id}:${sg.sectionName.toLowerCase().replace(/\s+/g, '-')}`,
        name: sg.sectionName,
        deckId: deck.id,
        deckTitle: deck.title,
        topic,
        words: sg.words,
      });
    }

    if (sectionGroups.length === 0 && deck.words.length >= MIN_WORDS) {
      rawGroups.push({
        id: deck.id,
        name: stripDeckTitle(deck.title),
        deckId: deck.id,
        deckTitle: deck.title,
        topic,
        words: deck.words.map(normalizeWord),
      });
    }
  }

  const groups = rawGroups.map((g) => ({
    ...g,
    name: labelForSection(g.deckTitle, g.name, nameCounts),
  }));

  return {
    generatedAt: new Date().toISOString(),
    groupCount: groups.length,
    groups,
  };
}

const output = buildGroups();
const outPath = join(ROOT, 'connections', 'data', 'deck-groups.json');
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${output.groupCount} groups to ${outPath}`);
