/* ==========================================================================
   Korean Flashcards - app logic
   Decks are registered by the files in decks/ before this script runs.
   ========================================================================== */

(function () {
  'use strict';

  // --- Constants ----------------------------------------------------------

  var ALL_WORDS_ID = '__all';

  // Kept in sync with the matching transition durations in style.css.
  var CARD_CHANGE_MS = 220;
  var SENTENCE_SWAP_MS = 200;

  var STORAGE_KEYS = {
    deck: 'koreanFlashcards.deckId',
    startLanguage: 'koreanFlashcards.startLanguage',
    positions: 'koreanFlashcards.positions',
    dayFilter: 'koreanFlashcards.dayFilter'
  };

  // --- Elements -----------------------------------------------------------

  var el = {
    deckPicker: document.getElementById('deck-picker'),
    languageToggle: document.getElementById('start-language-toggle'),
    card: document.getElementById('card'),
    cardInner: document.querySelector('.card-inner'),
    frontHint: document.getElementById('front-hint'),
    frontWord: document.getElementById('front-word'),
    backHint: document.getElementById('back-hint'),
    backWord: document.getElementById('back-word'),
    backRomanization: document.getElementById('back-romanization'),
    sentencePanel: document.getElementById('sentence-panel'),
    sentenceText: document.getElementById('sentence-text'),
    breakdown: document.getElementById('breakdown'),
    cardPrev: document.getElementById('card-prev'),
    cardNext: document.getElementById('card-next'),
    speakCard: document.getElementById('speak-card'),
    speakSentence: document.getElementById('speak-sentence'),
    prevBtn: document.getElementById('prev-btn'),
    flipBtn: document.getElementById('flip-btn'),
    nextBtn: document.getElementById('next-btn'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    progressText: document.getElementById('progress-text'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    dayFilter: document.getElementById('day-filter')
  };

  // --- State --------------------------------------------------------------

  var decks = [];          // every selectable deck, including "All Words"
  var words = [];          // words of the active deck
  var order = [];          // indices into `words`; shuffling reorders this
  var index = 0;           // position within `order`
  var deckId = null;
  var activeDeck = null;
  var activeDayFilter = 'all';
  var startLanguage = 'korean';
  var isFlipped = false;
  var isShuffled = false;
  var pendingChange = null;
  var pendingSwap = null;

  // --- Storage ------------------------------------------------------------

  // Private browsing and file:// in some browsers can throw on storage access,
  // so every read and write is guarded and the app just runs without memory.
  function readStored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function writeStored(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* storage unavailable - not worth surfacing */
    }
  }

  function readPositions() {
    try {
      return JSON.parse(readStored(STORAGE_KEYS.positions)) || {};
    } catch (err) {
      return {};
    }
  }

  function positionKey() {
    if (activeDeck && activeDeck.dayFilter && activeDayFilter !== 'all') {
      return deckId + ':' + activeDayFilter;
    }
    return deckId;
  }

  function savePosition() {
    if (!words.length) return;
    var positions = readPositions();
    // Store the word's natural index, so a reload lands on the same word even
    // if the deck was shuffled during the last session.
    positions[positionKey()] = order[index];
    writeStored(STORAGE_KEYS.positions, JSON.stringify(positions));
  }

  function getFilteredWords(deck) {
    if (!deck.dayFilter || activeDayFilter === 'all') return deck.words;
    return deck.words.filter(function (word) {
      return word.dayCharacter === activeDayFilter;
    });
  }

  function updateDayFilterUI(deck) {
    if (!el.dayFilter) return;
    var show = !!(deck && deck.dayFilter);
    if (show) {
      el.dayFilter.removeAttribute('hidden');
    } else {
      el.dayFilter.setAttribute('hidden', '');
    }
    Array.prototype.forEach.call(
      el.dayFilter.querySelectorAll('.day-filter-option'),
      function (button) {
        var active = button.getAttribute('data-day') === activeDayFilter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    );
  }

  function applyFilteredWords(startIndex) {
    words = getFilteredWords(activeDeck);
    order = words.map(function (_, i) { return i; });
    isShuffled = false;
    updateShuffleButton();

    var resumeAt = typeof startIndex === 'number' ? startIndex : 0;
    if (words.length) {
      index = Math.min(Math.max(resumeAt, 0), words.length - 1);
    } else {
      index = 0;
    }

    isFlipped = false;
    el.card.classList.remove('is-flipped');
    render();
  }

  function setDayFilter(day) {
    if (!activeDeck || !activeDeck.dayFilter || day === activeDayFilter) return;

    stopSpeech();
    savePosition();

    activeDayFilter = day;
    writeStored(STORAGE_KEYS.dayFilter, day);

    var positions = readPositions();
    applyFilteredWords(positions[positionKey()] || 0);
    updateDayFilterUI(activeDeck);
  }

  // --- Deck setup ---------------------------------------------------------

  function buildDeckList() {
    var registered = (window.KOREAN_DECKS || []).filter(function (deck) {
      return deck && deck.words && deck.words.length;
    });

    decks = registered.slice();

    // One combined deck for studying everything at once.
    if (registered.length > 1) {
      var all = [];
      registered.forEach(function (deck) {
        all = all.concat(deck.words);
      });
      decks.push({ id: ALL_WORDS_ID, title: 'All Words', words: all });
    }

    decks.forEach(function (deck) {
      var option = document.createElement('option');
      option.value = deck.id;
      option.textContent = deck.title + ' (' + deck.words.length + ')';
      el.deckPicker.appendChild(option);
    });
  }

  function findDeck(id) {
    for (var i = 0; i < decks.length; i++) {
      if (decks[i].id === id) return decks[i];
    }
    return null;
  }

  function loadDeck(id, startIndex) {
    stopSpeech();

    var deck = findDeck(id) || decks[0];
    activeDeck = deck;
    deckId = deck.id;

    if (deck.dayFilter) {
      var savedFilter = readStored(STORAGE_KEYS.dayFilter);
      activeDayFilter = savedFilter || 'all';
    } else {
      activeDayFilter = 'all';
    }

    el.deckPicker.value = deckId;
    writeStored(STORAGE_KEYS.deck, deckId);
    updateDayFilterUI(deck);

    var positions = readPositions();
    var resumeAt = typeof startIndex === 'number' ? startIndex : (positions[positionKey()] || 0);
    applyFilteredWords(resumeAt);
  }

  // --- Rendering ----------------------------------------------------------

  function currentWord() {
    return words[order[index]];
  }

  // The language of the face you are looking at right now.
  function visibleLanguage() {
    if (startLanguage === 'korean') return isFlipped ? 'english' : 'korean';
    return isFlipped ? 'korean' : 'english';
  }

  function sentenceForVisibleFace() {
    var word = currentWord();
    return visibleLanguage() === 'korean' ? word.sentenceKorean : word.sentenceEnglish;
  }

  function wordForVisibleFace() {
    var word = currentWord();
    return visibleLanguage() === 'korean' ? word.korean : word.english;
  }

  function langCode(language) {
    return language === 'korean' ? 'ko-KR' : 'en-US';
  }

  // Entries range from 눈 to '천천히 말해 주세요' and from 'body' to
  // 'older brother (said by a male)', so one font size cannot serve them all.
  // Long values step down a notch or two instead of wrapping off the card.
  function sizeClass(text, lang) {
    var length = text.length;
    if (lang === 'ko') {
      if (length > 8) return ' is-xs';
      if (length > 5) return ' is-sm';
      return '';
    }
    if (length > 24) return ' is-xs';
    if (length > 14) return ' is-sm';
    return '';
  }

  function render() {
    // The start-language toggle is applied before a deck is loaded on startup.
    if (!words.length) return;

    var word = currentWord();
    var koreanFirst = startLanguage === 'korean';

    // Front holds the prompt, back holds the answer plus romanization.
    var frontText = koreanFirst ? word.korean : word.english;
    var backText = koreanFirst ? word.english : word.korean;
    var frontLang = koreanFirst ? 'ko' : 'en';
    var backLang = koreanFirst ? 'en' : 'ko';

    el.frontHint.textContent = koreanFirst ? 'Korean' : 'English';
    el.frontWord.textContent = frontText;
    el.frontWord.setAttribute('lang', frontLang);
    el.frontWord.className = 'card-word' + sizeClass(frontText, frontLang);

    el.backHint.textContent = koreanFirst ? 'English' : 'Korean';
    el.backWord.textContent = backText;
    el.backWord.setAttribute('lang', backLang);
    el.backWord.className = 'card-word' + sizeClass(backText, backLang);
    el.backRomanization.textContent = word.romanization;

    renderSentence();
    renderProgress();
  }

  function renderSentence() {
    var korean = visibleLanguage() === 'korean';
    var text = sentenceForVisibleFace();

    el.sentenceText.textContent = text;
    el.sentenceText.setAttribute('lang', korean ? 'ko' : 'en');

    // Korean says the same thing in roughly half the characters, so the two
    // languages need different thresholds before the size steps down.
    var long = korean ? 22 : 44;
    var veryLong = korean ? 34 : 68;
    el.sentenceText.className =
      'sentence-text' +
      (text.length > veryLong ? ' is-xs' : text.length > long ? ' is-sm' : '');

    renderBreakdown();
  }

  // The word-by-word gloss of the Korean sentence. Only drawn once the card is
  // flipped, because the chunks contain the Korean and would hand over the
  // answer in English-first mode.
  function renderBreakdown() {
    el.breakdown.textContent = '';
    el.sentencePanel.classList.toggle('is-answer', isFlipped);

    if (!isFlipped) return;

    var chunks = currentWord().breakdown;
    if (!chunks || !chunks.length) return;

    chunks.forEach(function (chunk) {
      var column = document.createElement('span');
      column.className = 'chunk';

      var ko = document.createElement('span');
      ko.className = 'chunk-ko';
      ko.setAttribute('lang', 'ko');
      ko.appendChild(document.createTextNode(chunk.ko));

      // Particles get their own outlined box, the way they are circled by hand.
      if (chunk.p) {
        var particle = document.createElement('span');
        particle.className = 'chunk-particle';
        particle.textContent = chunk.p;
        ko.appendChild(particle);
      }

      var en = document.createElement('span');
      en.className = 'chunk-en';
      en.textContent = chunk.en;

      column.appendChild(ko);
      column.appendChild(en);
      el.breakdown.appendChild(column);
    });
  }

  function renderProgress() {
    el.progressText.textContent = 'Card ' + (index + 1) + ' of ' + words.length;
    el.progressBarFill.style.width = ((index + 1) / words.length) * 100 + '%';
    el.flipBtn.textContent = isFlipped ? 'Back' : 'Flip';
  }

  // --- Actions ------------------------------------------------------------

  function flip() {
    isFlipped = !isFlipped;
    el.card.classList.toggle('is-flipped', isFlipped);

    // Swap the sentence behind the fade, timed to land mid-flip.
    clearTimeout(pendingSwap);
    el.sentencePanel.classList.add('is-swapping');
    pendingSwap = setTimeout(function () {
      renderSentence();
      el.sentencePanel.classList.remove('is-swapping');
    }, SENTENCE_SWAP_MS);

    renderProgress();
  }

  function goTo(nextIndex, direction) {
    if (nextIndex === index) return;

    stopSpeech();
    index = nextIndex;

    // Update the counter right away so holding down an arrow key still feels
    // responsive; the word itself swaps once the card has faded out.
    renderProgress();

    el.card.classList.add('is-changing', 'is-changing--' + direction);

    clearTimeout(pendingChange);
    pendingChange = setTimeout(function () {
      // Snap back to the front with the flip transition suspended, so the card
      // never visibly un-flips while it is faded out.
      el.cardInner.style.transition = 'none';
      isFlipped = false;
      el.card.classList.remove('is-flipped');

      render();

      void el.cardInner.offsetWidth; // force reflow before restoring transitions
      el.cardInner.style.transition = '';

      el.card.classList.remove('is-changing', 'is-changing--next', 'is-changing--prev');
      el.sentencePanel.classList.remove('is-swapping');

      savePosition();
    }, CARD_CHANGE_MS);
  }

  function next() {
    goTo((index + 1) % words.length, 'next');
  }

  function prev() {
    goTo((index - 1 + words.length) % words.length, 'prev');
  }

  function shuffle() {
    if (words.length < 2) return;

    stopSpeech();

    if (isShuffled) {
      order = words.map(function (_, i) { return i; });
      isShuffled = false;
    } else {
      // Fisher-Yates over the order array; the word data itself is never moved.
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
      isShuffled = true;
    }

    index = 0;
    isFlipped = false;

    el.cardInner.style.transition = 'none';
    el.card.classList.remove('is-flipped');
    render();
    void el.cardInner.offsetWidth;
    el.cardInner.style.transition = '';

    updateShuffleButton();
    savePosition();
  }

  function updateShuffleButton() {
    el.shuffleBtn.classList.toggle('is-active', isShuffled);
    el.shuffleBtn.setAttribute('aria-pressed', isShuffled ? 'true' : 'false');
  }

  function setStartLanguage(language) {
    stopSpeech();

    startLanguage = language === 'english' ? 'english' : 'korean';
    writeStored(STORAGE_KEYS.startLanguage, startLanguage);

    Array.prototype.forEach.call(
      el.languageToggle.querySelectorAll('.lang-toggle-option'),
      function (button) {
        var active = button.getAttribute('data-language') === startLanguage;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    );

    // Changing direction mid-card would leave the answer showing, so reset.
    isFlipped = false;
    el.cardInner.style.transition = 'none';
    el.card.classList.remove('is-flipped');
    render();
    void el.cardInner.offsetWidth;
    el.cardInner.style.transition = '';
  }

  // --- Text-to-speech -----------------------------------------------------

  var ttsPlaying = false;
  var ttsCurrent = null;

  function textForSpeech(text) {
    return text
      .replace(/[.?!…]+/g, ' ')
      .replace(/[,;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pickVoice(lang) {
    var synth = window.speechSynthesis;
    if (!synth) return null;
    var voices = synth.getVoices();
    if (!voices.length) return null;
    var prefix = lang.split('-')[0];
    var match = voices.find(function (voice) { return voice.lang === lang; });
    if (match) return match;
    match = voices.find(function (voice) { return voice.lang.indexOf(prefix) === 0; });
    if (match) return match;
    return voices.find(function (voice) { return voice.lang.indexOf(prefix) !== -1; }) || null;
  }

  function stopSpeech() {
    ttsPlaying = false;
    ttsCurrent = null;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  }

  function speak(text, lang) {
    var synth = window.speechSynthesis;
    var Utterance = window.SpeechSynthesisUtterance;
    if (!synth || !Utterance || !text || ttsPlaying) return;

    var cleaned = textForSpeech(text);
    if (!cleaned) return;

    var utterance = new Utterance(cleaned);
    utterance.lang = lang;
    if (lang.indexOf('ko') === 0) utterance.rate = 0.35;
    var voice = pickVoice(lang);
    if (voice) utterance.voice = voice;

    ttsCurrent = utterance;
    ttsPlaying = true;

    utterance.onend = function () {
      ttsPlaying = false;
      ttsCurrent = null;
    };
    utterance.onerror = function () {
      ttsPlaying = false;
      ttsCurrent = null;
    };

    synth.resume();
    synth.speak(utterance);
  }

  function speakVisibleWord() {
    if (!words.length) return;
    speak(wordForVisibleFace(), langCode(visibleLanguage()));
  }

  function speakVisibleSentence() {
    if (!words.length) return;
    speak(sentenceForVisibleFace(), langCode(visibleLanguage()));
  }

  // --- Events -------------------------------------------------------------

  // Mouse-clicking a control leaves it focused, and a focused button swallows
  // the next space press to re-trigger itself instead of flipping the card.
  // `detail > 0` is only true for real pointer clicks, so keyboard users who
  // tab to a button keep the normal space-activates-the-button behaviour.
  function bindControl(button, action) {
    button.addEventListener('click', function (event) {
      if (event.detail > 0) button.blur();
      action();
    });
  }

  function bindSpeakButton(button, action) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      if (event.detail > 0) button.blur();
      action();
    });
  }

  function bindEvents() {
    el.card.addEventListener('click', function (event) {
      if (event.target.closest('.speak-btn')) return;
      flip();
    });
    el.card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // The card is a focusable div, so without this the document-level
        // handler below would flip it a second time.
        event.stopPropagation();
        flip();
      }
    });

    bindControl(el.flipBtn, flip);
    bindControl(el.nextBtn, next);
    bindControl(el.prevBtn, prev);
    bindControl(el.shuffleBtn, shuffle);
    bindControl(el.cardPrev, prev);
    bindControl(el.cardNext, next);
    bindSpeakButton(el.speakCard, speakVisibleWord);
    bindSpeakButton(el.speakSentence, speakVisibleSentence);

    el.deckPicker.addEventListener('change', function () {
      var positions = readPositions();
      loadDeck(el.deckPicker.value, positions[el.deckPicker.value] || 0);
      // Hand the arrow keys back to the deck instead of the dropdown.
      el.deckPicker.blur();
    });

    el.dayFilter.addEventListener('click', function (event) {
      var button = event.target.closest('.day-filter-option');
      if (!button) return;
      if (event.detail > 0) button.blur();
      setDayFilter(button.getAttribute('data-day'));
    });

    el.languageToggle.addEventListener('click', function (event) {
      var button = event.target.closest('.lang-toggle-option');
      if (!button) return;
      if (event.detail > 0) button.blur();
      setStartLanguage(button.getAttribute('data-language'));
    });

    document.addEventListener('keydown', function (event) {
      // Let the select and buttons keep their own keyboard behaviour.
      var tag = event.target.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (tag === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        flip();
      } else if (event.key === 's' || event.key === 'S') {
        shuffle();
      }
    });
  }

  function showEmptyState() {
    el.frontWord.textContent = 'No decks loaded';
    el.sentenceText.textContent =
      'Add a vocab file in decks/ and a matching <script> tag in index.html. See ADDING-A-SET.md.';
    el.progressText.textContent = 'Card 0 of 0';
    [el.prevBtn, el.flipBtn, el.nextBtn, el.shuffleBtn, el.deckPicker,
      el.cardPrev, el.cardNext, el.speakCard, el.speakSentence].forEach(
      function (control) { control.disabled = true; }
    );
  }

  // --- Init ---------------------------------------------------------------

  function init() {
    buildDeckList();

    if (!decks.length) {
      showEmptyState();
      return;
    }

    setStartLanguage(readStored(STORAGE_KEYS.startLanguage) || 'korean');

    var savedDeckId = readStored(STORAGE_KEYS.deck);
    var resumeDeck = findDeck(savedDeckId) ? savedDeckId : decks[0].id;
    loadDeck(resumeDeck, readPositions()[resumeDeck] || 0);

    bindEvents();
  }

  init();
})();
