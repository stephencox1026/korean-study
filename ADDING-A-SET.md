# Adding a new vocab set

Each set is one file in `decks/`. Adding a set takes three steps and no build
tools, plus a checker you can run to catch mistakes.

## The sets so far

| Order | File | Deck | Words |
| --- | --- | --- | --- |
| 1 | `decks/set-03-greetings.js` | Set 1 - Greetings and Essentials | 50 |
| 2 | `decks/set-09-markers.js` | Set 2 - Particles and Markers | 28 |
| 3 | `decks/set-10-verbs.js` | Set 3 - Verbs and Daily Actions | 50 |
| 4 | `decks/set-11-numbers.js` | Set 4 - Numbers and Counting | 50 |
| 5 | `decks/set-02-family.js` | Set 5 - Family and People | 50 |
| 6 | `decks/set-04-time.js` | Set 6 - Time and Days | 50 |
| 7 | `decks/set-25-sino-days.js` | Set 7 - Sino Words by Day | 50 |
| 8 | `decks/set-12-food.js` | Set 8 - Food and Drink | 50 |
| 9 | `decks/set-13-adjectives.js` | Set 9 - Adjectives and Descriptions | 50 |
| 10 | `decks/set-06-house.js` | Set 10 - Around the House | 50 |
| 11 | `decks/set-05-position.js` | Set 11 - Position and Location | 50 |
| 12 | `decks/set-14-places.js` | Set 12 - Places and Getting Around | 50 |
| 13 | `decks/set-15-colors.js` | Set 13 - Colors | 50 |
| 14 | `decks/set-16-shopping.js` | Set 14 - Shopping and Money | 50 |
| 15 | `decks/set-17-weather.js` | Set 15 - Weather and Seasons | 50 |
| 16 | `decks/set-18-clothing.js` | Set 16 - Clothing | 50 |
| 17 | `decks/set-01-body.js` | Set 17 - Body Parts | 50 |
| 18 | `decks/set-08-animals.js` | Set 18 - Animals | 50 |
| 19 | `decks/set-19-health.js` | Set 19 - Health and How You Feel | 50 |
| 20 | `decks/set-20-school.js` | Set 20 - School and Study | 50 |
| 21 | `decks/set-21-work.js` | Set 21 - Work and Office | 50 |
| 22 | `decks/set-22-hobbies.js` | Set 22 - Hobbies and Free Time | 50 |
| 23 | `decks/set-23-transport.js` | Set 23 - Transportation in Detail | 50 |
| 24 | `decks/set-24-kitchen.js` | Set 24 - Kitchen and Cooking | 50 |
| 25 | `decks/set-07-connectors.js` | Set 25 - Connectors and Adverbs | 50 |
| 26 | `decks/set-26-emotions.js` | Set 26 - Emotions and Feelings | 50 |
| 27 | `decks/set-27-nature.js` | Set 27 - Nature and Outdoors | 50 |
| 28 | `decks/set-28-technology.js` | Set 28 - Technology | 50 |
| 29 | `decks/set-29-professions.js` | Set 29 - Professions and Jobs | 50 |
| 30 | `decks/set-30-culture.js` | Set 30 - Korean Culture and Holidays | 50 |
| 31 | `decks/set-31-formal-speech.js` | Set 31 - Formal and Honorific Speech | 50 |
| 32 | `decks/set-32-counters.js` | Set 32 - Counter Words | 50 |
| 33 | `decks/set-33-produce.js` | Set 33 - Fruits and Vegetables | 50 |
| 34 | `decks/set-34-home-life.js` | Set 34 - Home Life and Chores | 50 |
| 35 | `decks/set-35-travel.js` | Set 35 - Travel and Hotels | 50 |

The app also builds an **All Words** deck from every registered set.

Set 2 (particles) is the exception to the 50-word convention: it covers every
core particle and marker, so its count is whatever the list needs to be complete.

Decks are ordered in `index.html` to follow a natural learning path — greetings
first, then grammar markers, then everyday vocabulary, with connectors last.
Sets 26–35 are supplementary topics (emotions, nature, culture, etc.).
File names keep their original numbers; only picker order and display titles change.

Set 7 (Sino Words by Day) is special: it shows a day-character filter (월/화/수/목/금/토/일)
below the deck picker. Each word has a `dayCharacter` field tagging which weekday
character it shares.

## 1. Copy the template

Copy `decks/_template.js` to a new file following the naming pattern, for
example `decks/set-36-yourtheme.js`.

## 2. Fill it in

Change `id` and `title` at the top, then add one object per word:

```js
{
  korean: '사과',
  romanization: 'sagwa',
  english: 'apple',
  sentenceKorean: '저는 매일 사과를 먹어요.',
  sentenceEnglish: 'I eat an apple every day.',
  breakdown: [
    { ko: '저', p: '는', en: 'I' },
    { ko: '매일', en: 'every day' },
    { ko: '사과', p: '를', en: 'apple' },
    { ko: '먹어요', en: 'eat' }
  ]
}
```

- `id` must be unique across all decks. It is what the app uses to remember
  which card you were on.
- `title` shows up in the deck picker. The app appends the word count, so
  `Set 9 - Food` displays as `Set 9 - Food (50)`.
- `breakdown` is the word-by-word gloss shown under the English translation.
  `ko` is the chunk, `p` is an optional trailing particle that gets outlined in
  the accent color on the card, and `en` is a one to three word meaning.

### Marker boxing (red outlines)

Put every **particle**, **modifier**, and **noun copula ending** in `p` so it
renders boxed. Leave **full verb conjugations** whole in `ko`.

| Box in `p` | Examples |
| --- | --- |
| Particles | 이/가, 은/는, 을/를, 에/에서, 로/으로, 의, 도, 만 |
| Modifier | 좋아하 + **는**, 작 + **은**, 길 + **ㄴ** |
| Noun copula | 빨간색 + **이에요**, 학생 + **이에요**, 사과 + **예요** |
| Leave whole | 먹어요, 갔어요, 재미있어요 (verb conjugations) |

```js
// Good — modifier and copula boxed
{ ko: '제', p: '가', en: 'I' },
{ ko: '좋아하', p: '는', en: 'that I like' },
{ ko: '색', p: '은', en: 'color' },
{ ko: '빨간색', p: '이에요', en: 'is red' }

// Bad — -는 hidden inside ko
{ ko: '좋아하는', en: 'favorite' }
```

Set 2 (Markers) is the exception: particles are taught as their own `ko` column.
- Group the words by sub-theme with `// --- Sub-theme ---` comment headers, and
  aim for 50 per deck. Set 2 (markers) is the one exception. If you add a deck
  with a different count, add its id and expected count to `EXPECTED_WORD_COUNTS`
  in `tools/check-decks.mjs`.
- When the word you are teaching is a connector or adverb, give it its own `ko`
  chunk in the breakdown. Do not attach it as `p` on another word, or it will
  render boxed like a particle.
- Watch the commas: one after each `}` except the last word in the list.
- If an English value contains an apostrophe, wrap that value in double quotes:
  `english: "doctor's office"`.

### Day-filter decks (optional)

For decks like Set 7 that group words by weekday Sino character, add
`dayFilter: true` on the deck object and `dayCharacter` on each word:

```js
window.KOREAN_DECKS.push({
  id: 'set-25-sino-days',
  title: 'Set 7 - Sino Words by Day',
  dayFilter: true,
  words: [
    {
      korean: '수영',
      dayCharacter: '수',
      romanization: 'suyoung',
      ...
    }
  ]
});
```

Add the deck id to `DAY_FILTER_DECKS` in `tools/check-decks.mjs`. The app shows
월/화/수/목/금/토/일 pills below the deck picker when this set is selected.

## 3. Register it in index.html

Add one line near the bottom of `index.html`, alongside the existing deck
scripts:

```html
<script src="decks/set-24-kitchen.js"></script>
<script src="decks/set-26-yourtheme.js"></script>
```

The order of these lines is the order decks appear in the picker. Reload the
page and the new set is there, folded into **All Words** too.

## 4. Check your work

```
node tools/check-decks.mjs
node tools/audit-breakdowns.mjs
node tools/audit-translations.mjs
```

`check-decks.mjs` loads every deck the same way the browser does and verifies word counts,
that all fields are present, romanization is plain ASCII, no Korean word repeats
inside a deck, cross-deck duplicates are intentional, and that each example
sentence actually uses the word it teaches.

The strictest rule is the breakdown one: joining every chunk's `ko` plus `p`,
ignoring spaces and punctuation, has to rebuild `sentenceKorean` exactly. That
makes a breakdown that skips or invents a word impossible to miss.

`audit-breakdowns.mjs` flags chunks where a marker should be split into `p`.
`audit-translations.mjs` exports all entries and heuristically flags awkward
English. To auto-fix marker splits: `node tools/fix-breakdowns.mjs`.

## Faster option

Hand the photo of your notebook page to the agent and say "add this as Set 36."
It will read the words, research the rest of the theme up to 50, write the
romanization, sentences, and breakdowns, create the deck file, and register it.

## Notes

- Files load with plain `<script>` tags rather than ES module `import`, because
  modules are blocked when a page is opened directly from disk. That is why each
  deck file pushes itself onto `window.KOREAN_DECKS`.
- Nothing else needs to change. `app.js` discovers whatever decks are
  registered.
- To remove a set from the picker without deleting it, comment out or delete its
  `<script>` line in `index.html`.
