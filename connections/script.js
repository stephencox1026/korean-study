/**
 * Korean Connections
 * Click vocab in S2 to select → click empty slot in S1 to place.
 * Click filled slot in S1 to select → click empty slot to move, or S2 title to return.
 */

const CATEGORY_COLOR_CLASSES = ['cat-green', 'cat-blue', 'cat-purple', 'cat-orange'];
const STORAGE_PREFIX = 'connections:';

// --- State ---
let deckGroups = [];
let puzzle = null;
let puzzleMode = 'daily'; // 'daily' | 'practice'
let dateKey = null;
let poolTiles = [];
let placements = {};
let slotElements = {};
let selectedTileId = null;
let selectedSlotKey = null;
let isGraded = false;
let showTranslations = false;
let revealedSlots = new Set();
let nextId = 0;

const $ = (sel) => document.querySelector(sel);
let eventsBound = false;

// =============================================================================
// INIT
// =============================================================================

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
  showTranslations = false;
  revealedSlots = new Set();
  nextId = 0;
  hideModal();

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
    clearWrong();
    return;
  }
  if (target.closest('#submit-btn')) {
    e.preventDefault();
    onComplete();
    return;
  }
  if (target.closest('#show-answer-btn')) {
    e.preventDefault();
    showAnswer();
    return;
  }
  if (target.closest('#new-puzzle-btn')) {
    e.preventDefault();
    loadNewPuzzle();
    return;
  }
  if (target.closest('#modal-close-btn')) {
    e.preventDefault();
    hideModal();
    return;
  }
  if (target.closest('#play-again-btn')) {
    e.preventDefault();
    hideModal();
    if (puzzleMode === 'daily') {
      resetGame();
    } else {
      loadNewPuzzle();
    }
    return;
  }

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

// =============================================================================
// STORAGE (daily puzzle only)
// =============================================================================

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
      showTranslations,
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
  showTranslations = state.showTranslations || false;
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

// =============================================================================
// RENDER
// =============================================================================

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

        if (isGraded && !showTranslations && !isPlacementCorrect(key, placedId)) {
          slot.classList.add('incorrect');
        }
        if (key === selectedSlotKey) {
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
  if (hint) hint.classList.toggle('return-active', Boolean(selectedSlotKey));

  poolTiles.filter((t) => !isPlaced(t.id)).forEach((tile) => {
    const el = document.createElement('div');
    el.className = 'tile pool-tile pressable';
    if (tile.id === selectedTileId) el.classList.add('selected');
    el.dataset.id = tile.id;
    el.textContent = tile.korean;
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
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
  if (showTranslations) return true;
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

// =============================================================================
// CLICK — select & place
// =============================================================================

function onPoolTileClick(el) {
  const tileId = parseInt(el.dataset.id, 10);
  if (Number.isNaN(tileId)) return;

  selectedSlotKey = null;
  selectedTileId = selectedTileId === tileId ? null : tileId;
  renderCategories();
  renderPool();
  persistIfDaily();
}

function onSlotSelect(slot) {
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
  if (!selectedSlotKey) return;

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

// =============================================================================
// COMPLETE & CLEAR
// =============================================================================

function onComplete() {
  isGraded = true;
  revealCorrectTranslations();

  const totalSlots = puzzle.categories.length * 4;
  const filled = Object.keys(placements).length;
  const won = filled === totalSlots && allPlacementsCorrect();

  if (won) {
    showTranslations = true;
  }

  renderCategories();
  persistIfDaily();

  if (won) {
    setTimeout(showModal, 300);
  }
}

function allPlacementsCorrect() {
  return Object.entries(placements).every(([key, tileId]) =>
    isPlacementCorrect(key, tileId)
  );
}

function clearWrong() {
  const keysToRemove = Object.entries(placements)
    .filter(([key, tileId]) => !isPlacementCorrect(key, tileId))
    .map(([key]) => key);

  keysToRemove.forEach((key) => {
    revealedSlots.delete(key);
    delete placements[key];
  });
  if (selectedSlotKey && !placements[selectedSlotKey]) {
    selectedSlotKey = null;
    selectedTileId = null;
  }

  renderCategories();
  renderPool();
  persistIfDaily();
}

function showAnswer() {
  placements = {};
  selectedTileId = null;
  selectedSlotKey = null;

  puzzle.categories.forEach((cat, rowIdx) => {
    cat.words.forEach((word, colIdx) => {
      const w = typeof word === 'string' ? { korean: word } : word;
      const tile = poolTiles.find(
        (t) => t.categoryIndex === rowIdx && t.korean === w.korean
      );
      if (tile) {
        placements[`${rowIdx}-${colIdx}`] = tile.id;
      }
    });
  });

  showTranslations = true;
  isGraded = true;
  revealedSlots = new Set();
  renderCategories();
  renderPool();
  persistIfDaily();
}

// =============================================================================
// WIN MODAL
// =============================================================================

function showModal() {
  const backdrop = $('#modal-backdrop');
  if (!backdrop) return;
  backdrop.removeAttribute('hidden');
  backdrop.classList.add('visible');
}

function hideModal() {
  const backdrop = $('#modal-backdrop');
  if (!backdrop) return;
  backdrop.classList.remove('visible');
  backdrop.setAttribute('hidden', '');
}

// =============================================================================
// UTIL
// =============================================================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

document.addEventListener('DOMContentLoaded', init);
