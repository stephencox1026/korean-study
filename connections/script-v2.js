/**
 * Korean Connections — One Shot
 * One submit only. No show answer. Score shown below buttons after submit.
 */

const CATEGORY_COLOR_CLASSES = ['cat-green', 'cat-blue', 'cat-purple', 'cat-orange'];
const STORAGE_PREFIX = 'connections-v2:';

let deckGroups = [];
let puzzle = null;
let puzzleMode = 'daily';
let dateKey = null;
let poolTiles = [];
let placements = {};
let slotElements = {};
let selectedTileId = null;
let selectedSlotKey = null;
let isGraded = false;
let hasSubmitted = false;
let revealedSlots = new Set();
let nextId = 0;

const $ = (sel) => document.querySelector(sel);
let eventsBound = false;

function isLocked() {
  return hasSubmitted;
}

async function init() {
  try {
    bindEvents();
    dateKey = window.CONNECTIONS_DAILY.getDateKey();

    const res = await fetch('data/deck-groups.json');
    if (!res.ok) throw new Error('Could not load deck groups');
    const data = await res.json();
    deckGroups = data.groups || [];

    if (!deckGroups.length) throw new Error('No category groups found');

    clearDailyState();
    loadDailyPuzzle();
  } catch (err) {
    console.error(err);
    loadFallbackPuzzle(err.message);
  }
}

function loadFallbackPuzzle(reason) {
  const puzzles = window.CONNECTIONS_PUZZLES;
  if (!puzzles || !puzzles.length) {
    showInitError(`Failed to load puzzles: ${reason}`);
    return;
  }
  puzzleMode = 'practice';
  puzzle = puzzles[0];
  updatePuzzleLabel();
  resetGame(false);
}

function loadDailyPuzzle() {
  puzzleMode = 'daily';
  dateKey = window.CONNECTIONS_DAILY.getDateKey();
  puzzle = window.CONNECTIONS_DAILY.buildDailyPuzzle(deckGroups, dateKey);

  if (!puzzle) {
    loadFallbackPuzzle('Could not build daily puzzle');
    return;
  }

  updatePuzzleLabel();
  resetGame(false);
}

function loadNewPuzzle() {
  puzzleMode = 'practice';
  puzzle = window.CONNECTIONS_DAILY.buildRandomPuzzle(deckGroups);

  if (!puzzle) {
    showInitError('Could not generate a new puzzle. Try again.');
    return;
  }

  clearDailyState();
  updatePuzzleLabel();
  resetGame(false);
}

function updatePuzzleLabel() {
  const el = $('#puzzle-label');
  if (!el) return;

  if (puzzleMode === 'daily') {
    const date = new Date(dateKey + 'T12:00:00');
    el.textContent = date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } else {
    el.textContent = 'Practice Puzzle';
  }
}

function showInitError(msg) {
  const board = $('#category-board');
  if (board) board.innerHTML = `<p style="color:#c0392b;text-align:center">${msg}</p>`;
}

function resetGame(save = true) {
  poolTiles = [];
  placements = {};
  slotElements = {};
  selectedTileId = null;
  selectedSlotKey = null;
  isGraded = false;
  hasSubmitted = false;
  revealedSlots = new Set();
  nextId = 0;

  puzzle.categories.forEach((cat, catIdx) => {
    cat.words.forEach((word) => {
      const w = typeof word === 'string' ? { korean: word } : word;
      poolTiles.push({
        id: nextId++,
        korean: w.korean,
        romanization: w.romanization || '',
        english: w.english || '',
        categoryIndex: catIdx,
      });
    });
  });

  shuffleArray(poolTiles);
  renderCategories();
  renderPool();
  updateControls();
  updateScoreDisplay();

  if (save && puzzleMode === 'daily') saveDailyState();
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;
  document.addEventListener('click', onDocumentClick);
}

function onDocumentClick(e) {
  const target = e.target;

  if (target.closest('#clear-wrong-btn')) {
    e.preventDefault();
    clearAll();
    return;
  }
  if (target.closest('#submit-btn')) {
    e.preventDefault();
    onSubmit();
    return;
  }
  if (target.closest('#new-puzzle-btn')) {
    e.preventDefault();
    loadNewPuzzle();
    return;
  }

  if (isLocked()) return;

  if (target.closest('.pool-hint')) {
    e.preventDefault();
    returnTileToPool();
    return;
  }

  const poolTile = target.closest('.pool-tile');
  if (poolTile) {
    e.preventDefault();
    onPoolTileClick(poolTile);
    return;
  }

  const filledSlot = target.closest('.drop-slot.filled');
  if (filledSlot) {
    e.preventDefault();
    onSlotSelect(filledSlot);
    return;
  }

  const slot = target.closest('.drop-slot.empty');
  if (slot) {
    e.preventDefault();
    onSlotPlace(slot);
  }
}

function storageKey() {
  return `${STORAGE_PREFIX}${dateKey}`;
}

function saveDailyState() {
  if (puzzleMode !== 'daily' || !puzzle) return;

  try {
    const state = {
      placements,
      selectedTileId,
      selectedSlotKey,
      isGraded,
      hasSubmitted,
      revealedSlots: [...revealedSlots],
      poolOrder: poolTiles.map((t) => t.id),
      puzzleId: puzzle.id,
    };
    localStorage.setItem(storageKey(), JSON.stringify({ puzzle, state }));
  } catch (err) {
    console.warn('Could not save game state', err);
  }
}

function loadDailyState() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;

    const { puzzle: savedPuzzle, state } = JSON.parse(raw);
    if (!savedPuzzle || savedPuzzle.id !== dateKey) {
      clearDailyState();
      return null;
    }

    return { puzzle: savedPuzzle, state };
  } catch {
    clearDailyState();
    return null;
  }
}

function clearDailyState() {
  try {
    localStorage.removeItem(storageKey());
  } catch {
    /* ignore */
  }
}

function applySavedState(state) {
  placements = state.placements || {};
  selectedTileId = state.selectedTileId ?? null;
  selectedSlotKey = state.selectedSlotKey ?? null;
  isGraded = state.isGraded || false;
  hasSubmitted = state.hasSubmitted || false;
  revealedSlots = new Set(state.revealedSlots || []);

  poolTiles = [];
  nextId = 0;
  puzzle.categories.forEach((cat, catIdx) => {
    cat.words.forEach((word) => {
      const w = typeof word === 'string' ? { korean: word } : word;
      poolTiles.push({
        id: nextId++,
        korean: w.korean,
        romanization: w.romanization || '',
        english: w.english || '',
        categoryIndex: catIdx,
      });
    });
  });

  if (state.poolOrder?.length) {
    const byId = new Map(poolTiles.map((t) => [t.id, t]));
    const ordered = state.poolOrder.map((id) => byId.get(id)).filter(Boolean);
    const rest = poolTiles.filter((t) => !state.poolOrder.includes(t.id));
    poolTiles = [...ordered, ...rest];
  }
}

function persistIfDaily() {
  if (puzzleMode === 'daily') saveDailyState();
}

function countCorrectPlacements() {
  return Object.entries(placements).filter(([key, tileId]) =>
    isPlacementCorrect(key, tileId)
  ).length;
}

function updateScoreDisplay() {
  const el = $('#score-result');
  if (!el) return;

  if (!hasSubmitted) {
    el.hidden = true;
    el.textContent = '';
    el.classList.remove('score-perfect');
    return;
  }

  const total = puzzle.categories.length * 4;
  const correct = countCorrectPlacements();
  const pct = Math.round((correct / total) * 100);
  el.textContent = `${correct} / ${total} correct (${pct}%)`;
  el.hidden = false;
  el.classList.toggle('score-perfect', correct === total);
}

function updateControls() {
  const submitBtn = $('#submit-btn');
  const clearBtn = $('#clear-wrong-btn');
  const locked = isLocked();

  if (submitBtn) {
    submitBtn.disabled = locked;
    submitBtn.classList.toggle('is-disabled', locked);
  }
  if (clearBtn) {
    clearBtn.disabled = locked;
    clearBtn.classList.toggle('is-disabled', locked);
  }
}

function renderCategories() {
  const board = $('#category-board');
  board.innerHTML = '';
  slotElements = {};

  puzzle.categories.forEach((cat, rowIdx) => {
    const row = document.createElement('div');
    row.className = `category-row ${CATEGORY_COLOR_CLASSES[rowIdx] || ''}`;

    const label = document.createElement('p');
    label.className = 'category-label';
    label.textContent = cat.name;
    row.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'tile-grid';

    for (let col = 0; col < 4; col++) {
      const key = `${rowIdx}-${col}`;
      const slot = document.createElement('div');
      slot.className = 'tile drop-slot empty';
      slot.dataset.row = rowIdx;
      slot.dataset.col = col;
      slot.dataset.slotKey = key;

      const placedId = placements[key];
      if (placedId !== undefined) {
        const tile = getTileById(placedId);
        slot.classList.remove('empty');
        slot.classList.add('filled');
        renderSlotContent(slot, tile, key);

        if (isGraded && !isPlacementCorrect(key, placedId)) {
          slot.classList.add('incorrect');
        }
        if (!isLocked() && key === selectedSlotKey) {
          slot.classList.add('selected');
        }
      }

      slotElements[key] = slot;
      grid.appendChild(slot);
    }

    row.appendChild(grid);
    board.appendChild(row);
  });
}

function renderPool() {
  const grid = $('#tile-grid');
  grid.innerHTML = '';

  const hint = $('#pool .pool-hint');
  if (hint) {
    hint.classList.toggle('return-active', !isLocked() && Boolean(selectedSlotKey));
  }

  poolTiles.filter((t) => !isPlaced(t.id)).forEach((tile) => {
    const el = document.createElement('div');
    el.className = 'tile pool-tile';
    if (!isLocked()) {
      el.classList.add('pressable');
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
    } else {
      el.classList.add('pool-tile--locked');
    }
    if (tile.id === selectedTileId) el.classList.add('selected');
    el.dataset.id = tile.id;
    el.textContent = tile.korean;
    grid.appendChild(el);
  });
}

function isPlaced(tileId) {
  return Object.values(placements).includes(tileId);
}

function getTileById(id) {
  return poolTiles.find((t) => t.id === id);
}

function shouldShowTranslation(slotKey, tile) {
  if (!tile?.english) return false;
  if (!revealedSlots.has(slotKey)) return false;
  return isPlacementCorrect(slotKey, tile.id);
}

function revealCorrectTranslations() {
  Object.entries(placements).forEach(([key, tileId]) => {
    if (isPlacementCorrect(key, tileId)) {
      revealedSlots.add(key);
    }
  });
}

function renderSlotContent(slot, tile, slotKey) {
  slot.classList.remove('with-translation');
  slot.replaceChildren();

  if (shouldShowTranslation(slotKey, tile)) {
    slot.classList.add('with-translation');
    const korean = document.createElement('span');
    korean.className = 'slot-korean';
    korean.textContent = tile.korean;
    const english = document.createElement('span');
    english.className = 'slot-english';
    english.textContent = tile.english;
    slot.append(korean, english);
    return;
  }

  slot.textContent = tile.korean;
}

function isPlacementCorrect(slotKey, tileId) {
  const rowIdx = parseInt(slotKey.split('-')[0], 10);
  const tile = getTileById(tileId);
  return tile && tile.categoryIndex === rowIdx;
}

function onPoolTileClick(el) {
  if (isLocked()) return;

  const tileId = parseInt(el.dataset.id, 10);
  if (Number.isNaN(tileId)) return;

  selectedSlotKey = null;
  selectedTileId = selectedTileId === tileId ? null : tileId;
  renderCategories();
  renderPool();
  persistIfDaily();
}

function onSlotSelect(slot) {
  if (isLocked()) return;

  const slotKey = slot.dataset.slotKey;
  if (placements[slotKey] === undefined) return;

  if (selectedSlotKey === slotKey) {
    selectedSlotKey = null;
    selectedTileId = null;
  } else {
    selectedSlotKey = slotKey;
    selectedTileId = placements[slotKey];
  }

  renderCategories();
  renderPool();
  persistIfDaily();
}

function returnTileToPool() {
  if (isLocked() || !selectedSlotKey) return;

  revealedSlots.delete(selectedSlotKey);
  delete placements[selectedSlotKey];
  selectedSlotKey = null;
  selectedTileId = null;
  isGraded = false;

  renderCategories();
  renderPool();
  persistIfDaily();
}

function onSlotPlace(slot) {
  if (isLocked()) return;

  const targetKey = slot.dataset.slotKey;

  if (selectedSlotKey !== null) {
    if (targetKey === selectedSlotKey) return;

    const tileId = placements[selectedSlotKey];
    if (tileId === undefined) return;

    revealedSlots.delete(selectedSlotKey);
    delete placements[selectedSlotKey];
    placements[targetKey] = tileId;
    selectedSlotKey = null;
    selectedTileId = null;
    isGraded = false;

    renderCategories();
    renderPool();
    persistIfDaily();
    return;
  }

  if (selectedTileId === null) return;

  const tile = getTileById(selectedTileId);
  if (!tile || isPlaced(tile.id)) return;

  placements[targetKey] = tile.id;
  selectedTileId = null;
  isGraded = false;

  renderCategories();
  renderPool();
  persistIfDaily();
}

function onSubmit() {
  if (hasSubmitted) return;

  hasSubmitted = true;
  isGraded = true;
  selectedTileId = null;
  selectedSlotKey = null;
  revealCorrectTranslations();

  renderCategories();
  renderPool();
  updateControls();
  updateScoreDisplay();
  persistIfDaily();
}

function clearAll() {
  if (isLocked()) return;

  placements = {};
  revealedSlots = new Set();
  selectedSlotKey = null;
  selectedTileId = null;
  isGraded = false;

  renderCategories();
  renderPool();
  persistIfDaily();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

document.addEventListener('DOMContentLoaded', init);
