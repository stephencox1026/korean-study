/**
 * Prototype puzzle — 16 Korean words across 4 categories.
 * Schema supports future daily puzzles: add entries to CONNECTIONS_PUZZLES array.
 */
window.CONNECTIONS_PUZZLES = window.CONNECTIONS_PUZZLES || [];

window.CONNECTIONS_PUZZLES.push({
  id: 'prototype-01',
  title: 'Korean Connections — Prototype 01',
  categories: [
    {
      name: 'Words with Multiple Meanings',
      words: [
        { korean: '배', romanization: 'bae', english: 'pear; stomach; ship' },
        { korean: '말', romanization: 'mal', english: 'horse; speech' },
        { korean: '밤', romanization: 'bam', english: 'night; chestnut' },
        { korean: '눈', romanization: 'nun', english: 'eye; snow' },
      ],
    },
    {
      name: 'Items Found in a Kitchen',
      words: [
        { korean: '칼', romanization: 'kal', english: 'knife' },
        { korean: '숟가락', romanization: 'sutgarak', english: 'spoon' },
        { korean: '냄비', romanization: 'naembi', english: 'pot' },
        { korean: '접시', romanization: 'jeopsi', english: 'plate' },
      ],
    },
    {
      name: 'Synonyms',
      words: [
        { korean: '크다', romanization: 'keuda', english: 'big' },
        { korean: '거대하다', romanization: 'geodaehada', english: 'huge' },
        { korean: '넓다', romanization: 'neolda', english: 'wide; spacious' },
        { korean: '커다랗다', romanization: 'keodareuda', english: 'large' },
      ],
    },
    {
      name: 'Orange Items',
      words: [
        { korean: '오렌지', romanization: 'orenji', english: 'orange' },
        { korean: '당근', romanization: 'danggeun', english: 'carrot' },
        { korean: '호박', romanization: 'hobak', english: 'pumpkin; squash' },
        { korean: '고구마', romanization: 'goguma', english: 'sweet potato' },
      ],
    },
  ],
});
