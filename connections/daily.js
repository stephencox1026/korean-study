/**
 * Daily / on-demand puzzle builder for Korean Connections.
 * Exposes window.CONNECTIONS_DAILY
 */
(function () {
  const WORDS_PER_GROUP = 4;
  const GROUPS_PER_PUZZLE = 4;
  const MAX_ATTEMPTS = 24;

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(items, seed) {
    const rng = mulberry32(seed >>> 0);
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function daysSinceEpoch(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  }

  function seedFromDateKey(dateKey) {
    return hashString(`connections-daily:${dateKey}`);
  }

  function randomSeed() {
    return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  }

  function pickWords(group, seed) {
    const shuffled = seededShuffle(group.words, seed ^ hashString(group.id));
    return shuffled.slice(0, WORDS_PER_GROUP).map((w) => ({
      korean: w.korean,
      romanization: w.romanization || '',
      english: w.english || '',
    }));
  }

  function groupsOverlapWords(a, b) {
    const setA = new Set(a.words.map((w) => w.korean));
    return b.words.some((w) => setA.has(w.korean));
  }

  function validateSelection(selected) {
    const names = new Set();
    const korean = new Set();
    const deckIds = new Set();
    const topics = new Set();

    for (const g of selected) {
      if (names.has(g.name)) return false;
      names.add(g.name);

      if (deckIds.has(g.deckId)) return false;
      deckIds.add(g.deckId);

      if (topics.has(g.topic)) return false;
      topics.add(g.topic);

      for (const w of g.words) {
        if (korean.has(w.korean)) return false;
        korean.add(w.korean);
      }
    }

    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        if (groupsOverlapWords(selected[i], selected[j])) return false;
      }
    }

    return true;
  }

  function trySelectGroups(groups, seed, dayIndex) {
    const sorted = [...groups].sort((a, b) => a.id.localeCompare(b.id));
    const rotated = seededShuffle(sorted, seed);

    // Bias starting index by day so consecutive days don't pick same head of list
    const start = dayIndex >= 0 ? dayIndex % rotated.length : 0;
    const ordered = rotated.slice(start).concat(rotated.slice(0, start));

    const selected = [];
    const usedGroupIds = new Set();

    for (const group of ordered) {
      if (selected.length >= GROUPS_PER_PUZZLE) break;

      const candidate = {
        ...group,
        words: pickWords(group, seed + hashString(group.id)),
      };

      const trial = [...selected, candidate];
      if (!validateSelection(trial)) continue;

      selected.push(candidate);
      usedGroupIds.add(group.id);
    }

    if (selected.length < GROUPS_PER_PUZZLE) return null;
    return selected;
  }

  function buildPuzzle(groups, seed, options = {}) {
    const dayIndex = options.dayIndex ?? -1;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const attemptSeed = (seed + attempt * 9973) >>> 0;
      const selected = trySelectGroups(groups, attemptSeed, dayIndex);
      if (selected) {
        const id = options.id || `puzzle-${seed}`;
        const title = options.title || 'Korean Connections';
        return {
          id,
          title,
          seed: attemptSeed,
          categories: selected.map((g) => ({
            name: g.name,
            words: g.words,
          })),
        };
      }
    }

    return null;
  }

  function buildDailyPuzzle(groups, dateKey) {
    const seed = seedFromDateKey(dateKey);
    const dayIndex = daysSinceEpoch(dateKey);
    const date = new Date(dateKey + 'T12:00:00');
    const title = `Daily — ${date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })}`;

    return buildPuzzle(groups, seed, {
      id: dateKey,
      title,
      dayIndex,
    });
  }

  function buildRandomPuzzle(groups) {
    const seed = randomSeed();
    return buildPuzzle(groups, seed, {
      id: `random-${seed}`,
      title: 'Practice Puzzle',
      dayIndex: -1,
    });
  }

  window.CONNECTIONS_DAILY = {
    getDateKey,
    seedFromDateKey,
    buildDailyPuzzle,
    buildRandomPuzzle,
    buildPuzzle,
  };
})();
