import { chromium, firefox } from '/Users/stephencox/.nvm/versions/node/v20.20.0/lib/node_modules/playwright/index.mjs';

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const URL = 'file://' + path.join(ROOT, 'index.html');

const SPY_SYNTH = `
(() => {
  window.__ttsLog = [];
  const synth = window.speechSynthesis;
  if (!synth) return;
  const nativeSpeak = synth.speak.bind(synth);
  const nativeCancel = synth.cancel.bind(synth);
  synth.speak = function (utterance) {
    utterance.addEventListener('start', () => {
      window.__ttsLog.push({
        type: 'start',
        text: utterance.text,
        lang: utterance.lang,
        voice: utterance.voice ? utterance.voice.name : null
      });
    });
    window.__ttsLog.push({
      type: 'speak',
      text: utterance.text,
      lang: utterance.lang
    });
    return nativeSpeak(utterance);
  };
  synth.cancel = function () {
    window.__ttsLog.push({ type: 'cancel' });
    return nativeCancel();
  };
})();
`;

async function runSuite(browserName, launch) {
  const failures = [];

  function check(name, ok, detail) {
    const label = `[${browserName}] ${name}`;
    if (!ok) failures.push(detail ? `${label}: ${detail}` : label);
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + label + (detail && !ok ? ` (${detail})` : ''));
  }

  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.addInitScript(SPY_SYNTH);
  await page.goto(URL);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForTimeout(500);

  const log = () => page.evaluate(() => window.__ttsLog || []);
  const starts = (entries) => entries.filter((e) => e && e.type === 'start');
  const startCount = (entries) => starts(entries).length;
  const cancels = (entries) => entries.filter((e) => e && e.type === 'cancel').length;

  async function waitForStarts(min, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const count = startCount(await log());
      if (count >= min) return count;
      await page.waitForTimeout(100);
    }
    return startCount(await log());
  }

  async function waitUntilIdle(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const busy = await page.evaluate(() => window.speechSynthesis.speaking || window.speechSynthesis.pending);
      if (!busy) return;
      await page.waitForTimeout(100);
    }
  }

  // --- Idle first click ---
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-card');
  const idleStarts = await waitForStarts(1, 3000);
  let entries = await log();
  check('idle first click fires onstart', idleStarts >= 1, `got ${idleStarts}`);
  check('idle first click does not cancel', cancels(entries) === 0, `cancel count ${cancels(entries)}`);

  await waitUntilIdle(3000);
  await page.evaluate(() => { window.__ttsLog = []; });

  // --- Rapid clicks while playing: only one onstart ---
  await page.click('#speak-card');
  await page.waitForTimeout(50);
  for (let i = 0; i < 9; i++) {
    await page.click('#speak-card', { force: true });
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(300);
  entries = await log();
  check('rapid clicks during playback yield one onstart', startCount(entries) === 1, `got ${startCount(entries)}`);

  await waitUntilIdle(5000);
  await page.evaluate(() => { window.__ttsLog = []; });

  // --- Replay only when prompted after finish ---
  await page.click('#speak-card');
  await waitForStarts(1, 3000);
  await waitUntilIdle(5000);
  await page.click('#speak-card');
  const replayStarts = await waitForStarts(2, 3000);
  check('second click after finish fires onstart', replayStarts >= 2, `got ${replayStarts}`);

  await waitUntilIdle(5000);
  await page.evaluate(() => { window.__ttsLog = []; });

  // --- Card speaker does not flip ---
  const flipped = await page.evaluate(() => document.getElementById('card').classList.contains('is-flipped'));
  await page.click('#speak-card');
  await page.waitForTimeout(100);
  check('card speaker does not flip card', !(await page.evaluate(() =>
    document.getElementById('card').classList.contains('is-flipped'))) === !flipped);

  await waitUntilIdle(3000);

  // --- Flipped: card speaker still works ---
  await page.click('#card');
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-card');
  check('card speaker after flip', await waitForStarts(1, 3000) >= 1);

  await waitUntilIdle(5000);

  // --- Answer sentence: English, no punctuation in spoken text ---
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-sentence');
  await waitForStarts(1, 3000);
  entries = await log();
  let lastStart = starts(entries).pop();
  check('answer sentence speaks English', lastStart && lastStart.lang === 'en-US');
  check('answer sentence strips period', lastStart && !/[.?!]/.test(lastStart.text), lastStart?.text);

  await waitUntilIdle(5000);

  // --- Korean sentence on front ---
  await page.click('#card');
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-sentence');
  await waitForStarts(1, 3000);
  entries = await log();
  lastStart = starts(entries).pop();
  check('front sentence speaks Korean', lastStart && lastStart.lang === 'ko-KR');
  check('front sentence strips period', lastStart && !/[.?!]/.test(lastStart.text), lastStart?.text);

  await waitUntilIdle(5000);

  // --- Every deck: card + sentence ---
  const decks = await page.evaluate(() => window.KOREAN_DECKS.map((d) => d.id));
  for (const id of decks) {
    await page.selectOption('#deck-picker', id);
    await page.waitForTimeout(200);
    await page.evaluate(() => { window.__ttsLog = []; });
    await page.click('#speak-card');
    await waitForStarts(1, 3000);
    await waitUntilIdle(5000);
    await page.click('#speak-sentence');
    const count = await waitForStarts(1, 3000);
    check(`deck ${id} card+sentence speak`, count >= 1, `sentence starts ${count}`);
    await waitUntilIdle(5000);
  }

  // --- Connectors: 하고 ---
  await page.selectOption('#deck-picker', 'set-07-connectors');
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-card');
  await waitForStarts(1, 3000);
  lastStart = starts(await log()).pop();
  check('connectors first card speaks 하고', lastStart && lastStart.text === '하고', lastStart?.text);

  await waitUntilIdle(5000);

  // --- Markers: 은 ---
  await page.selectOption('#deck-picker', 'set-09-markers');
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-card');
  await waitForStarts(1, 3000);
  lastStart = starts(await log()).pop();
  check('markers first card speaks 은', lastStart && lastStart.text === '은', lastStart?.text);

  await waitUntilIdle(3000);

  // --- Navigate cancels speech ---
  await page.evaluate(() => { window.__ttsLog = []; });
  await page.click('#speak-sentence');
  await page.click('#card-next');
  await page.waitForTimeout(100);
  entries = await log();
  check('next card calls cancel', cancels(entries) >= 1);

  // --- Buttons enabled ---
  check('all speak buttons enabled', await page.evaluate(() => {
    return ['speak-card', 'speak-sentence'].every((id) => {
      const b = document.getElementById(id);
      return b && !b.disabled && b.offsetParent !== null;
    });
  }));

  await browser.close();
  return failures;
}

const allFailures = [];

try {
  allFailures.push(...await runSuite('firefox', () => firefox.launch()));
} catch (err) {
  console.error('FAIL  [firefox] could not launch:', err.message);
  allFailures.push(`[firefox] launch failed: ${err.message}`);
}

try {
  allFailures.push(...await runSuite('chromium', () => chromium.launch()));
} catch (err) {
  console.error('FAIL  [chromium] could not launch:', err.message);
  allFailures.push(`[chromium] launch failed: ${err.message}`);
}

console.log(
  allFailures.length
    ? `\n${allFailures.length} failure(s):\n` + allFailures.join('\n')
    : '\nAll TTS stress checks passed (Firefox + Chromium)'
);
process.exit(allFailures.length ? 1 : 0);
