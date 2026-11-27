const languageButton = document.querySelector('#research-language');
const selector = document.querySelector('#research-case');
const loadStatus = document.querySelector('#research-load');
const player = document.querySelector('#research-player');
const localizable = [...document.querySelectorAll('[data-en]')].map(element => [element, element.textContent, element.dataset.en]);
const explanations = {
  exact: ['通過。引文逐字出現在原文，指定數字在附近。', 'Pass. The exact quotation and its number appear together.'],
  normalized: ['通過。換行與全形數字經正規化後吻合。', 'Pass. Line breaks and full-width digits match after normalization.'],
  'out-of-context': ['未通過。來源有 8.4 ms，但出現在另一個實驗段落。', 'Blocked. The source contains 8.4 ms in a separate experiment.'],
  unlocated: ['未通過。合成原文沒有這段引文。', 'Blocked. The quotation could not be located in the synthetic source.'],
};

let english = new URLSearchParams(window.location.search).get('lang') === 'en';
let cases;

function showResult() {
  if (!cases) return;
  const item = cases.get(selector.value);
  document.querySelector('#research-quote').textContent = item.quote;
  document.querySelector('#research-numbers').textContent = item.numbers.join(', ') || '—';
  document.querySelector('#research-status').textContent = item.status;
  document.querySelector('#research-result').textContent = explanations[item.id][Number(english)];
}

function applyLanguage() {
  document.documentElement.lang = english ? 'en' : 'zh-Hant';
  languageButton.textContent = english ? '繁中' : 'English';
  languageButton.lang = english ? 'zh-Hant' : 'en';
  for (const [element, zh, en] of localizable) element.textContent = english ? en : zh;
  if (loadStatus.dataset.failed) loadStatus.textContent = english ? 'Could not load the replay. The JSON download is still available.' : '實跑紀錄載入失敗，可下載 JSON 檢視。';
  showResult();
}

languageButton.hidden = false;
languageButton.addEventListener('click', () => {
  english = !english;
  const url = new URL(window.location.href);
  if (english) url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  applyLanguage();
});
selector.addEventListener('change', showResult);
applyLanguage();

try {
  const response = await fetch(new URL('./quote-gate.json', import.meta.url));
  if (!response.ok) throw new Error('Replay unavailable');
  const trace = await response.json();
  cases = new Map(trace.cases.map(item => [item.id, item]));
  document.querySelector('#research-source').textContent = trace.source;
  showResult();
  player.hidden = false;
  loadStatus.hidden = true;
} catch {
  cases = undefined;
  loadStatus.dataset.failed = 'true';
  applyLanguage();
}
