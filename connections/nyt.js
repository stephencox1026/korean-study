/**
 * Korean Connections — Group mode (NYT-style)
 * Select 4 tiles → Submit. Correct groups reveal colored category bars.
 */

const CATEGORY_COLOR_CLASSES = ['cat-green', 'cat-blue', 'cat-purple', 'cat-orange'];
const STORAGE_PREFIX = 'connections-nyt:';
const MAX_SELECT = 4;
const MAX_MISTAKES = 4;

let deckGroups = [];
let puzzle = null;
let puzzleMode = 'daily';
let dateKey = null;
let poolTiles = [];
let activeTileIds = new Set();
let selectedIds = [];
let solvedCategories = new Set();
let isGameOver = false;
let showTranslations = false;
let mistakesLeft = MAX_MISTAKES;
let wrongGuesses = new Set();
let nextId = 0;
let toastTimer = null;

const $ = (sel) => document.querySelector(sel);
let eventsBound = false;

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
  const board = $('#solved-groups');
  if (board) board.innerHTML = `<p style="color:#c0392b;text-align:center">${msg}</p>`;
}

function resetGame(save = true) {
  poolTiles = [];
  activeTileIds = new Set();
  selectedIds = [];
  solvedCategories = new Set();
  isGameOver = false;
  showTranslations = false;
  mistakesLeft = MAX_MISTAKES;
  wrongGuesses = new Set();
  nextId = 0;
  hideModal();
  hideToast();

  puzzle.categories.forEach((cat, catIdx) => {
    cat.words.forEach((word) => {
      const w = typeof word === 'string' ? { korean: word } : word;
      const tile = {
        id: nextId++,
        korean: w.korean,
        romanization: w.romanization || '',
        english: w.english || '',
        categoryIndex: catIdx,
      };
      poolTiles.push(tile);
      activeTileIds.add(tile.id);
    });
  });

  shuffleArray(poolTiles);
  renderSolvedGroups();
  renderPool();
  updateMistakesDisplay();
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
    clearSelection();
    return;
  }
  if (target.closest('#submit-btn')) {
    e.preventDefault();
    onSubmit();
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
    if (puzzleMode === 'daily') resetGame();
    else loadNewPuzzle();
    return;
  }

  if (isGameOver) return;

  const poolTile = target.closest('.pool-tile');
  if (poolTile) {
    e.preventDefault();
    onPoolTileClick(poolTile);
  }
}

function onPoolTileClick(el) {
  const tileId = parseInt(el.dataset.id, 10);
  if (Number.isNaN(tileId) || !activeTileIds.has(tileId)) return;

  const idx = selectedIds.indexOf(tileId);
  if (idx >= 0) {
    selectedIds.splice(idx, 1);
  } else if (selectedIds.length < MAX_SELECT) {
    selectedIds.push(tileId);
  }

  renderPool();
  persistIfDaily();
}

function onSubmit() {
  if (isGameOver) return;

  if (selectedIds.length !== MAX_SELECT) {
    shakeSelected();
    return;
  }

  const categories = selectedIds.map((id) => getTileById(id)?.categoryIndex);
  const allSame = categories.every((c) => c === categories[0]);

  if (!allSame) {
    const guessKey = getGuessKey(selectedIds);

    if (wrongGuesses.has(guessKey)) {
      showToast('Already guessed!');
      shakeSelected();
      selectedIds = [];
      renderPool();
      return;
    }

    const oneAway = isOneAway(selectedIds);
    wrongGuesses.add(guessKey);
    mistakesLeft -= 1;
    updateMistakesDisplay();
    shakeSelected();

    if (oneAway) showToast('One away...');

    selectedIds = [];
    renderPool();
    persistIfDaily();

    if (mistakesLeft <= 0) {
      endGame(false);
    }
    return;
  }

  const catIdx = categories[0];
  if (solvedCategories.has(catIdx)) {
    shakeSelected();
    selectedIds = [];
    renderPool();
    return;
  }

  solvedCategories.add(catIdx);
  selectedIds.forEach((id) => activeTileIds.delete(id));
  selectedIds = [];

  renderSolvedGroups();
  renderPool();
  persistIfDaily();

  if (solvedCategories.size === puzzle.categories.length) {
    endGame(true);
  }
}

function clearSelection() {
  selectedIds = [];
  if (!isGameOver) renderPool();
  persistIfDaily();
}

function showAnswer() {
  showTranslations = true;
  revealRemainingCategories();
  isGameOver = true;
  persistIfDaily();
  setTimeout(() => showGameOverModal(true), 300);
}

function revealRemainingCategories() {
  puzzle.categories.forEach((_, catIdx) => solvedCategories.add(catIdx));
  activeTileIds.clear();
  selectedIds = [];
  renderSolvedGroups();
  renderPool();
}

function endGame(won) {
  isGameOver = true;
  showTranslations = true;

  if (won) {
    renderSolvedGroups();
    persistIfDaily();
    setTimeout(() => showGameOverModal(true), 300);
    return;
  }

  revealRemainingCategories();
  persistIfDaily();
  setTimeout(() => showGameOverModal(false), 300);
}

function getGuessKey(ids) {
  return [...ids].sort((a, b) => a - b).join(',');
}

function isOneAway(ids) {
  const unsolved = puzzle.categories
    .map((_, catIdx) => catIdx)
    .filter((catIdx) => !solvedCategories.has(catIdx));

  return unsolved.some((catIdx) => {
    const matchCount = ids.filter((id) => getTileById(id)?.categoryIndex === catIdx).length;
    return matchCount === 3;
  });
}

function updateMistakesDisplay() {
  const dots = document.querySelectorAll('#mistakes-dots .mistake-dot');
  const used = MAX_MISTAKES - mistakesLeft;
  dots.forEach((dot, index) => {
    dot.classList.toggle('is-used', index < used);
  });
}

function showToast(message) {
  const el = $('#game-toast');
  if (!el) return;

  el.textContent = message;
  el.hidden = false;
  el.classList.add('is-visible');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 2200);
}

function hideToast() {
  const el = $('#game-toast');
  if (!el) return;

  el.classList.remove('is-visible');
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  setTimeout(() => {
    if (!el.classList.contains('is-visible')) el.hidden = true;
  }, 200);
}

function showGameOverModal(won) {
  const title = $('#modal-backdrop .modal-title');
  const sub = $('#modal-backdrop .modal-sub');
  if (title) title.textContent = won ? 'You solved it!' : 'Out of mistakes';
  if (sub) {
    sub.textContent = won
      ? 'All 16 words sorted correctly.'
      : 'The remaining groups have been revealed.';
  }
  showModal();
}

function shakeSelected() {
  const grid = $('#tile-grid');
  if (!grid) return;
  selectedIds.forEach((id) => {
    const el = grid.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.add('shake');
      el.addEventListener(
        'animationend',
        () => el.classList.remove('shake'),
        { once: true }
      );
    }
  });
}

function getTilesForCategory(catIdx) {
  return poolTiles.filter((t) => t.categoryIndex === catIdx);
}

function renderSolvedTileContent(el, tile) {
  el.classList.remove('with-translation');
  el.replaceChildren();

  if (showTranslations && tile.english) {
    el.classList.add('with-translation');
    const korean = document.createElement('span');
    korean.className = 'slot-korean';
    korean.textContent = tile.korean;
    const english = document.createElement('span');
    english.className = 'slot-english';
    english.textContent = tile.english;
    el.append(korean, english);
    return;
  }

  el.textContent = tile.korean;
}

function renderSolvedGroups() {
  const container = $('#solved-groups');
  if (!container) return;
  container.innerHTML = '';

  puzzle.categories.forEach((cat, catIdx) => {
    if (!solvedCategories.has(catIdx)) return;

    const row = document.createElement('div');
    row.className = `category-row solved-group-row ${CATEGORY_COLOR_CLASSES[catIdx] || ''}`;

    const label = document.createElement('p');
    label.className = 'category-label';
    label.textContent = cat.name;
    row.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'tile-grid';

    getTilesForCategory(catIdx).forEach((tile) => {
      const el = document.createElement('div');
      el.className = 'tile solved-tile';
      renderSolvedTileContent(el, tile);
      grid.appendChild(el);
    });

    row.appendChild(grid);
    container.appendChild(row);
  });
}

function renderPool() {
  const grid = $('#tile-grid');
  if (!grid) return;
  grid.innerHTML = '';

  poolTiles
    .filter((t) => activeTileIds.has(t.id))
    .forEach((tile) => {
      const el = document.createElement('div');
      el.className = 'tile pool-tile pressable';
      if (selectedIds.includes(tile.id)) el.classList.add('selected');
      el.dataset.id = tile.id;
      el.textContent = tile.korean;
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      grid.appendChild(el);
    });
}

function getTileById(id) {
  return poolTiles.find((t) => t.id === id);
}

function storageKey() {
  return `${STORAGE_PREFIX}${dateKey}`;
}

function saveDailyState() {
  if (puzzleMode !== 'daily' || !puzzle) return;
  try {
    const state = {
      selectedIds,
      solvedCategories: [...solvedCategories],
      activeTileIds: [...activeTileIds],
      poolOrder: poolTiles.map((t) => t.id),
      isGameOver,
      showTranslations,
      mistakesLeft,
      wrongGuesses: [...wrongGuesses],
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
  selectedIds = state.selectedIds || [];
  solvedCategories = new Set(state.solvedCategories || []);
  activeTileIds = new Set(state.activeTileIds || []);
  isGameOver = state.isGameOver || false;
  showTranslations = state.showTranslations || false;
  mistakesLeft = state.mistakesLeft ?? MAX_MISTAKES;
  wrongGuesses = new Set(state.wrongGuesses || []);

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

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

document.addEventListener('DOMContentLoaded', init);
