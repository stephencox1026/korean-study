/* Shared marker-boxing rules for breakdown chunks. */

export const MARKER_DECK_ID = 'set-09-markers';

export const COPULA_ENDINGS = ['이에요', '입니다', '입니까', '예요', '이야'];

export const PARTICLES = [
  '이라고', '이나', '에는', '에도', '에서', '으로', '부터', '까지', '에게', '한테',
  '께서', '보다', '마다', '조차', '와', '과', '랑', '의', '에', '로', '을', '를',
  '이', '가', '은', '는', '도', '만', '께', '당', '네', '들'
];

export const VERB_ENDING_RE =
  /(?:[어아여]요|세요|십니다|습니다|ㅂ니다|었어요|았어요|였어요|했어요|겠어요|ㄹ게요|네요|지요|죠|군요|구나)$/;

const stripped = (text) => text.replace(/[\s.,?!~…'"()]/g, '');

export function chunkText(chunk) {
  return chunk.ko + (chunk.p || '');
}

export function isHeadwordChunk(chunk, headword) {
  return chunk.ko === headword || chunkText(chunk) === headword;
}

export function isVerbConjugation(ko) {
  if (COPULA_ENDINGS.some((suf) => ko.endsWith(suf) && ko.length > suf.length)) {
    return false;
  }
  return VERB_ENDING_RE.test(ko);
}

export function trySplitChunk(chunk, headword, deckId) {
  if (deckId === MARKER_DECK_ID) return null;
  if (chunk.p) return null;
  if (isHeadwordChunk(chunk, headword)) return null;

  const { ko, en } = chunk;
  if (!ko || isVerbConjugation(ko)) return null;

  if (ko.endsWith('하는') && ko.length > 3) {
    return { ko: ko.slice(0, -2) + '하', p: '는', en };
  }

  for (const suf of COPULA_ENDINGS) {
    if (ko.endsWith(suf) && ko.length > suf.length) {
      return { ko: ko.slice(0, -suf.length), p: suf, en };
    }
  }

  if (ko.length >= 2 && ko.length <= 5 && ko.endsWith('은')) {
    const stem = ko.slice(0, -1);
    if (stem.length >= 1 && !isVerbConjugation(ko)) {
      return { ko: stem, p: '은', en };
    }
  }

  if (ko.length >= 2 && ko.length <= 4 && ko.endsWith('ㄴ') && !ko.endsWith('은')) {
    const stem = ko.slice(0, -1);
    if (stem.length >= 1) {
      return { ko: stem, p: 'ㄴ', en };
    }
  }

  for (const particle of PARTICLES) {
    if (ko.endsWith(particle) && ko.length > particle.length) {
      const stem = ko.slice(0, -particle.length);
      if (stem.length >= 1 && !isVerbConjugation(ko) && !isVerbConjugation(stem)) {
        return { ko: stem, p: particle, en };
      }
    }
  }

  return null;
}

export function auditChunk(chunk, headword, deckId, label) {
  const issues = [];

  if (deckId === MARKER_DECK_ID) return issues;

  if (chunk.p) {
    const rebuilt = chunkText(chunk);
    if (!stripped(rebuilt).includes(stripped(chunk.p))) {
      issues.push({ label, type: 'orphan-p', message: `p "${chunk.p}" may not match ko "${chunk.ko}"` });
    }
    return issues;
  }

  if (isHeadwordChunk(chunk, headword)) return issues;

  const split = trySplitChunk(chunk, headword, deckId);
  if (split) {
    let type = 'embedded-marker';
    if (chunk.ko.endsWith('하는')) type = 'embedded-modifier';
    else if (COPULA_ENDINGS.some((s) => chunk.ko.endsWith(s))) type = 'embedded-copula';
    else if (chunk.ko.endsWith('은') || chunk.ko.endsWith('ㄴ')) type = 'embedded-adnominal';

    issues.push({
      label,
      type,
      message: `ko "${chunk.ko}" should split to ko "${split.ko}" + p "${split.p}"`,
      suggestion: split
    });
  }

  return issues;
}

export function auditWord(word, deckId) {
  const label = `${deckId} "${word.korean}"`;
  const issues = [];

  for (const chunk of word.breakdown || []) {
    issues.push(...auditChunk(chunk, word.korean, deckId, label));
  }

  return issues;
}

export function fixWordBreakdown(word, deckId) {
  if (deckId === MARKER_DECK_ID) return false;

  let changed = false;
  word.breakdown = (word.breakdown || []).map((chunk) => {
    const split = trySplitChunk(chunk, word.korean, deckId);
    if (split) {
      changed = true;
      return split;
    }
    return chunk;
  });

  return changed;
}
