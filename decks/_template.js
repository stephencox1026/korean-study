/* ==========================================================================
   Template for a new vocab set.

   1. Copy this file to decks/set-10-yourtheme.js
   2. Change `id` and `title`, then fill in the words
   3. Add <script src="decks/set-10-yourtheme.js"></script> to index.html
   4. Run `node tools/check-decks.mjs` to catch mistakes

   Conventions the other sets follow: 50 words per deck (set 9 markers is the
   exception at 28), grouped by sub-theme
   with `// --- Sub-theme ---` comment headers. `id` must be unique; it is what
   the app uses to remember your place in each deck.
   ========================================================================== */

window.KOREAN_DECKS = window.KOREAN_DECKS || [];

window.KOREAN_DECKS.push({
  id: 'set-36-yourtheme',
  title: 'Set 36 - Change Me',
  // Optional: set dayFilter: true and add dayCharacter on each word for
  // weekday Sino-character decks. See set-25-sino-days.js and ADDING-A-SET.md.
  words: [

    // --- Sub-theme name ---
    {
      korean: '사과',
      romanization: 'sagwa',
      english: 'apple',
      sentenceKorean: '저는 매일 사과를 먹어요.',
      sentenceEnglish: 'I eat an apple every day.',
      // The breakdown is the word-by-word gloss shown under the translation.
      // `ko` is the chunk, `p` is an optional particle that gets outlined on
      // the card, `en` is a one to three word meaning. Joining every ko + p
      // has to rebuild sentenceKorean exactly; the checker enforces it.
      breakdown: [
        { ko: '저', p: '는', en: 'I' },
        { ko: '매일', en: 'every day' },
        { ko: '사과', p: '를', en: 'apple' },
        { ko: '먹어요', en: 'eat' }  // verb — leave whole, do not split 어요
      ]
    },
    {
      korean: '빨간색',
      romanization: 'ppalgansaek',
      english: 'red (color)',
      sentenceKorean: '제가 좋아하는 색은 빨간색이에요.',
      sentenceEnglish: 'My favorite color is red.',
      breakdown: [
        { ko: '제', p: '가', en: 'I' },
        { ko: '좋아하', p: '는', en: 'that I like' },
        { ko: '색', p: '은', en: 'color' },
        { ko: '빨간색', p: '이에요', en: 'is red' }
      ]
    }
  ]
});
