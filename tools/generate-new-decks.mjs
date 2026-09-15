import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const stripped = (text) => text.replace(/[\s.,?!~…'"()]/g, '');
const esc = (text) => text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function renderDeck({ id, title, comment, words }) {
  const lines = [
    '/* ==========================================================================',
    `   ${comment}`,
    '   50 words, ordered by sub-theme.',
    '   ========================================================================== */',
    '',
    'window.KOREAN_DECKS = window.KOREAN_DECKS || [];',
    '',
    'window.KOREAN_DECKS.push({',
    `  id: '${id}',`,
    `  title: '${title}',`,
    '  words: [',
    ''
  ];

  for (const word of words) {
    if (word.section) {
      lines.push(`    // --- ${word.section} ---`);
      continue;
    }
    lines.push('    {');
    lines.push(`      korean: '${esc(word.korean)}',`);
    lines.push(`      romanization: '${esc(word.romanization)}',`);
    lines.push(`      english: '${esc(word.english)}',`);
    lines.push(`      sentenceKorean: '${esc(word.sentenceKorean)}',`);
    lines.push(`      sentenceEnglish: '${esc(word.sentenceEnglish)}',`);
    lines.push('      breakdown: [');
    for (const chunk of word.breakdown) {
      const p = chunk.p ? `, p: '${esc(chunk.p)}'` : '';
      lines.push(`        { ko: '${esc(chunk.ko)}'${p}, en: '${esc(chunk.en)}' },`);
    }
    lines.push('      ]');
    lines.push('    },');
  }

  lines.push('  ]');
  lines.push('});');
  lines.push('');

  const content = lines.join('\n');
  for (const word of words.filter((w) => !w.section)) {
    const rebuilt = word.breakdown.map((c) => c.ko + (c.p || '')).join('');
    if (stripped(rebuilt) !== stripped(word.sentenceKorean)) {
      throw new Error(
        `${word.korean}: breakdown mismatch\n  sentence: ${stripped(word.sentenceKorean)}\n  rebuilt:  ${stripped(rebuilt)}`
      );
    }
  }
  return content;
}

const culture = [
  { section: 'Major holidays' },
  {
    korean: '설날',
    romanization: 'seollal',
    english: 'Lunar New Year',
    sentenceKorean: '설날에 가족과 떡국을 먹어요.',
    sentenceEnglish: 'We eat rice cake soup with family on Lunar New Year.',
    breakdown: [
      { ko: '설날', p: '에', en: 'on Lunar New Year' },
      { ko: '가족', p: '과', en: 'with family' },
      { ko: '떡국', p: '을', en: 'rice cake soup' },
      { ko: '먹어요', en: 'eat' }
    ]
  },
  {
    korean: '추석',
    romanization: 'chuseok',
    english: 'Korean harvest festival',
    sentenceKorean: '추석에 고향에 내려가요.',
    sentenceEnglish: 'I go to my hometown on Chuseok.',
    breakdown: [
      { ko: '추석', p: '에', en: 'on Chuseok' },
      { ko: '고향', p: '에', en: 'to hometown' },
      { ko: '내려가요', en: 'go down' }
    ]
  },
  {
    korean: '단오',
    romanization: 'dano',
    english: 'Dano spring festival',
    sentenceKorean: '단오에는 창포물에 머리를 감아요.',
    sentenceEnglish: 'On Dano, people wash their hair with iris water.',
    breakdown: [
      { ko: '단오', p: '에는', en: 'on Dano' },
      { ko: '창포물', p: '에', en: 'in iris water' },
      { ko: '머리', p: '를', en: 'hair' },
      { ko: '감아요', en: 'wash' }
    ]
  },
  {
    korean: '대보름',
    romanization: 'daeborum',
    english: 'Great Full Moon festival',
    sentenceKorean: '대보름에 부럼을 깨요.',
    sentenceEnglish: 'We crack nuts on the Great Full Moon day.',
    breakdown: [
      { ko: '대보름', p: '에', en: 'on Great Full Moon' },
      { ko: '부럼', p: '을', en: 'nuts' },
      { ko: '깨요', en: 'crack' }
    ]
  },
  {
    korean: '달맞이',
    romanization: 'dalmaji',
    english: 'moon greeting on Daeboreum',
    sentenceKorean: '대보름에 달맞이를 해요.',
    sentenceEnglish: 'We greet the moon on the Great Full Moon day.',
    breakdown: [
      { ko: '대보름', p: '에', en: 'on Great Full Moon' },
      { ko: '달맞이', p: '를', en: 'moon greeting' },
      { ko: '해요', en: 'do' }
    ]
  },
  {
    korean: '공휴일',
    romanization: 'gonghyuil',
    english: 'public holiday',
    sentenceKorean: '내일은 공휴일이에요.',
    sentenceEnglish: 'Tomorrow is a public holiday.',
    breakdown: [
      { ko: '내일', p: '은', en: 'tomorrow' },
      { ko: '공휴일이에요', en: 'is a public holiday' }
    ]
  },
  {
    korean: '광복절',
    romanization: 'gwangbokjeol',
    english: 'Liberation Day',
    sentenceKorean: '광복절에 태극기를 달아요.',
    sentenceEnglish: 'We hang the national flag on Liberation Day.',
    breakdown: [
      { ko: '광복절', p: '에', en: 'on Liberation Day' },
      { ko: '태극기', p: '를', en: 'national flag' },
      { ko: '달아요', en: 'hang' }
    ]
  },
  {
    korean: '개천절',
    romanization: 'gaecheonjeol',
    english: 'National Foundation Day',
    sentenceKorean: '개천절은 국경일이에요.',
    sentenceEnglish: 'National Foundation Day is a national holiday.',
    breakdown: [
      { ko: '개천절', p: '은', en: 'National Foundation Day' },
      { ko: '국경일이에요', en: 'is a national holiday' }
    ]
  },
  {
    korean: '삼일절',
    romanization: 'samiljeol',
    english: 'Independence Movement Day',
    sentenceKorean: '삼일절에 역사를 기억해요.',
    sentenceEnglish: 'We remember history on Independence Movement Day.',
    breakdown: [
      { ko: '삼일절', p: '에', en: 'on March First' },
      { ko: '역사', p: '를', en: 'history' },
      { ko: '기억해요', en: 'remember' }
    ]
  },
  {
    korean: '한글날',
    romanization: 'hangeulnal',
    english: 'Hangeul Day',
    sentenceKorean: '한글날에 글을 써요.',
    sentenceEnglish: 'We write on Hangeul Day.',
    breakdown: [
      { ko: '한글날', p: '에', en: 'on Hangeul Day' },
      { ko: '글', p: '을', en: 'writing' },
      { ko: '써요', en: 'write' }
    ]
  },
  {
    korean: '석가탄신일',
    romanization: 'seokgatansinil',
    english: "Buddha's Birthday",
    sentenceKorean: '석가탄신일에 연등을 봐요.',
    sentenceEnglish: 'We see lantern displays on Buddha\'s Birthday.',
    breakdown: [
      { ko: '석가탄신일', p: '에', en: "on Buddha's Birthday" },
      { ko: '연등', p: '을', en: 'lanterns' },
      { ko: '봐요', en: 'see' }
    ]
  },
  { section: 'Customs and rituals' },
  {
    korean: '세배',
    romanization: 'sebae',
    english: "New Year's bow",
    sentenceKorean: '설날 아침에 어른에게 세배를 해요.',
    sentenceEnglish: 'We bow to elders on Lunar New Year morning.',
    breakdown: [
      { ko: '설날', en: 'Lunar New Year' },
      { ko: '아침', p: '에', en: 'in morning' },
      { ko: '어른', p: '에게', en: 'to elders' },
      { ko: '세배', p: '를', en: 'bow' },
      { ko: '해요', en: 'do' }
    ]
  },
  {
    korean: '세뱃돈',
    romanization: 'sebaetdon',
    english: "New Year's money gift",
    sentenceKorean: '할머니가 세뱃돈을 주셨어요.',
    sentenceEnglish: 'Grandmother gave New Year\'s money.',
    breakdown: [
      { ko: '할머니', p: '가', en: 'grandmother' },
      { ko: '세뱃돈', p: '을', en: 'New Year money' },
      { ko: '주셨어요', en: 'gave' }
    ]
  },
  {
    korean: '복주머니',
    romanization: 'bokjumeoni',
    english: 'lucky money pouch',
    sentenceKorean: '아이가 복주머니를 받았어요.',
    sentenceEnglish: 'The child received a lucky pouch.',
    breakdown: [
      { ko: '아이', p: '가', en: 'child' },
      { ko: '복주머니', p: '를', en: 'lucky pouch' },
      { ko: '받았어요', en: 'received' }
    ]
  },
  {
    korean: '김장',
    romanization: 'gimjang',
    english: 'kimchi-making season',
    sentenceKorean: '겨울에 김장을 해요.',
    sentenceEnglish: 'We make kimchi in winter.',
    breakdown: [
      { ko: '겨울', p: '에', en: 'in winter' },
      { ko: '김장', p: '을', en: 'kimchi making' },
      { ko: '해요', en: 'do' }
    ]
  },
  {
    korean: '차례',
    romanization: 'charye',
    english: 'ancestral memorial rite',
    sentenceKorean: '추석에 차례를 지내요.',
    sentenceEnglish: 'We hold an ancestral rite on Chuseok.',
    breakdown: [
      { ko: '추석', p: '에', en: 'on Chuseok' },
      { ko: '차례', p: '를', en: 'ancestral rite' },
      { ko: '지내요', en: 'hold' }
    ]
  },
  {
    korean: '제사',
    romanization: 'jesa',
    english: 'memorial ceremony',
    sentenceKorean: '명절에 제사를 올려요.',
    sentenceEnglish: 'We offer a memorial ceremony on holidays.',
    breakdown: [
      { ko: '명절', p: '에', en: 'on holiday' },
      { ko: '제사', p: '를', en: 'memorial rite' },
      { ko: '올려요', en: 'offer' }
    ]
  },
  {
    korean: '조상',
    romanization: 'josang',
    english: 'ancestor',
    sentenceKorean: '조상을 기리는 마음이 중요해요.',
    sentenceEnglish: 'It is important to honor ancestors.',
    breakdown: [
      { ko: '조상', p: '을', en: 'ancestors' },
      { ko: '기리는', en: 'honoring' },
      { ko: '마음', p: '이', en: 'heart' },
      { ko: '중요해요', en: 'is important' }
    ]
  },
  {
    korean: '예절',
    romanization: 'yejeol',
    english: 'etiquette, manners',
    sentenceKorean: '한국에서는 예절이 중요해요.',
    sentenceEnglish: 'Etiquette is important in Korea.',
    breakdown: [
      { ko: '한국', p: '에서는', en: 'in Korea' },
      { ko: '예절', p: '이', en: 'etiquette' },
      { ko: '중요해요', en: 'is important' }
    ]
  },
  {
    korean: '풍습',
    romanization: 'pungsup',
    english: 'custom, tradition',
    sentenceKorean: '이 지역에는 오래된 풍습이 있어요.',
    sentenceEnglish: 'This region has old customs.',
    breakdown: [
      { ko: '이', en: 'this' },
      { ko: '지역', p: '에는', en: 'region' },
      { ko: '오래된', en: 'old' },
      { ko: '풍습', p: '이', en: 'custom' },
      { ko: '있어요', en: 'there is' }
    ]
  },
  {
    korean: '세시풍속',
    romanization: 'sesipungsup',
    english: 'seasonal folk customs',
    sentenceKorean: '세시풍속을 배우고 있어요.',
    sentenceEnglish: 'I am learning seasonal folk customs.',
    breakdown: [
      { ko: '세시풍속', p: '을', en: 'seasonal customs' },
      { ko: '배우고', en: 'learning' },
      { ko: '있어요', en: 'am' }
    ]
  },
  { section: 'Holiday foods and games' },
  {
    korean: '송편',
    romanization: 'songpyeon',
    english: 'half-moon rice cake',
    sentenceKorean: '추석에 송편을 빚어요.',
    sentenceEnglish: 'We shape songpyeon on Chuseok.',
    breakdown: [
      { ko: '추석', p: '에', en: 'on Chuseok' },
      { ko: '송편', p: '을', en: 'songpyeon' },
      { ko: '빚어요', en: 'shape' }
    ]
  },
  {
    korean: '떡국',
    romanization: 'tteokguk',
    english: 'rice cake soup',
    sentenceKorean: '설날 아침에 떡국을 먹어요.',
    sentenceEnglish: 'We eat rice cake soup on Lunar New Year morning.',
    breakdown: [
      { ko: '설날', en: 'Lunar New Year' },
      { ko: '아침', p: '에', en: 'morning' },
      { ko: '떡국', p: '을', en: 'rice cake soup' },
      { ko: '먹어요', en: 'eat' }
    ]
  },
  {
    korean: '전',
    romanization: 'jeon',
    english: 'savory pancake',
    sentenceKorean: '명절에 전을 부쳐요.',
    sentenceEnglish: 'We fry jeon on holidays.',
    breakdown: [
      { ko: '명절', p: '에', en: 'on holiday' },
      { ko: '전', p: '을', en: 'jeon' },
      { ko: '부쳐요', en: 'fry' }
    ]
  },
  {
    korean: '부침개',
    romanization: 'buchimgae',
    english: 'Korean pancake',
    sentenceKorean: '부침개가 바삭해요.',
    sentenceEnglish: 'The pancake is crispy.',
    breakdown: [
      { ko: '부침개', p: '가', en: 'pancake' },
      { ko: '바삭해요', en: 'is crispy' }
    ]
  },
  {
    korean: '창포물',
    romanization: 'changpomul',
    english: 'iris root water',
    sentenceKorean: '단오에 창포물로 머리를 감아요.',
    sentenceEnglish: 'We wash hair with iris water on Dano.',
    breakdown: [
      { ko: '단오', p: '에', en: 'on Dano' },
      { ko: '창포물', p: '로', en: 'with iris water' },
      { ko: '머리', p: '를', en: 'hair' },
      { ko: '감아요', en: 'wash' }
    ]
  },
  {
    korean: '윷놀이',
    romanization: 'yutnori',
    english: 'traditional board game',
    sentenceKorean: '설날에 가족이 윷놀이를 해요.',
    sentenceEnglish: 'The family plays yutnori on Lunar New Year.',
    breakdown: [
      { ko: '설날', p: '에', en: 'on Lunar New Year' },
      { ko: '가족', p: '이', en: 'family' },
      { ko: '윷놀이', p: '를', en: 'yutnori' },
      { ko: '해요', en: 'play' }
    ]
  },
  {
    korean: '연날리기',
    romanization: 'yeonnalligi',
    english: 'kite flying',
    sentenceKorean: '봄에 연날리기를 해요.',
    sentenceEnglish: 'We fly kites in spring.',
    breakdown: [
      { ko: '봄', p: '에', en: 'in spring' },
      { ko: '연날리기', p: '를', en: 'kite flying' },
      { ko: '해요', en: 'do' }
    ]
  },
  {
    korean: '부럼',
    romanization: 'bureom',
    english: 'nuts cracked on Daeboreum',
    sentenceKorean: '대보름에 부럼을 먹어요.',
    sentenceEnglish: 'We eat nuts on the Great Full Moon day.',
    breakdown: [
      { ko: '대보름', p: '에', en: 'on Great Full Moon' },
      { ko: '부럼', p: '을', en: 'nuts' },
      { ko: '먹어요', en: 'eat' }
    ]
  },
  {
    korean: '연등',
    romanization: 'yeondeung',
    english: 'lotus lantern',
    sentenceKorean: '연등 축제가 아름다워요.',
    sentenceEnglish: 'The lantern festival is beautiful.',
    breakdown: [
      { ko: '연등', en: 'lantern' },
      { ko: '축제', p: '가', en: 'festival' },
      { ko: '아름다워요', en: 'is beautiful' }
    ]
  },
  { section: 'Life celebrations' },
  {
    korean: '돌잔치',
    romanization: 'doljanchi',
    english: 'first birthday party',
    sentenceKorean: '아기 돌잔치에 갔어요.',
    sentenceEnglish: 'I went to the baby\'s first birthday party.',
    breakdown: [
      { ko: '아기', en: 'baby' },
      { ko: '돌잔치', p: '에', en: 'first birthday party' },
      { ko: '갔어요', en: 'went' }
    ]
  },
  {
    korean: '백일',
    romanization: 'baegil',
    english: '100th-day celebration',
    sentenceKorean: '아기 백일을 축하해요.',
    sentenceEnglish: 'We celebrate the baby\'s 100th day.',
    breakdown: [
      { ko: '아기', en: 'baby' },
      { ko: '백일', p: '을', en: '100th day' },
      { ko: '축하해요', en: 'celebrate' }
    ]
  },
  {
    korean: '환갑',
    romanization: 'hwangap',
    english: '60th birthday celebration',
    sentenceKorean: '할아버지 환갑을 축하했어요.',
    sentenceEnglish: 'We celebrated grandfather\'s 60th birthday.',
    breakdown: [
      { ko: '할아버지', en: 'grandfather' },
      { ko: '환갑', p: '을', en: '60th birthday' },
      { ko: '축하했어요', en: 'celebrated' }
    ]
  },
  {
    korean: '칠순',
    romanization: 'chilsun',
    english: '70th birthday',
    sentenceKorean: '할머니 칠순 잔치가 있어요.',
    sentenceEnglish: 'There is a party for grandmother\'s 70th birthday.',
    breakdown: [
      { ko: '할머니', en: 'grandmother' },
      { ko: '칠순', en: '70th birthday' },
      { ko: '잔치', p: '가', en: 'party' },
      { ko: '있어요', en: 'there is' }
    ]
  },
  {
    korean: '팔순',
    romanization: 'palsun',
    english: '80th birthday',
    sentenceKorean: '할아버지 팔순을 맞았어요.',
    sentenceEnglish: 'Grandfather reached his 80th birthday.',
    breakdown: [
      { ko: '할아버지', en: 'grandfather' },
      { ko: '팔순', p: '을', en: '80th birthday' },
      { ko: '맞았어요', en: 'reached' }
    ]
  },
  { section: 'Culture and heritage' },
  {
    korean: '전통',
    romanization: 'jeontong',
    english: 'tradition',
    sentenceKorean: '전통을 지키는 것이 중요해요.',
    sentenceEnglish: 'It is important to preserve tradition.',
    breakdown: [
      { ko: '전통', p: '을', en: 'tradition' },
      { ko: '지키는', en: 'preserving' },
      { ko: '것', p: '이', en: 'thing' },
      { ko: '중요해요', en: 'is important' }
    ]
  },
  {
    korean: '문화',
    romanization: 'munhwa',
    english: 'culture',
    sentenceKorean: '한국 문화를 배우고 있어요.',
    sentenceEnglish: 'I am learning Korean culture.',
    breakdown: [
      { ko: '한국', en: 'Korean' },
      { ko: '문화', p: '를', en: 'culture' },
      { ko: '배우고', en: 'learning' },
      { ko: '있어요', en: 'am' }
    ]
  },
  {
    korean: '축제',
    romanization: 'chukje',
    english: 'festival',
    sentenceKorean: '도시에서 축제가 열려요.',
    sentenceEnglish: 'A festival is held in the city.',
    breakdown: [
      { ko: '도시', p: '에서', en: 'in city' },
      { ko: '축제', p: '가', en: 'festival' },
      { ko: '열려요', en: 'is held' }
    ]
  },
  {
    korean: '한옥',
    romanization: 'hanok',
    english: 'traditional Korean house',
    sentenceKorean: '한옥 마을을 구경했어요.',
    sentenceEnglish: 'I toured a hanok village.',
    breakdown: [
      { ko: '한옥', en: 'hanok' },
      { ko: '마을', p: '을', en: 'village' },
      { ko: '구경했어요', en: 'toured' }
    ]
  },
  {
    korean: '한지',
    romanization: 'hanji',
    english: 'traditional Korean paper',
    sentenceKorean: '한지로 등을 만들어요.',
    sentenceEnglish: 'We make lanterns with traditional paper.',
    breakdown: [
      { ko: '한지', p: '로', en: 'with hanji' },
      { ko: '등', p: '을', en: 'lantern' },
      { ko: '만들어요', en: 'make' }
    ]
  },
  {
    korean: '기와',
    romanization: 'giwa',
    english: 'roof tile',
    sentenceKorean: '한옥 지붕에 기와가 있어요.',
    sentenceEnglish: 'There are roof tiles on the hanok roof.',
    breakdown: [
      { ko: '한옥', en: 'hanok' },
      { ko: '지붕', p: '에', en: 'on roof' },
      { ko: '기와', p: '가', en: 'roof tiles' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  {
    korean: '탈',
    romanization: 'tal',
    english: 'traditional mask',
    sentenceKorean: '탈을 쓰고 춤을 춰요.',
    sentenceEnglish: 'We dance wearing masks.',
    breakdown: [
      { ko: '탈', p: '을', en: 'mask' },
      { ko: '쓰고', en: 'wearing' },
      { ko: '춤', p: '을', en: 'dance' },
      { ko: '춰요', en: 'dance' }
    ]
  },
  {
    korean: '탈춤',
    romanization: 'talchum',
    english: 'mask dance',
    sentenceKorean: '탈춤 공연을 봤어요.',
    sentenceEnglish: 'I watched a mask dance performance.',
    breakdown: [
      { ko: '탈춤', en: 'mask dance' },
      { ko: '공연', p: '을', en: 'performance' },
      { ko: '봤어요', en: 'watched' }
    ]
  },
  {
    korean: '사물놀이',
    romanization: 'samullori',
    english: 'four-instrument folk music',
    sentenceKorean: '사물놀이 소리가 신나요.',
    sentenceEnglish: 'The samullori music is exciting.',
    breakdown: [
      { ko: '사물놀이', en: 'samullori' },
      { ko: '소리', p: '가', en: 'sound' },
      { ko: '신나요', en: 'is exciting' }
    ]
  },
  {
    korean: '판소리',
    romanization: 'pansori',
    english: 'traditional narrative singing',
    sentenceKorean: '판소리를 처음 들었어요.',
    sentenceEnglish: 'I heard pansori for the first time.',
    breakdown: [
      { ko: '판소리', p: '를', en: 'pansori' },
      { ko: '처음', en: 'first time' },
      { ko: '들었어요', en: 'heard' }
    ]
  },
  {
    korean: '돌하르방',
    romanization: 'dolharubang',
    english: 'Jeju stone grandfather statue',
    sentenceKorean: '제주도에 돌하르방이 많아요.',
    sentenceEnglish: 'There are many dolharubang on Jeju Island.',
    breakdown: [
      { ko: '제주도', p: '에', en: 'on Jeju Island' },
      { ko: '돌하르방', p: '이', en: 'dolharubang' },
      { ko: '많아요', en: 'there are many' }
    ]
  },
  {
    korean: '경복궁',
    romanization: 'gyeongbokgung',
    english: 'Gyeongbokgung Palace',
    sentenceKorean: '경복궁에서 사진을 찍었어요.',
    sentenceEnglish: 'I took photos at Gyeongbokgung Palace.',
    breakdown: [
      { ko: '경복궁', p: '에서', en: 'at Gyeongbokgung' },
      { ko: '사진', p: '을', en: 'photos' },
      { ko: '찍었어요', en: 'took' }
    ]
  },
  {
    korean: '태극기',
    romanization: 'taegeukgi',
    english: 'Korean national flag',
    sentenceKorean: '태극기가 바람에 펄럭여요.',
    sentenceEnglish: 'The national flag flutters in the wind.',
    breakdown: [
      { ko: '태극기', p: '가', en: 'national flag' },
      { ko: '바람', p: '에', en: 'in wind' },
      { ko: '펄럭여요', en: 'flutters' }
    ]
  },
  {
    korean: '국경일',
    romanization: 'gukgyeongil',
    english: 'national holiday',
    sentenceKorean: '오늘은 국경일이에요.',
    sentenceEnglish: 'Today is a national holiday.',
    breakdown: [
      { ko: '오늘', p: '은', en: 'today' },
      { ko: '국경일이에요', en: 'is a national holiday' }
    ]
  },
  {
    korean: '명절',
    romanization: 'myeongjeol',
    english: 'holiday, festival day',
    sentenceKorean: '명절에 고향에 가요.',
    sentenceEnglish: 'I go to my hometown on holidays.',
    breakdown: [
      { ko: '명절', p: '에', en: 'on holiday' },
      { ko: '고향', p: '에', en: 'to hometown' },
      { ko: '가요', en: 'go' }
    ]
  }
];

const formal = [
  { section: 'Honorific verbs' },
  {
    korean: '드렸어요',
    romanization: 'deuryeosseoyo',
    english: 'gave (humble)',
    sentenceKorean: '선생님께 선물을 드렸어요.',
    sentenceEnglish: 'I gave a gift to the teacher.',
    breakdown: [
      { ko: '선생님', p: '께', en: 'to teacher' },
      { ko: '선물', p: '을', en: 'gift' },
      { ko: '드렸어요', en: 'gave' }
    ]
  },
  {
    korean: '뵙겠습니다',
    romanization: 'boepgetseumnida',
    english: 'will meet (humble formal)',
    sentenceKorean: '내일 선생님을 뵙겠습니다.',
    sentenceEnglish: 'I will meet the teacher tomorrow.',
    breakdown: [
      { ko: '내일', en: 'tomorrow' },
      { ko: '선생님', p: '을', en: 'teacher' },
      { ko: '뵙겠습니다', en: 'will meet' }
    ]
  },
  {
    korean: '여쭙겠습니다',
    romanization: 'yeojjupgetseumnida',
    english: 'I will ask (humble formal)',
    sentenceKorean: '두 가지 여쭙겠습니다.',
    sentenceEnglish: 'I will ask two things.',
    breakdown: [
      { ko: '두', en: 'two' },
      { ko: '가지', en: 'things' },
      { ko: '여쭙겠습니다', en: 'will ask' }
    ]
  },
  {
    korean: '말씀드렸어요',
    romanization: 'malsseumdeuryeosseoyo',
    english: 'told (humble)',
    sentenceKorean: '회의 시간을 말씀드렸어요.',
    sentenceEnglish: 'I told them the meeting time.',
    breakdown: [
      { ko: '회의', en: 'meeting' },
      { ko: '시간', p: '을', en: 'time' },
      { ko: '말씀드렸어요', en: 'told' }
    ]
  },
  {
    korean: '모셨어요',
    romanization: 'mosyeosseoyo',
    english: 'took, served (humble)',
    sentenceKorean: '할머니를 병원에 모셨어요.',
    sentenceEnglish: 'I took grandmother to the hospital.',
    breakdown: [
      { ko: '할머니', p: '를', en: 'grandmother' },
      { ko: '병원', p: '에', en: 'to hospital' },
      { ko: '모셨어요', en: 'took' }
    ]
  },
  {
    korean: '계세요',
    romanization: 'gyeseyo',
    english: 'is, stays (honorific)',
    sentenceKorean: '선생님이 교실에 계세요.',
    sentenceEnglish: 'The teacher is in the classroom.',
    breakdown: [
      { ko: '선생님', p: '이', en: 'teacher' },
      { ko: '교실', p: '에', en: 'in classroom' },
      { ko: '계세요', en: 'is' }
    ]
  },
  {
    korean: '드세요',
    romanization: 'deuseyo',
    english: 'please eat (honorific)',
    sentenceKorean: '할아버지, 식사 드세요.',
    sentenceEnglish: 'Grandfather, please eat your meal.',
    breakdown: [
      { ko: '할아버지', en: 'grandfather' },
      { ko: '식사', en: 'meal' },
      { ko: '드세요', en: 'please eat' }
    ]
  },
  {
    korean: '주셨어요',
    romanization: 'jusyeosseoyo',
    english: 'gave (honorific)',
    sentenceKorean: '사장님이 책을 주셨어요.',
    sentenceEnglish: 'The president gave me a book.',
    breakdown: [
      { ko: '사장님', p: '이', en: 'president' },
      { ko: '책', p: '을', en: 'book' },
      { ko: '주셨어요', en: 'gave' }
    ]
  },
  {
    korean: '가셨어요',
    romanization: 'gasyeosseoyo',
    english: 'went (honorific)',
    sentenceKorean: '어머니가 시장에 가셨어요.',
    sentenceEnglish: 'Mother went to the market.',
    breakdown: [
      { ko: '어머니', p: '가', en: 'mother' },
      { ko: '시장', p: '에', en: 'to market' },
      { ko: '가셨어요', en: 'went' }
    ]
  },
  {
    korean: '오셨어요',
    romanization: 'osyeosseoyo',
    english: 'came (honorific)',
    sentenceKorean: '손님이 방금 오셨어요.',
    sentenceEnglish: 'The guest just came.',
    breakdown: [
      { ko: '손님', p: '이', en: 'guest' },
      { ko: '방금', en: 'just now' },
      { ko: '오셨어요', en: 'came' }
    ]
  },
  {
    korean: '이십니다',
    romanization: 'isimnida',
    english: 'is (honorific copula)',
    sentenceKorean: '선생님이 한국 사람이십니다.',
    sentenceEnglish: 'The teacher is Korean.',
    breakdown: [
      { ko: '선생님', p: '이', en: 'teacher' },
      { ko: '한국', en: 'Korean' },
      { ko: '사람이십니다', en: 'person is' }
    ]
  },
  {
    korean: '하셨어요',
    romanization: 'hasyeosseoyo',
    english: 'did (honorific)',
    sentenceKorean: '선생님이 숙제를 하셨어요.',
    sentenceEnglish: 'The teacher did the homework.',
    breakdown: [
      { ko: '선생님', p: '이', en: 'teacher' },
      { ko: '숙제', p: '를', en: 'homework' },
      { ko: '하셨어요', en: 'did' }
    ]
  },
  {
    korean: '주무십니다',
    romanization: 'jumusimnida',
    english: 'sleeps (honorific formal)',
    sentenceKorean: '할아버지가 벌써 주무십니다.',
    sentenceEnglish: 'Grandfather is already sleeping.',
    breakdown: [
      { ko: '할아버지', p: '가', en: 'grandfather' },
      { ko: '벌써', en: 'already' },
      { ko: '주무십니다', en: 'is sleeping' }
    ]
  },
  {
    korean: '말씀하십니다',
    romanization: 'malsseumhasimnida',
    english: 'speaks (honorific formal)',
    sentenceKorean: '교수님이 강의를 말씀하십니다.',
    sentenceEnglish: 'The professor gives the lecture.',
    breakdown: [
      { ko: '교수님', p: '이', en: 'professor' },
      { ko: '강의', p: '를', en: 'lecture' },
      { ko: '말씀하십니다', en: 'speaks' }
    ]
  },
  {
    korean: '편찮으십니다',
    romanization: 'pyeonchaneusimnida',
    english: 'is unwell (honorific formal)',
    sentenceKorean: '할머니가 조금 편찮으십니다.',
    sentenceEnglish: 'Grandmother is a little unwell.',
    breakdown: [
      { ko: '할머니', p: '가', en: 'grandmother' },
      { ko: '조금', en: 'a little' },
      { ko: '편찮으십니다', en: 'is unwell' }
    ]
  },
  { section: 'Formal endings' },
  {
    korean: '드립니다',
    romanization: 'deurimnida',
    english: 'give (humble formal)',
    sentenceKorean: '이 자료를 드립니다.',
    sentenceEnglish: 'I give you this material.',
    breakdown: [
      { ko: '이', en: 'this' },
      { ko: '자료', p: '를', en: 'material' },
      { ko: '드립니다', en: 'give' }
    ]
  },
  {
    korean: '찾아뵙겠습니다',
    romanization: 'chajaboepgetseumnida',
    english: 'will visit (humble formal)',
    sentenceKorean: '다음에 찾아뵙겠습니다.',
    sentenceEnglish: 'I will come visit you next time.',
    breakdown: [
      { ko: '다음', p: '에', en: 'next time' },
      { ko: '찾아뵙겠습니다', en: 'will visit' }
    ]
  },
  {
    korean: '말씀드립니다',
    romanization: 'malsseumdeurimnida',
    english: 'tell (humble formal)',
    sentenceKorean: '회의가 취소되었습니다, 말씀드립니다.',
    sentenceEnglish: 'I am telling you the meeting was canceled.',
    breakdown: [
      { ko: '회의', p: '가', en: 'meeting' },
      { ko: '취소되었습니다', en: 'was canceled' },
      { ko: '말씀드립니다', en: 'I tell you' }
    ]
  },
  {
    korean: '계십니다',
    romanization: 'gyesimnida',
    english: 'is, stays (honorific formal)',
    sentenceKorean: '사장님이 회의실에 계십니다.',
    sentenceEnglish: 'The president is in the meeting room.',
    breakdown: [
      { ko: '사장님', p: '이', en: 'president' },
      { ko: '회의실', p: '에', en: 'in meeting room' },
      { ko: '계십니다', en: 'is' }
    ]
  },
  {
    korean: '주십니다',
    romanization: 'jusimnida',
    english: 'gives (honorific formal)',
    sentenceKorean: '선생님이 조언을 주십니다.',
    sentenceEnglish: 'The teacher gives advice.',
    breakdown: [
      { ko: '선생님', p: '이', en: 'teacher' },
      { ko: '조언', p: '을', en: 'advice' },
      { ko: '주십니다', en: 'gives' }
    ]
  },
  {
    korean: '가십니다',
    romanization: 'gasimnida',
    english: 'goes (honorific formal)',
    sentenceKorean: '어머니가 집에 가십니다.',
    sentenceEnglish: 'Mother goes home.',
    breakdown: [
      { ko: '어머니', p: '가', en: 'mother' },
      { ko: '집', p: '에', en: 'home' },
      { ko: '가십니다', en: 'goes' }
    ]
  },
  {
    korean: '오십니다',
    romanization: 'osimnida',
    english: 'comes (honorific formal)',
    sentenceKorean: '손님이 문 앞에 오십니다.',
    sentenceEnglish: 'The guest comes to the door.',
    breakdown: [
      { ko: '손님', p: '이', en: 'guest' },
      { ko: '문', en: 'door' },
      { ko: '앞', p: '에', en: 'in front' },
      { ko: '오십니다', en: 'comes' }
    ]
  },
  {
    korean: '하십니다',
    romanization: 'hasimnida',
    english: 'does (honorific formal)',
    sentenceKorean: '아버지가 매일 운동을 하십니다.',
    sentenceEnglish: 'Father exercises every day.',
    breakdown: [
      { ko: '아버지', p: '가', en: 'father' },
      { ko: '매일', en: 'every day' },
      { ko: '운동', p: '을', en: 'exercise' },
      { ko: '하십니다', en: 'does' }
    ]
  },
  { section: 'Honorific particles and nouns' },
  {
    korean: '께서',
    romanization: 'kkeseo',
    english: 'honorific subject marker',
    sentenceKorean: '할아버지께서 이야기하십니다.',
    sentenceEnglish: 'Grandfather speaks.',
    breakdown: [
      { ko: '할아버지', en: 'grandfather' },
      { ko: '께서', en: 'honorific subject' },
      { ko: '이야기하십니다', en: 'speaks' }
    ]
  },
  {
    korean: '댁',
    romanization: 'daek',
    english: 'home (honorific)',
    sentenceKorean: '선생님 댁이 어디입니까?',
    sentenceEnglish: 'Where is the teacher\'s home?',
    breakdown: [
      { ko: '선생님', en: 'teacher' },
      { ko: '댁', p: '이', en: 'home' },
      { ko: '어디입니까', en: 'where is' }
    ]
  },
  {
    korean: '진지',
    romanization: 'jinji',
    english: 'meal (honorific)',
    sentenceKorean: '진지 드셨습니까?',
    sentenceEnglish: 'Have you eaten your meal?',
    breakdown: [
      { ko: '진지', en: 'meal' },
      { ko: '드셨습니까', en: 'have you eaten' }
    ]
  },
  {
    korean: '연세',
    romanization: 'yeonse',
    english: 'age (honorific)',
    sentenceKorean: '할머니 연세가 어떻게 되십니까?',
    sentenceEnglish: 'May I ask grandmother\'s age?',
    breakdown: [
      { ko: '할머니', en: 'grandmother' },
      { ko: '연세', p: '가', en: 'age' },
      { ko: '어떻게', en: 'how' },
      { ko: '되십니까', en: 'is it' }
    ]
  },
  {
    korean: '성함',
    romanization: 'seongham',
    english: 'name (honorific)',
    sentenceKorean: '성함이 어떻게 되십니까?',
    sentenceEnglish: 'What is your name?',
    breakdown: [
      { ko: '성함', p: '이', en: 'name' },
      { ko: '어떻게', en: 'how' },
      { ko: '되십니까', en: 'is it' }
    ]
  },
  { section: 'Polite requests and commands' },
  {
    korean: '주시겠어요',
    romanization: 'jusigesseoyo',
    english: 'would you please give',
    sentenceKorean: '물을 좀 주시겠어요?',
    sentenceEnglish: 'Would you please give me some water?',
    breakdown: [
      { ko: '물', p: '을', en: 'water' },
      { ko: '좀', en: 'some' },
      { ko: '주시겠어요', en: 'would you give' }
    ]
  },
  {
    korean: '앉아 주십시오',
    romanization: 'anja jusipsio',
    english: 'please sit down',
    sentenceKorean: '여기에 앉아 주십시오.',
    sentenceEnglish: 'Please sit here.',
    breakdown: [
      { ko: '여기', p: '에', en: 'here' },
      { ko: '앉아', en: 'sit' },
      { ko: '주십시오', en: 'please' }
    ]
  },
  {
    korean: '들어가십시오',
    romanization: 'deureogasipsio',
    english: 'please enter',
    sentenceKorean: '안으로 들어가십시오.',
    sentenceEnglish: 'Please come inside.',
    breakdown: [
      { ko: '안', p: '으로', en: 'inside' },
      { ko: '들어가십시오', en: 'please enter' }
    ]
  },
  {
    korean: '잠시만 기다려 주십시오',
    romanization: 'jamsiman gidaryeo jusipsio',
    english: 'please wait a moment',
    sentenceKorean: '잠깐만요, 잠시만 기다려 주십시오.',
    sentenceEnglish: 'Just a moment, please wait.',
    breakdown: [
      { ko: '잠깐만요', en: 'just a moment' },
      { ko: '잠시만', en: 'just a moment' },
      { ko: '기다려', en: 'wait' },
      { ko: '주십시오', en: 'please' }
    ]
  },
  {
    korean: '말씀해 주시겠어요',
    romanization: 'malsseumhae jusigesseoyo',
    english: 'would you please tell me',
    sentenceKorean: '다시 한번 말씀해 주시겠어요?',
    sentenceEnglish: 'Would you please tell me once more?',
    breakdown: [
      { ko: '다시', en: 'again' },
      { ko: '한번', en: 'once' },
      { ko: '말씀해', en: 'tell' },
      { ko: '주시겠어요', en: 'would you please' }
    ]
  },
  {
    korean: '편히 쉬세요',
    romanization: 'pyeonhi swiseyo',
    english: 'please rest comfortably',
    sentenceKorean: '집에 가서 편히 쉬세요.',
    sentenceEnglish: 'Go home and rest comfortably.',
    breakdown: [
      { ko: '집', p: '에', en: 'home' },
      { ko: '가서', en: 'go and' },
      { ko: '편히', en: 'comfortably' },
      { ko: '쉬세요', en: 'please rest' }
    ]
  },
  {
    korean: '안녕히 주무십시오',
    romanization: 'annyeonghi jumusipsio',
    english: 'sleep well (formal)',
    sentenceKorean: '오늘도 안녕히 주무십시오.',
    sentenceEnglish: 'Sleep well tonight as well.',
    breakdown: [
      { ko: '오늘', p: '도', en: 'today also' },
      { ko: '안녕히', en: 'well' },
      { ko: '주무십시오', en: 'please sleep' }
    ]
  },
  {
    korean: '여쭤봐도 될까요',
    romanization: 'yeojjwobwado doelkkayo',
    english: 'may I ask',
    sentenceKorean: '실례지만 여쭤봐도 될까요?',
    sentenceEnglish: 'Excuse me, may I ask something?',
    breakdown: [
      { ko: '실례지만', en: 'excuse me' },
      { ko: '여쭤봐도', en: 'ask' },
      { ko: '될까요', en: 'may I' }
    ]
  },
  {
    korean: '도와드리겠습니다',
    romanization: 'dowadeurigetseumnida',
    english: 'I will help you',
    sentenceKorean: '제가 도와드리겠습니다.',
    sentenceEnglish: 'I will help you.',
    breakdown: [
      { ko: '제', p: '가', en: 'I' },
      { ko: '도와드리겠습니다', en: 'will help' }
    ]
  },
  {
    korean: '모시고 가겠습니다',
    romanization: 'mosigo gagetseumnida',
    english: 'I will take you',
    sentenceKorean: '역까지 모시고 가겠습니다.',
    sentenceEnglish: 'I will take you to the station.',
    breakdown: [
      { ko: '역', p: '까지', en: 'to station' },
      { ko: '모시고', en: 'taking' },
      { ko: '가겠습니다', en: 'will go' }
    ]
  },
  {
    korean: '말씀하신 대로',
    romanization: 'malsseumhasin daero',
    english: 'as you said',
    sentenceKorean: '말씀하신 대로 준비했습니다.',
    sentenceEnglish: 'I prepared as you said.',
    breakdown: [
      { ko: '말씀하신', en: 'you said' },
      { ko: '대로', en: 'as' },
      { ko: '준비했습니다', en: 'prepared' }
    ]
  },
  {
    korean: '드십니다',
    romanization: 'deusimnida',
    english: 'eats (honorific, uses -si-)',
    sentenceKorean: '어머니가 밥을 드십니다.',
    sentenceEnglish: 'Mother eats a meal.',
    breakdown: [
      { ko: '어머니', p: '가', en: 'mother' },
      { ko: '밥', p: '을', en: 'meal' },
      { ko: '드십니다', en: 'eats' }
    ]
  },
  {
    korean: '십시오',
    romanization: 'sipsio',
    english: 'please do (formal command)',
    sentenceKorean: '이쪽으로 오십시오.',
    sentenceEnglish: 'Please come this way.',
    breakdown: [
      { ko: '이쪽', p: '으로', en: 'this way' },
      { ko: '오십시오', en: 'please come' }
    ]
  },
  {
    korean: '드시겠습니까',
    romanization: 'deusigetseumnikka',
    english: 'would you like to eat',
    sentenceKorean: '커피를 드시겠습니까?',
    sentenceEnglish: 'Would you like some coffee?',
    breakdown: [
      { ko: '커피', p: '를', en: 'coffee' },
      { ko: '드시겠습니까', en: 'would you like' }
    ]
  },
  {
    korean: '계셨습니까',
    romanization: 'gyesyeotseumnikka',
    english: 'were you (honorific past)',
    sentenceKorean: '어제 회의실에 계셨습니까?',
    sentenceEnglish: 'Were you in the meeting room yesterday?',
    breakdown: [
      { ko: '어제', en: 'yesterday' },
      { ko: '회의실', p: '에', en: 'in meeting room' },
      { ko: '계셨습니까', en: 'were you' }
    ]
  },
  {
    korean: '수고하셨습니다',
    romanization: 'sugohasyeotseumnida',
    english: 'thank you for your work',
    sentenceKorean: '오늘도 수고하셨습니다.',
    sentenceEnglish: 'Thank you for your work today.',
    breakdown: [
      { ko: '오늘', p: '도', en: 'today also' },
      { ko: '수고하셨습니다', en: 'thank you for working' }
    ]
  },
  {
    korean: '감사드립니다',
    romanization: 'gamsadeurimnida',
    english: 'thank you (humble formal)',
    sentenceKorean: '도움에 감사드립니다.',
    sentenceEnglish: 'Thank you for your help.',
    breakdown: [
      { ko: '도움', p: '에', en: 'for help' },
      { ko: '감사드립니다', en: 'thank you' }
    ]
  },
  {
    korean: '죄송합니다만',
    romanization: 'joesonghamnidaman',
    english: 'I am sorry, but',
    sentenceKorean: '죄송합니다만, 지금은 어렵습니다.',
    sentenceEnglish: 'I am sorry, but it is difficult now.',
    breakdown: [
      { ko: '죄송합니다만', en: 'I am sorry but' },
      { ko: '지금', p: '은', en: 'now' },
      { ko: '어렵습니다', en: 'is difficult' }
    ]
  },
  {
    korean: '실례가 됩니다',
    romanization: 'sillyega doemnida',
    english: 'excuse me (formal)',
    sentenceKorean: '실례가 됩니다, 잠시 여쭤보겠습니다.',
    sentenceEnglish: 'Excuse me, I will ask briefly.',
    breakdown: [
      { ko: '실례가', en: 'excuse me' },
      { ko: '됩니다', en: 'it is' },
      { ko: '잠시', en: 'briefly' },
      { ko: '여쭤보겠습니다', en: 'will ask' }
    ]
  },
  {
    korean: '올렸습니다',
    romanization: 'ollyeotseumnida',
    english: 'submitted (humble formal)',
    sentenceKorean: '회의 자료를 올렸습니다.',
    sentenceEnglish: 'I submitted the meeting materials.',
    breakdown: [
      { ko: '회의', en: 'meeting' },
      { ko: '자료', p: '를', en: 'materials' },
      { ko: '올렸습니다', en: 'submitted' }
    ]
  },
  {
    korean: '잡수세요',
    romanization: 'japsuseyo',
    english: 'please eat (honorific formal)',
    sentenceKorean: '할아버지, 식사 잡수세요.',
    sentenceEnglish: 'Grandfather, please have your meal.',
    breakdown: [
      { ko: '할아버지', en: 'grandfather' },
      { ko: '식사', en: 'meal' },
      { ko: '잡수세요', en: 'please eat' }
    ]
  },
  {
    korean: '연락드리겠습니다',
    romanization: 'yeollakdeurigetseumnida',
    english: 'I will contact you (humble formal)',
    sentenceKorean: '결과가 나오면 연락드리겠습니다.',
    sentenceEnglish: 'I will contact you when the results come out.',
    breakdown: [
      { ko: '결과', p: '가', en: 'results' },
      { ko: '나오면', en: 'when they come out' },
      { ko: '연락드리겠습니다', en: 'will contact' }
    ]
  }
];

const counters = [
  { section: 'Everyday counters' },
  {
    korean: '장',
    romanization: 'jang',
    english: 'counter for sheets, tickets',
    sentenceKorean: '종이 세 장을 잘랐어요.',
    sentenceEnglish: 'I cut three sheets of paper.',
    breakdown: [
      { ko: '종이', en: 'paper' },
      { ko: '세', en: 'three' },
      { ko: '장', p: '을', en: 'sheets' },
      { ko: '잘랐어요', en: 'cut' }
    ]
  },
  {
    korean: '병',
    romanization: 'byeong',
    english: 'counter for bottles',
    sentenceKorean: '물 두 병을 샀어요.',
    sentenceEnglish: 'I bought two bottles of water.',
    breakdown: [
      { ko: '물', en: 'water' },
      { ko: '두', en: 'two' },
      { ko: '병', p: '을', en: 'bottles' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '잔',
    romanization: 'jan',
    english: 'counter for cups, glasses',
    sentenceKorean: '커피 한 잔 주세요.',
    sentenceEnglish: 'Please give me one cup of coffee.',
    breakdown: [
      { ko: '커피', en: 'coffee' },
      { ko: '한', en: 'one' },
      { ko: '잔', en: 'cup' },
      { ko: '주세요', en: 'please give' }
    ]
  },
  {
    korean: '켤레',
    romanization: 'kyeolle',
    english: 'counter for pairs of shoes',
    sentenceKorean: '신발 한 켤레를 샀어요.',
    sentenceEnglish: 'I bought one pair of shoes.',
    breakdown: [
      { ko: '신발', en: 'shoes' },
      { ko: '한', en: 'one' },
      { ko: '켤레', p: '를', en: 'pair' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '세 대',
    romanization: 'se dae',
    english: 'three machines or vehicles',
    sentenceKorean: '컴퓨터가 세 대 있어요.',
    sentenceEnglish: 'There are three computers.',
    breakdown: [
      { ko: '컴퓨터', p: '가', en: 'computer' },
      { ko: '세 대', en: 'three units' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  {
    korean: '두 벌',
    romanization: 'du beol',
    english: 'two outfits',
    sentenceKorean: '옷 두 벌을 입었어요.',
    sentenceEnglish: 'I wore two outfits.',
    breakdown: [
      { ko: '옷', en: 'clothes' },
      { ko: '두 벌', p: '을', en: 'two outfits' },
      { ko: '입었어요', en: 'wore' }
    ]
  },
  {
    korean: '그루',
    romanization: 'geuru',
    english: 'counter for trees',
    sentenceKorean: '나무 다섯 그루를 심었어요.',
    sentenceEnglish: 'We planted five trees.',
    breakdown: [
      { ko: '나무', en: 'tree' },
      { ko: '다섯', en: 'five' },
      { ko: '그루', p: '를', en: 'trees' },
      { ko: '심었어요', en: 'planted' }
    ]
  },
  {
    korean: '채',
    romanization: 'chae',
    english: 'counter for houses, buildings',
    sentenceKorean: '집 한 채를 지었어요.',
    sentenceEnglish: 'We built one house.',
    breakdown: [
      { ko: '집', en: 'house' },
      { ko: '한', en: 'one' },
      { ko: '채', p: '를', en: 'building' },
      { ko: '지었어요', en: 'built' }
    ]
  },
  {
    korean: '송이',
    romanization: 'songi',
    english: 'counter for bunches',
    sentenceKorean: '포도 한 송이를 먹었어요.',
    sentenceEnglish: 'I ate one bunch of grapes.',
    breakdown: [
      { ko: '포도', en: 'grape' },
      { ko: '한', en: 'one' },
      { ko: '송이', p: '를', en: 'bunch' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '자루',
    romanization: 'jaru',
    english: 'counter for long handled items',
    sentenceKorean: '우산 두 자루가 있어요.',
    sentenceEnglish: 'There are two umbrellas.',
    breakdown: [
      { ko: '우산', en: 'umbrella' },
      { ko: '두', en: 'two' },
      { ko: '자루', p: '가', en: 'items' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  { section: 'Containers and bundles' },
  {
    korean: '봉지',
    romanization: 'bongji',
    english: 'counter for bags',
    sentenceKorean: '과자 한 봉지를 샀어요.',
    sentenceEnglish: 'I bought one bag of snacks.',
    breakdown: [
      { ko: '과자', en: 'snack' },
      { ko: '한', en: 'one' },
      { ko: '봉지', p: '를', en: 'bag' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '상자',
    romanization: 'sangja',
    english: 'counter for boxes',
    sentenceKorean: '사과 한 상자를 받았어요.',
    sentenceEnglish: 'I received one box of apples.',
    breakdown: [
      { ko: '사과', en: 'apple' },
      { ko: '한', en: 'one' },
      { ko: '상자', p: '를', en: 'box' },
      { ko: '받았어요', en: 'received' }
    ]
  },
  {
    korean: '통',
    romanization: 'tong',
    english: 'counter for cans, jars',
    sentenceKorean: '쿠키 두 통을 먹었어요.',
    sentenceEnglish: 'I ate two jars of cookies.',
    breakdown: [
      { ko: '쿠키', en: 'cookie' },
      { ko: '두', en: 'two' },
      { ko: '통', p: '을', en: 'jars' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '포',
    romanization: 'po',
    english: 'counter for bundles of ten',
    sentenceKorean: '계란 한 포를 샀어요.',
    sentenceEnglish: 'I bought one bundle of eggs.',
    breakdown: [
      { ko: '계란', en: 'egg' },
      { ko: '한', en: 'one' },
      { ko: '포', p: '를', en: 'bundle' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '묶음',
    romanization: 'mukkeum',
    english: 'counter for bundles',
    sentenceKorean: '파 한 묶음을 샀어요.',
    sentenceEnglish: 'I bought one bundle of green onions.',
    breakdown: [
      { ko: '파', en: 'green onion' },
      { ko: '한', en: 'one' },
      { ko: '묶음', p: '을', en: 'bundle' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '다발',
    romanization: 'dabal',
    english: 'counter for bouquets',
    sentenceKorean: '꽃 한 다발을 선물했어요.',
    sentenceEnglish: 'I gave a bouquet of flowers as a gift.',
    breakdown: [
      { ko: '꽃', en: 'flower' },
      { ko: '한', en: 'one' },
      { ko: '다발', p: '을', en: 'bouquet' },
      { ko: '선물했어요', en: 'gave' }
    ]
  },
  {
    korean: '봉',
    romanization: 'bong',
    english: 'counter for skeins, coils',
    sentenceKorean: '실 한 봉을 샀어요.',
    sentenceEnglish: 'I bought one skein of thread.',
    breakdown: [
      { ko: '실', en: 'thread' },
      { ko: '한', en: 'one' },
      { ko: '봉', p: '을', en: 'skein' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '다스',
    romanization: 'daseu',
    english: 'counter for dozen',
    sentenceKorean: '연필 한 다스를 샀어요.',
    sentenceEnglish: 'I bought one dozen pencils.',
    breakdown: [
      { ko: '연필', en: 'pencil' },
      { ko: '한', en: 'one' },
      { ko: '다스', p: '를', en: 'dozen' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  { section: 'Pieces and portions' },
  {
    korean: '조각',
    romanization: 'jogak',
    english: 'counter for pieces',
    sentenceKorean: '케이크 네 조각을 먹었어요.',
    sentenceEnglish: 'I ate four pieces of cake.',
    breakdown: [
      { ko: '케이크', en: 'cake' },
      { ko: '네', en: 'four' },
      { ko: '조각', p: '을', en: 'pieces' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '판',
    romanization: 'pan',
    english: 'counter for boards, trays',
    sentenceKorean: '계란 한 판을 샀어요.',
    sentenceEnglish: 'I bought one tray of eggs.',
    breakdown: [
      { ko: '계란', en: 'egg' },
      { ko: '한', en: 'one' },
      { ko: '판', p: '을', en: 'tray' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '줄',
    romanization: 'jul',
    english: 'counter for rows, lines',
    sentenceKorean: '의자 세 줄이 있어요.',
    sentenceEnglish: 'There are three rows of chairs.',
    breakdown: [
      { ko: '의자', en: 'chair' },
      { ko: '세', en: 'three' },
      { ko: '줄', p: '이', en: 'rows' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  {
    korean: '알',
    romanization: 'al',
    english: 'counter for small round items',
    sentenceKorean: '딸기 열 알을 먹었어요.',
    sentenceEnglish: 'I ate ten strawberries.',
    breakdown: [
      { ko: '딸기', en: 'strawberry' },
      { ko: '열', en: 'ten' },
      { ko: '알', p: '을', en: 'items' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '톨',
    romanization: 'tol',
    english: 'counter for pills, kernels',
    sentenceKorean: '약 한 톨을 먹어요.',
    sentenceEnglish: 'I take one pill.',
    breakdown: [
      { ko: '약', en: 'medicine' },
      { ko: '한', en: 'one' },
      { ko: '톨', p: '을', en: 'pill' },
      { ko: '먹어요', en: 'take' }
    ]
  },
  {
    korean: '쪽',
    romanization: 'jjok',
    english: 'counter for pages, letters',
    sentenceKorean: '편지 두 쪽을 썼어요.',
    sentenceEnglish: 'I wrote two pages of a letter.',
    breakdown: [
      { ko: '편지', en: 'letter' },
      { ko: '두', en: 'two' },
      { ko: '쪽', p: '을', en: 'pages' },
      { ko: '썼어요', en: 'wrote' }
    ]
  },
  {
    korean: '접',
    romanization: 'jeop',
    english: 'counter for folded stacks',
    sentenceKorean: '김치 한 접을 담았어요.',
    sentenceEnglish: 'I packed one stack of kimchi.',
    breakdown: [
      { ko: '김치', en: 'kimchi' },
      { ko: '한', en: 'one' },
      { ko: '접', p: '을', en: 'stack' },
      { ko: '담았어요', en: 'packed' }
    ]
  },
  {
    korean: '근',
    romanization: 'geun',
    english: 'counter for about 600 grams',
    sentenceKorean: '고기 한 근을 샀어요.',
    sentenceEnglish: 'I bought about 600 grams of meat.',
    breakdown: [
      { ko: '고기', en: 'meat' },
      { ko: '한', en: 'one' },
      { ko: '근', p: '을', en: 'geun' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  { section: 'Specialized counters' },
  {
    korean: '갑',
    romanization: 'gap',
    english: 'counter for medicine boxes',
    sentenceKorean: '약 한 갑을 샀어요.',
    sentenceEnglish: 'I bought one box of medicine.',
    breakdown: [
      { ko: '약', en: 'medicine' },
      { ko: '한', en: 'one' },
      { ko: '갑', p: '을', en: 'box' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '척',
    romanization: 'cheok',
    english: 'counter for ships',
    sentenceKorean: '배 한 척이 항구에 왔어요.',
    sentenceEnglish: 'One ship came to the port.',
    breakdown: [
      { ko: '배', en: 'ship' },
      { ko: '한', en: 'one' },
      { ko: '척', p: '이', en: 'ship' },
      { ko: '항구', p: '에', en: 'to port' },
      { ko: '왔어요', en: 'came' }
    ]
  },
  {
    korean: '편',
    romanization: 'pyeon',
    english: 'counter for vehicles, flights, letters',
    sentenceKorean: '비행기 한 편이 떴어요.',
    sentenceEnglish: 'One flight departed.',
    breakdown: [
      { ko: '비행기', en: 'airplane' },
      { ko: '한', en: 'one' },
      { ko: '편', p: '이', en: 'flight' },
      { ko: '떴어요', en: 'departed' }
    ]
  },
  {
    korean: '곡',
    romanization: 'gok',
    english: 'counter for songs',
    sentenceKorean: '노래 세 곡을 불렀어요.',
    sentenceEnglish: 'I sang three songs.',
    breakdown: [
      { ko: '노래', en: 'song' },
      { ko: '세', en: 'three' },
      { ko: '곡', p: '을', en: 'songs' },
      { ko: '불렀어요', en: 'sang' }
    ]
  },
  {
    korean: '마디',
    romanization: 'madi',
    english: 'counter for joints, verses',
    sentenceKorean: '시 한 마디가 기억나요.',
    sentenceEnglish: 'I remember one line of poetry.',
    breakdown: [
      { ko: '시', en: 'poem' },
      { ko: '한', en: 'one' },
      { ko: '마디', p: '가', en: 'line' },
      { ko: '기억나요', en: 'remember' }
    ]
  },
  {
    korean: '낱개',
    romanization: 'natgae',
    english: 'counter for individual items',
    sentenceKorean: '사탕을 낱개로 팔아요.',
    sentenceEnglish: 'They sell candy individually.',
    breakdown: [
      { ko: '사탕', p: '을', en: 'candy' },
      { ko: '낱개', p: '로', en: 'individually' },
      { ko: '팔아요', en: 'sell' }
    ]
  },
  {
    korean: '한 장',
    romanization: 'han jang',
    english: 'one sheet',
    sentenceKorean: '종이 한 장이 필요해요.',
    sentenceEnglish: 'I need one sheet of paper.',
    breakdown: [
      { ko: '종이', en: 'paper' },
      { ko: '한 장', p: '이', en: 'one sheet' },
      { ko: '필요해요', en: 'need' }
    ]
  },
  {
    korean: '두 병',
    romanization: 'du byeong',
    english: 'two bottles',
    sentenceKorean: '우유 두 병을 샀어요.',
    sentenceEnglish: 'I bought two bottles of milk.',
    breakdown: [
      { ko: '우유', en: 'milk' },
      { ko: '두 병', p: '을', en: 'two bottles' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '세 잔',
    romanization: 'se jan',
    english: 'three cups',
    sentenceKorean: '차 세 잔을 마셨어요.',
    sentenceEnglish: 'I drank three cups of tea.',
    breakdown: [
      { ko: '차', en: 'tea' },
      { ko: '세 잔', p: '을', en: 'three cups' },
      { ko: '마셨어요', en: 'drank' }
    ]
  },
  {
    korean: '네 켤레',
    romanization: 'ne kyeolle',
    english: 'four pairs',
    sentenceKorean: '양말 네 켤레를 샀어요.',
    sentenceEnglish: 'I bought four pairs of socks.',
    breakdown: [
      { ko: '양말', en: 'socks' },
      { ko: '네 켤레', p: '를', en: 'four pairs' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '다섯 그루',
    romanization: 'daseot geuru',
    english: 'five trees',
    sentenceKorean: '공원에 나무 다섯 그루가 있어요.',
    sentenceEnglish: 'There are five trees in the park.',
    breakdown: [
      { ko: '공원', p: '에', en: 'in park' },
      { ko: '나무', en: 'tree' },
      { ko: '다섯 그루', p: '가', en: 'five trees' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  {
    korean: '여섯 채',
    romanization: 'yeoseot chae',
    english: 'six buildings',
    sentenceKorean: '이 길에 집 여섯 채가 있어요.',
    sentenceEnglish: 'There are six houses on this street.',
    breakdown: [
      { ko: '이', en: 'this' },
      { ko: '길', p: '에', en: 'street' },
      { ko: '집', en: 'house' },
      { ko: '여섯 채', p: '가', en: 'six buildings' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  {
    korean: '일곱 송이',
    romanization: 'ilgop songi',
    english: 'seven bunches',
    sentenceKorean: '바나나 일곱 송이를 샀어요.',
    sentenceEnglish: 'I bought seven bunches of bananas.',
    breakdown: [
      { ko: '바나나', en: 'banana' },
      { ko: '일곱 송이', p: '를', en: 'seven bunches' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '여덟 자루',
    romanization: 'yeodeol jaru',
    english: 'eight long items',
    sentenceKorean: '연필 여덟 자루가 있어요.',
    sentenceEnglish: 'There are eight pencils.',
    breakdown: [
      { ko: '연필', en: 'pencil' },
      { ko: '여덟 자루', p: '가', en: 'eight items' },
      { ko: '있어요', en: 'there are' }
    ]
  },
  {
    korean: '아홉 봉지',
    romanization: 'ahop bongji',
    english: 'nine bags',
    sentenceKorean: '쌀 아홉 봉지를 샀어요.',
    sentenceEnglish: 'I bought nine bags of rice.',
    breakdown: [
      { ko: '쌀', en: 'rice' },
      { ko: '아홉 봉지', p: '를', en: 'nine bags' },
      { ko: '샀어요', en: 'bought' }
    ]
  },
  {
    korean: '열 상자',
    romanization: 'yeol sangja',
    english: 'ten boxes',
    sentenceKorean: '책 열 상자를 옮겼어요.',
    sentenceEnglish: 'I moved ten boxes of books.',
    breakdown: [
      { ko: '책', en: 'book' },
      { ko: '열 상자', p: '를', en: 'ten boxes' },
      { ko: '옮겼어요', en: 'moved' }
    ]
  },
  {
    korean: '몇 장',
    romanization: 'myeot jang',
    english: 'how many sheets',
    sentenceKorean: '종이가 몇 장 있어요?',
    sentenceEnglish: 'How many sheets of paper are there?',
    breakdown: [
      { ko: '종이', p: '가', en: 'paper' },
      { ko: '몇 장', en: 'how many sheets' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 병',
    romanization: 'myeot byeong',
    english: 'how many bottles',
    sentenceKorean: '물이 몇 병 있어요?',
    sentenceEnglish: 'How many bottles of water are there?',
    breakdown: [
      { ko: '물', p: '이', en: 'water' },
      { ko: '몇 병', en: 'how many bottles' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 켤레',
    romanization: 'myeot kyeolle',
    english: 'how many pairs',
    sentenceKorean: '신발이 몇 켤레 있어요?',
    sentenceEnglish: 'How many pairs of shoes are there?',
    breakdown: [
      { ko: '신발', p: '이', en: 'shoes' },
      { ko: '몇 켤레', en: 'how many pairs' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 그루',
    romanization: 'myeot geuru',
    english: 'how many trees',
    sentenceKorean: '나무가 몇 그루 있어요?',
    sentenceEnglish: 'How many trees are there?',
    breakdown: [
      { ko: '나무', p: '가', en: 'tree' },
      { ko: '몇 그루', en: 'how many trees' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 채',
    romanization: 'myeot chae',
    english: 'how many buildings',
    sentenceKorean: '집이 몇 채 있어요?',
    sentenceEnglish: 'How many houses are there?',
    breakdown: [
      { ko: '집', p: '이', en: 'house' },
      { ko: '몇 채', en: 'how many buildings' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 잔',
    romanization: 'myeot jan',
    english: 'how many cups',
    sentenceKorean: '커피가 몇 잔 있어요?',
    sentenceEnglish: 'How many cups of coffee are there?',
    breakdown: [
      { ko: '커피', p: '가', en: 'coffee' },
      { ko: '몇 잔', en: 'how many cups' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 송이',
    romanization: 'myeot songi',
    english: 'how many bunches',
    sentenceKorean: '포도가 몇 송이 있어요?',
    sentenceEnglish: 'How many bunches of grapes are there?',
    breakdown: [
      { ko: '포도', p: '가', en: 'grape' },
      { ko: '몇 송이', en: 'how many bunches' },
      { ko: '있어요', en: 'are there' }
    ]
  },
  {
    korean: '몇 자루',
    romanization: 'myeot jaru',
    english: 'how many long items',
    sentenceKorean: '우산이 몇 자루 있어요?',
    sentenceEnglish: 'How many umbrellas are there?',
    breakdown: [
      { ko: '우산', p: '이', en: 'umbrella' },
      { ko: '몇 자루', en: 'how many items' },
      { ko: '있어요', en: 'are there' }
    ]
  },
];

const produce = [
  { section: 'Fruits' },
  {
    korean: '참외',
    romanization: 'chamoe',
    english: 'Korean melon',
    sentenceKorean: '참외가 달아요.',
    sentenceEnglish: 'The Korean melon is sweet.',
    breakdown: [
      { ko: '참외', p: '가', en: 'Korean melon' },
      { ko: '달아요', en: 'is sweet' }
    ]
  },
  {
    korean: '멜론',
    romanization: 'melon',
    english: 'melon',
    sentenceKorean: '멜론을 냉장고에 넣었어요.',
    sentenceEnglish: 'I put the melon in the refrigerator.',
    breakdown: [
      { ko: '멜론', p: '을', en: 'melon' },
      { ko: '냉장고', p: '에', en: 'in refrigerator' },
      { ko: '넣었어요', en: 'put' }
    ]
  },
  {
    korean: '키위',
    romanization: 'kiwi',
    english: 'kiwi',
    sentenceKorean: '키위는 비타민이 많아요.',
    sentenceEnglish: 'Kiwis have a lot of vitamins.',
    breakdown: [
      { ko: '키위', p: '는', en: 'kiwi' },
      { ko: '비타민', p: '이', en: 'vitamin' },
      { ko: '많아요', en: 'has a lot' }
    ]
  },
  {
    korean: '망고',
    romanization: 'manggo',
    english: 'mango',
    sentenceKorean: '망고 주스를 만들었어요.',
    sentenceEnglish: 'I made mango juice.',
    breakdown: [
      { ko: '망고', en: 'mango' },
      { ko: '주스', p: '를', en: 'juice' },
      { ko: '만들었어요', en: 'made' }
    ]
  },
  {
    korean: '파인애플',
    romanization: 'painaepeul',
    english: 'pineapple',
    sentenceKorean: '파인애플이 신맛이 있어요.',
    sentenceEnglish: 'The pineapple has a sour taste.',
    breakdown: [
      { ko: '파인애플', p: '이', en: 'pineapple' },
      { ko: '신맛', p: '이', en: 'sour taste' },
      { ko: '있어요', en: 'has' }
    ]
  },
  {
    korean: '레몬',
    romanization: 'remon',
    english: 'lemon',
    sentenceKorean: '레몬을 잘라서 넣었어요.',
    sentenceEnglish: 'I sliced and added lemon.',
    breakdown: [
      { ko: '레몬', p: '을', en: 'lemon' },
      { ko: '잘라서', en: 'sliced and' },
      { ko: '넣었어요', en: 'added' }
    ]
  },
  {
    korean: '오렌지',
    romanization: 'orenji',
    english: 'orange',
    sentenceKorean: '오렌지 껍질을 벗겼어요.',
    sentenceEnglish: 'I peeled the orange.',
    breakdown: [
      { ko: '오렌지', en: 'orange' },
      { ko: '껍질', p: '을', en: 'peel' },
      { ko: '벗겼어요', en: 'peeled' }
    ]
  },
  {
    korean: '자몽',
    romanization: 'jamong',
    english: 'grapefruit',
    sentenceKorean: '아침에 자몽을 먹어요.',
    sentenceEnglish: 'I eat grapefruit in the morning.',
    breakdown: [
      { ko: '아침', p: '에', en: 'in morning' },
      { ko: '자몽', p: '을', en: 'grapefruit' },
      { ko: '먹어요', en: 'eat' }
    ]
  },
  {
    korean: '체리',
    romanization: 'cheri',
    english: 'cherry',
    sentenceKorean: '체리가 빨갛아요.',
    sentenceEnglish: 'The cherry is red.',
    breakdown: [
      { ko: '체리', p: '가', en: 'cherry' },
      { ko: '빨갛아요', en: 'is red' }
    ]
  },
  {
    korean: '블루베리',
    romanization: 'beulluberi',
    english: 'blueberry',
    sentenceKorean: '블루베리를 요거트에 넣었어요.',
    sentenceEnglish: 'I put blueberries in yogurt.',
    breakdown: [
      { ko: '블루베리', p: '를', en: 'blueberry' },
      { ko: '요거트', p: '에', en: 'in yogurt' },
      { ko: '넣었어요', en: 'put' }
    ]
  },
  {
    korean: '자두',
    romanization: 'jadu',
    english: 'plum',
    sentenceKorean: '자두가 부드러워요.',
    sentenceEnglish: 'The plum is soft.',
    breakdown: [
      { ko: '자두', p: '가', en: 'plum' },
      { ko: '부드러워요', en: 'is soft' }
    ]
  },
  {
    korean: '감',
    romanization: 'gam',
    english: 'persimmon',
    sentenceKorean: '가을에 감을 많이 먹어요.',
    sentenceEnglish: 'I eat a lot of persimmons in autumn.',
    breakdown: [
      { ko: '가을', p: '에', en: 'in autumn' },
      { ko: '감', p: '을', en: 'persimmon' },
      { ko: '많이', en: 'a lot' },
      { ko: '먹어요', en: 'eat' }
    ]
  },
  {
    korean: '석류',
    romanization: 'seongnyu',
    english: 'pomegranate',
    sentenceKorean: '석류 알이 많아요.',
    sentenceEnglish: 'The pomegranate has many seeds.',
    breakdown: [
      { ko: '석류', en: 'pomegranate' },
      { ko: '알', p: '이', en: 'seeds' },
      { ko: '많아요', en: 'many' }
    ]
  },
  {
    korean: '용과',
    romanization: 'yonggwa',
    english: 'dragon fruit',
    sentenceKorean: '용과를 처음 먹어 봤어요.',
    sentenceEnglish: 'I tried dragon fruit for the first time.',
    breakdown: [
      { ko: '용과', p: '를', en: 'dragon fruit' },
      { ko: '처음', en: 'first time' },
      { ko: '먹어', en: 'eat' },
      { ko: '봤어요', en: 'tried' }
    ]
  },
  {
    korean: '리치',
    romanization: 'richi',
    english: 'lychee',
    sentenceKorean: '리치가 달콤해요.',
    sentenceEnglish: 'The lychee is sweet.',
    breakdown: [
      { ko: '리치', p: '가', en: 'lychee' },
      { ko: '달콤해요', en: 'is sweet' }
    ]
  },
  {
    korean: '코코넛',
    romanization: 'kokoneut',
    english: 'coconut',
    sentenceKorean: '코코넛 물을 마셨어요.',
    sentenceEnglish: 'I drank coconut water.',
    breakdown: [
      { ko: '코코넛', en: 'coconut' },
      { ko: '물', p: '을', en: 'water' },
      { ko: '마셨어요', en: 'drank' }
    ]
  },
  {
    korean: '아보카도',
    romanization: 'abokado',
    english: 'avocado',
    sentenceKorean: '아보카도를 잘라서 샐러드에 넣었어요.',
    sentenceEnglish: 'I sliced avocado and put it in salad.',
    breakdown: [
      { ko: '아보카도', p: '를', en: 'avocado' },
      { ko: '잘라서', en: 'sliced and' },
      { ko: '샐러드', p: '에', en: 'in salad' },
      { ko: '넣었어요', en: 'put' }
    ]
  },
  {
    korean: '무화과',
    romanization: 'muhwagwa',
    english: 'fig',
    sentenceKorean: '무화과가 잘 익었어요.',
    sentenceEnglish: 'The fig ripened well.',
    breakdown: [
      { ko: '무화과', p: '가', en: 'fig' },
      { ko: '잘', en: 'well' },
      { ko: '익었어요', en: 'ripened' }
    ]
  },
  {
    korean: '대추',
    romanization: 'daechu',
    english: 'jujube',
    sentenceKorean: '대추차를 마셨어요.',
    sentenceEnglish: 'I drank jujube tea.',
    breakdown: [
      { ko: '대추차', p: '를', en: 'jujube tea' },
      { ko: '마셨어요', en: 'drank' }
    ]
  },
  {
    korean: '유자',
    romanization: 'yuju',
    english: 'yuzu',
    sentenceKorean: '겨울에 유자차를 마셔요.',
    sentenceEnglish: 'I drink yuzu tea in winter.',
    breakdown: [
      { ko: '겨울', p: '에', en: 'in winter' },
      { ko: '유자차', p: '를', en: 'yuzu tea' },
      { ko: '마셔요', en: 'drink' }
    ]
  },
  { section: 'Vegetables' },
  {
    korean: '오이',
    romanization: 'oi',
    english: 'cucumber',
    sentenceKorean: '오이를 썰어서 샐러드에 넣었어요.',
    sentenceEnglish: 'I sliced cucumber and put it in salad.',
    breakdown: [
      { ko: '오이', p: '를', en: 'cucumber' },
      { ko: '썰어서', en: 'sliced and' },
      { ko: '샐러드', p: '에', en: 'in salad' },
      { ko: '넣었어요', en: 'put' }
    ]
  },
  {
    korean: '가지',
    romanization: 'gaji',
    english: 'eggplant',
    sentenceKorean: '가지를 구워 먹었어요.',
    sentenceEnglish: 'I grilled and ate eggplant.',
    breakdown: [
      { ko: '가지', p: '를', en: 'eggplant' },
      { ko: '구워', en: 'grilled' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '호박',
    romanization: 'hobak',
    english: 'pumpkin, squash',
    sentenceKorean: '호박죽을 만들었어요.',
    sentenceEnglish: 'I made pumpkin porridge.',
    breakdown: [
      { ko: '호박죽', p: '을', en: 'pumpkin porridge' },
      { ko: '만들었어요', en: 'made' }
    ]
  },
  {
    korean: '브로콜리',
    romanization: 'beurokolli',
    english: 'broccoli',
    sentenceKorean: '브로콜리를 삶았어요.',
    sentenceEnglish: 'I boiled broccoli.',
    breakdown: [
      { ko: '브로콜리', p: '를', en: 'broccoli' },
      { ko: '삶았어요', en: 'boiled' }
    ]
  },
  {
    korean: '양배추',
    romanization: 'yangbaechu',
    english: 'cabbage',
    sentenceKorean: '양배추 샐러드를 만들었어요.',
    sentenceEnglish: 'I made cabbage salad.',
    breakdown: [
      { ko: '양배추', en: 'cabbage' },
      { ko: '샐러드', p: '를', en: 'salad' },
      { ko: '만들었어요', en: 'made' }
    ]
  },
  {
    korean: '시금치',
    romanization: 'sigeumchi',
    english: 'spinach',
    sentenceKorean: '시금치 나물을 만들었어요.',
    sentenceEnglish: 'I made seasoned spinach.',
    breakdown: [
      { ko: '시금치', en: 'spinach' },
      { ko: '나물', p: '을', en: 'seasoned dish' },
      { ko: '만들었어요', en: 'made' }
    ]
  },
  {
    korean: '부추',
    romanization: 'buchu',
    english: 'garlic chives',
    sentenceKorean: '부추를 김치에 넣었어요.',
    sentenceEnglish: 'I put garlic chives in the kimchi.',
    breakdown: [
      { ko: '부추', p: '를', en: 'garlic chives' },
      { ko: '김치', p: '에', en: 'in kimchi' },
      { ko: '넣었어요', en: 'put' }
    ]
  },
  {
    korean: '대파',
    romanization: 'daepa',
    english: 'green onion',
    sentenceKorean: '대파를 잘게 썰었어요.',
    sentenceEnglish: 'I finely chopped green onions.',
    breakdown: [
      { ko: '대파', p: '를', en: 'green onion' },
      { ko: '잘게', en: 'finely' },
      { ko: '썰었어요', en: 'chopped' }
    ]
  },
  {
    korean: '파',
    romanization: 'pa',
    english: 'green onion, leek',
    sentenceKorean: '파를 넣으면 맛이 좋아요.',
    sentenceEnglish: 'It tastes good if you add green onions.',
    breakdown: [
      { ko: '파', p: '를', en: 'green onion' },
      { ko: '넣으면', en: 'if you add' },
      { ko: '맛', p: '이', en: 'taste' },
      { ko: '좋아요', en: 'is good' }
    ]
  },
  {
    korean: '셀러리',
    romanization: 'selleori',
    english: 'celery',
    sentenceKorean: '셀러리를 씻었어요.',
    sentenceEnglish: 'I washed the celery.',
    breakdown: [
      { ko: '셀러리', p: '를', en: 'celery' },
      { ko: '씻었어요', en: 'washed' }
    ]
  },
  {
    korean: '아스파라거스',
    romanization: 'aseuparageoseu',
    english: 'asparagus',
    sentenceKorean: '아스파라거스를 삶았어요.',
    sentenceEnglish: 'I boiled asparagus.',
    breakdown: [
      { ko: '아스파라거스', p: '를', en: 'asparagus' },
      { ko: '삶았어요', en: 'boiled' }
    ]
  },
  {
    korean: '옥수수',
    romanization: 'oksusu',
    english: 'corn',
    sentenceKorean: '옥수수를 삶아 먹었어요.',
    sentenceEnglish: 'I boiled and ate corn.',
    breakdown: [
      { ko: '옥수수', p: '를', en: 'corn' },
      { ko: '삶아', en: 'boiled' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '완두콩',
    romanization: 'wandukong',
    english: 'peas',
    sentenceKorean: '완두콩을 넣어서 요리했어요.',
    sentenceEnglish: 'I cooked with peas.',
    breakdown: [
      { ko: '완두콩', p: '을', en: 'peas' },
      { ko: '넣어서', en: 'adding' },
      { ko: '요리했어요', en: 'cooked' }
    ]
  },
  {
    korean: '콩',
    romanization: 'kong',
    english: 'bean, soybean',
    sentenceKorean: '콩으로 두부를 만들어요.',
    sentenceEnglish: 'We make tofu from soybeans.',
    breakdown: [
      { ko: '콩', p: '으로', en: 'from beans' },
      { ko: '두부', p: '를', en: 'tofu' },
      { ko: '만들어요', en: 'make' }
    ]
  },
  {
    korean: '고구마',
    romanization: 'goguma',
    english: 'sweet potato',
    sentenceKorean: '고구마를 구워 먹었어요.',
    sentenceEnglish: 'I roasted and ate sweet potatoes.',
    breakdown: [
      { ko: '고구마', p: '를', en: 'sweet potato' },
      { ko: '구워', en: 'roasted' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '연근',
    romanization: 'yeongeun',
    english: 'lotus root',
    sentenceKorean: '연근 조림을 만들었어요.',
    sentenceEnglish: 'I made braised lotus root.',
    breakdown: [
      { ko: '연근', en: 'lotus root' },
      { ko: '조림', p: '을', en: 'braised dish' },
      { ko: '만들었어요', en: 'made' }
    ]
  },
  {
    korean: '도라지',
    romanization: 'doraji',
    english: 'bellflower root',
    sentenceKorean: '도라지 나물이 맛있어요.',
    sentenceEnglish: 'Seasoned bellflower root is delicious.',
    breakdown: [
      { ko: '도라지', en: 'bellflower root' },
      { ko: '나물', p: '이', en: 'seasoned dish' },
      { ko: '맛있어요', en: 'is delicious' }
    ]
  },
  {
    korean: '미나리',
    romanization: 'minari',
    english: 'water dropwort',
    sentenceKorean: '미나리를 씻어서 넣었어요.',
    sentenceEnglish: 'I washed and added water dropwort.',
    breakdown: [
      { ko: '미나리', p: '를', en: 'water dropwort' },
      { ko: '씻어서', en: 'washed and' },
      { ko: '넣었어요', en: 'added' }
    ]
  },
  {
    korean: '쑥',
    romanization: 'ssuk',
    english: 'mugwort',
    sentenceKorean: '쑥떡을 만들었어요.',
    sentenceEnglish: 'I made mugwort rice cakes.',
    breakdown: [
      { ko: '쑥떡', p: '을', en: 'mugwort rice cake' },
      { ko: '만들었어요', en: 'made' }
    ]
  },
  {
    korean: '깻잎',
    romanization: 'kkaennip',
    english: 'perilla leaf',
    sentenceKorean: '깻잎을 고기에 싸 먹었어요.',
    sentenceEnglish: 'I wrapped meat in perilla leaves and ate it.',
    breakdown: [
      { ko: '깻잎', p: '을', en: 'perilla leaf' },
      { ko: '고기', p: '에', en: 'with meat' },
      { ko: '싸', en: 'wrap' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '파프리카',
    romanization: 'papeurika',
    english: 'bell pepper',
    sentenceKorean: '파프리카가 색이 예뻐요.',
    sentenceEnglish: 'The bell pepper has pretty colors.',
    breakdown: [
      { ko: '파프리카', p: '가', en: 'bell pepper' },
      { ko: '색', p: '이', en: 'color' },
      { ko: '예뻐요', en: 'is pretty' }
    ]
  },
  {
    korean: '청양고추',
    romanization: 'cheongyanggochu',
    english: 'cheongyang chili pepper',
    sentenceKorean: '청양고추가 매워요.',
    sentenceEnglish: 'The cheongyang pepper is spicy.',
    breakdown: [
      { ko: '청양고추', p: '가', en: 'cheongyang pepper' },
      { ko: '매워요', en: 'is spicy' }
    ]
  },
  {
    korean: '새송이버섯',
    romanization: 'saesongibeoseot',
    english: 'king oyster mushroom',
    sentenceKorean: '새송이버섯을 볶았어요.',
    sentenceEnglish: 'I stir-fried king oyster mushrooms.',
    breakdown: [
      { ko: '새송이버섯', p: '을', en: 'king oyster mushroom' },
      { ko: '볶았어요', en: 'stir-fried' }
    ]
  },
  {
    korean: '팽이버섯',
    romanization: 'paengibeoseot',
    english: 'enoki mushroom',
    sentenceKorean: '팽이버섯을 넣어서 끓였어요.',
    sentenceEnglish: 'I boiled it with enoki mushrooms.',
    breakdown: [
      { ko: '팽이버섯', p: '을', en: 'enoki mushroom' },
      { ko: '넣어서', en: 'adding' },
      { ko: '끓였어요', en: 'boiled' }
    ]
  },
  {
    korean: '표고버섯',
    romanization: 'pyogobeoseot',
    english: 'shiitake mushroom',
    sentenceKorean: '표고버섯 향이 좋아요.',
    sentenceEnglish: 'The shiitake mushroom smells good.',
    breakdown: [
      { ko: '표고버섯', en: 'shiitake mushroom' },
      { ko: '향', p: '이', en: 'scent' },
      { ko: '좋아요', en: 'is good' }
    ]
  },
  {
    korean: '샬롯',
    romanization: 'syallot',
    english: 'shallot',
    sentenceKorean: '샬롯을 잘게 썰었어요.',
    sentenceEnglish: 'I finely chopped shallots.',
    breakdown: [
      { ko: '샬롯', p: '을', en: 'shallot' },
      { ko: '잘게', en: 'finely' },
      { ko: '썰었어요', en: 'chopped' }
    ]
  },
  {
    korean: '케일',
    romanization: 'keil',
    english: 'kale',
    sentenceKorean: '케일 샐러드를 먹었어요.',
    sentenceEnglish: 'I ate kale salad.',
    breakdown: [
      { ko: '케일', en: 'kale' },
      { ko: '샐러드', p: '를', en: 'salad' },
      { ko: '먹었어요', en: 'ate' }
    ]
  },
  {
    korean: '양상추',
    romanization: 'yangsangchu',
    english: 'lettuce',
    sentenceKorean: '양상추를 씻었어요.',
    sentenceEnglish: 'I washed the lettuce.',
    breakdown: [
      { ko: '양상추', p: '를', en: 'lettuce' },
      { ko: '씻었어요', en: 'washed' }
    ]
  },
  {
    korean: '브뤼셀스프라우트',
    romanization: 'beuryusel seupeurauseu',
    english: 'brussels sprout',
    sentenceKorean: '브뤼셀스프라우트를 볶았어요.',
    sentenceEnglish: 'I stir-fried brussels sprouts.',
    breakdown: [
      { ko: '브뤼셀스프라우트', p: '를', en: 'brussels sprout' },
      { ko: '볶았어요', en: 'stir-fried' }
    ]
  },
  {
    korean: '무순',
    romanization: 'musun',
    english: 'bean sprouts',
    sentenceKorean: '무순을 씻어서 넣었어요.',
    sentenceEnglish: 'I washed and added bean sprouts.',
    breakdown: [
      { ko: '무순', p: '을', en: 'bean sprouts' },
      { ko: '씻어서', en: 'washed and' },
      { ko: '넣었어요', en: 'added' }
    ]
  }
];

// Fix 대추 and 유자 headword in sentence - headword must appear in sentence
produce.find((w) => w.korean === '대추').sentenceKorean = '대추를 넣어 차를 끓였어요.';
produce.find((w) => w.korean === '대추').sentenceEnglish = 'I boiled tea with jujubes.';
produce.find((w) => w.korean === '대추').breakdown = [
  { ko: '대추', p: '를', en: 'jujube' },
  { ko: '넣어', en: 'adding' },
  { ko: '차', p: '를', en: 'tea' },
  { ko: '끓였어요', en: 'boiled' }
];
produce.find((w) => w.korean === '유자').sentenceKorean = '유자를 넣어 차를 마셔요.';
produce.find((w) => w.korean === '유자').sentenceEnglish = 'I drink tea with yuzu.';
produce.find((w) => w.korean === '유자').breakdown = [
  { ko: '유자', p: '를', en: 'yuzu' },
  { ko: '넣어', en: 'adding' },
  { ko: '차', p: '를', en: 'tea' },
  { ko: '마셔요', en: 'drink' }
];

const decks = [
  {
    file: 'set-30-culture.js',
    id: 'set-30-culture',
    title: 'Set 30 - Korean Culture and Holidays',
    comment: 'Set 30 - Korean Culture and Holidays',
    words: culture
  },
  {
    file: 'set-31-formal-speech.js',
    id: 'set-31-formal-speech',
    title: 'Set 31 - Formal and Honorific Speech',
    comment: 'Set 31 - Formal and Honorific Speech',
    words: formal
  },
  {
    file: 'set-32-counters.js',
    id: 'set-32-counters',
    title: 'Set 32 - Counter Words',
    comment: 'Set 32 - Counter Words',
    words: counters
  },
  {
    file: 'set-33-produce.js',
    id: 'set-33-produce',
    title: 'Set 33 - Fruits and Vegetables',
    comment: 'Set 33 - Fruits and Vegetables',
    words: produce
  }
];

for (const deck of decks) {
  const count = deck.words.filter((w) => !w.section).length;
  if (count !== 50) throw new Error(`${deck.file}: expected 50 words, got ${count}`);
  const content = renderDeck(deck);
  writeFileSync(join(ROOT, 'decks', deck.file), content);
  console.log(`Wrote ${deck.file} (${count} words)`);
}
