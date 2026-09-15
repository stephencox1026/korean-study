function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatChunk(chunk, indent) {
  const parts = [`ko: '${escapeJs(chunk.ko)}'`];
  if (chunk.p) parts.push(`p: '${escapeJs(chunk.p)}'`);
  parts.push(`en: '${escapeJs(chunk.en)}'`);
  return `${indent}{ ${parts.join(', ')} }`;
}

function formatWord(word, indent) {
  const lines = [];
  lines.push(`${indent}{`);
  lines.push(`${indent}  korean: '${escapeJs(word.korean)}',`);
  lines.push(`${indent}  romanization: '${escapeJs(word.romanization)}',`);
  lines.push(`${indent}  english: '${escapeJs(word.english)}',`);
  lines.push(`${indent}  sentenceKorean: '${escapeJs(word.sentenceKorean)}',`);
  lines.push(`${indent}  sentenceEnglish: '${escapeJs(word.sentenceEnglish)}',`);
  if (word.dayCharacter) {
    lines.push(`${indent}  dayCharacter: '${escapeJs(word.dayCharacter)}',`);
  }
  lines.push(`${indent}  breakdown: [`);
  for (const chunk of word.breakdown) {
    lines.push(`${indent}    ${formatChunk(chunk, '')},`);
  }
  lines.push(`${indent}  ]`);
  lines.push(`${indent}}`);
  return lines.join('\n');
}

export function serializeDeck(deck) {
  const lines = [];
  const extra = deck.dayFilter ? '\n  dayFilter: true,' : '';

  lines.push('window.KOREAN_DECKS = window.KOREAN_DECKS || [];');
  lines.push('');
  lines.push('window.KOREAN_DECKS.push({');
  lines.push(`  id: '${escapeJs(deck.id)}',`);
  lines.push(`  title: '${escapeJs(deck.title)}',${extra}`);
  lines.push('  words: [');
  lines.push('');

  for (let i = 0; i < deck.words.length; i++) {
    lines.push(formatWord(deck.words[i], '    ') + (i < deck.words.length - 1 ? ',' : ''));
    lines.push('');
  }

  lines.push('  ]');
  lines.push('});');
  lines.push('');
  return lines.join('\n');
}

export function readDeckHeader(filePath, readFileSync) {
  const source = readFileSync(filePath, 'utf8');
  const end = source.indexOf('window.KOREAN_DECKS');
  if (end === -1) return '';
  return source.slice(0, end);
}
