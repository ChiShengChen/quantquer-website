import { track } from '../../analytics.mjs';

(() => {

  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const languageButton = $('vision-language');
  const sceneSelect = $('vision-evidence-scene');
  const methodSelect = $('vision-evidence-method');
  const zoomSelect = $('vision-evidence-zoom');
  const frame = $('vision-evidence-frame');
  const scroller = frame.parentElement;
  const figure = scroller.parentElement;
  const base = $('vision-evidence-base');
  const original = $('vision-evidence-original');
  const key = $('vision-evidence-key');
  const caption = $('vision-evidence-caption');
  const status = $('vision-evidence-status');
  const slider = $('vision-evidence-slider');
  const divider = $('vision-evidence-divider');
  const line = frame.querySelector('.vision-evidence-divider');
  const inputKey = frame.querySelector('.vision-evidence-key-input');
  const stages = [...document.querySelectorAll('[data-stage]')];
  const text = [...document.querySelectorAll('[data-en]')].map(e => [e, e.textContent]);
  const labels = [...document.querySelectorAll('[data-en-aria]')].map(e => [e, e.getAttribute('aria-label')]);
  const links = [...document.querySelectorAll('[data-en-href]')].map(e => [e, e.getAttribute('href')]);
  const localTitle = document.title;
  const imageDirectory = '/assets/evidence/vision/';
  const images = new Map();
  const methodNames = {migan: 'MI-GAN', telea: 'Telea'};
  let english = new URL(location.href).searchParams.get('lang') === 'en';
  const tr = (zh, en) => english ? en : zh;
  const sceneNames = scene => scene === 'hallway' ? tr('室內走廊', 'Indoor hallway') : tr('戶外林徑', 'Forest path');
  let stage = 'comparison';
  let lastView = {scene: 'hallway', method: 'migan', stage};
  let viewVersion = 0;
  let report;
  let reportError = false;
  let started = false;
  let completed = false;
  const inspected = new Set();

  function trackInteraction() {
    const data = {demo: 'vision'};
    if (!started) {
      track('demo_started', data);
      started = true;
    }
    track('demo_interacted', data);
  }

  function setLanguage() {
    root.lang = tr('zh-Hant', 'en');
    document.title = tr(localTitle, 'MI-GAN inpainting benchmark | Quantquer');
    languageButton.textContent = tr('English', '繁體中文');
    languageButton.lang = tr('en', 'zh-Hant');
    for (const [e, local] of text) e.textContent = tr(local, e.dataset.en);
    for (const [e, local] of labels) e.setAttribute('aria-label', tr(local, e.dataset.enAria));
    for (const [e, local] of links) e.setAttribute('href', tr(local, e.dataset.enHref));
    const dark = root.dataset.theme === 'dark';
    $('themeToggle').setAttribute('aria-label', dark
      ? tr('切換亮色模式', 'Switch to light mode') : tr('切換深色模式', 'Switch to dark mode'));
  }

  function imageReady(url) {
    if (!images.has(url)) {
      const loaded = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      images.set(url, loaded);
      loaded.catch(() => images.delete(url));
    }
    return images.get(url);
  }

  function renderLabels(view) {
    const scene = sceneNames(view.scene);
    const method = methodNames[view.method];
    original.alt = tr(`${scene}輸入影像，含前景人形`, `${scene} with the illustrated foreground figure`);
    const copy = {
      input: [tr('輸入', 'Input'), original.alt,
        tr('以公有領域照片為背景，合成自行繪製的前景人形。', 'A public-domain background photograph with an illustrated figure composited in front.')],
      mask: [tr('遮罩', 'Mask'), tr(`${scene}，橘色標出修補遮罩`, `${scene} with the inpainting mask highlighted in orange`),
        tr('橘色是實際送入兩種方法的遮罩區域，範圍涵蓋人形及外緣。', 'Orange marks the exact region supplied to both methods, covering the figure and its edges.')],
      comparison: [method, tr(`${scene}的 ${method} 修補輸出`, `${method} output for the ${scene.toLowerCase()}`),
        tr(`滑動比較原始輸入與 ${method} 的預錄輸出，查看人物原本遮住的細節。`, `Drag the slider to compare the input with the recorded ${method} result and inspect the reconstructed details.`)],
      reference: [tr('參考原圖', 'Clean reference'), tr(`${scene}合成前的乾淨背景`, `${scene} before compositing the figure`),
        tr('合成人形前的背景照片，用於計算遮罩區域的 PSNR。', 'The background before compositing the figure, used to calculate PSNR inside the mask.')],
    }[view.stage];
    [key.textContent, base.alt, caption.textContent] = copy;
    scroller.setAttribute('aria-label', tr('影像檢視區', 'Image viewport'));
  }

  function updateSlider() {
    const before = Number(divider.value);
    frame.style.setProperty('--vision-before', `${before}%`);
    $('vision-evidence-share').value = `${before}%`;
    divider.setAttribute('aria-valuetext', tr(`原始輸入 ${before}%`, `${before}% original input`));
    const comparison = lastView.stage === 'comparison';
    original.hidden = !comparison || before === 0;
    line.hidden = !comparison || before === 0 || before === 100;
    inputKey.hidden = !comparison || before < 14;
    key.hidden = comparison && before > 86;
  }

  async function updateViewer() {
    const version = ++viewVersion;
    const view = {scene: sceneSelect.value, method: methodSelect.value, stage};
    const comparison = stage === 'comparison';
    const inputUrl = `${imageDirectory}${view.scene}-input.webp`;
    const baseUrl = `${imageDirectory}${view.scene}-${comparison ? view.method : stage}.webp`;
    figure.setAttribute('aria-busy', 'true');
    status.textContent = '';
    try {
      await Promise.all(comparison ? [imageReady(baseUrl), imageReady(inputUrl)] : [imageReady(baseUrl)]);
      if (version !== viewVersion) return;
      base.src = baseUrl;
      original.src = inputUrl;
      lastView = view;
      slider.hidden = !comparison;
      for (const button of stages) button.setAttribute('aria-pressed', String(button.dataset.stage === stage));
      renderLabels(view);
      updateSlider();
    } catch {
      if (version !== viewVersion) return;
      sceneSelect.value = lastView.scene;
      methodSelect.value = lastView.method;
      stage = lastView.stage;
      status.textContent = tr('影像載入失敗。請重試或查看案例頁。', 'The image could not load. Try again or view the case study.');
    } finally {
      if (version === viewVersion) figure.setAttribute('aria-busy', 'false');
    }
  }

  function renderBenchmark() {
    const table = $('vision-bench-table');
    if (!report) {
      $('vision-bench-error').textContent = reportError
        ? tr('表格暫時無法載入，仍可下載上方量測檔。', 'The table could not load. You can still try downloading the benchmark file above.')
        : '';
      return;
    }
    $('vision-evidence-hardware').textContent = tr(
      `${report.device} · ONNX Runtime ${report.onnxRuntime} · ${report.threads} 執行緒 · 768 × 512 RGB · 批次 1`,
      `${report.device} · ONNX Runtime ${report.onnxRuntime} · ${report.threads} threads · 768 × 512 RGB · batch 1`,
    );
    const model = $('vision-evidence-model');
    const sizeMb = (report.model.sizeBytes / 1_000_000).toFixed(2);
    model.textContent = `MI-GAN-512 Places2 · ${sizeMb} MB ONNX · FP32 · ${report.date}`;
    model.hidden = false;
    const body = $('vision-bench-data');
    const rows = [];
    for (const [scene, metrics] of Object.entries(report.scenes)) {
      for (const [method, name] of Object.entries(methodNames)) {
        const result = metrics[method];
        const row = document.createElement('tr');
        const heading = document.createElement('th');
        heading.scope = 'row';
        heading.textContent = sceneNames(scene);
        row.append(heading);
        for (const value of [name, result.medianMs.toFixed(2), result.p95Ms.toFixed(2), result.psnrDb?.toFixed(2) ?? '∞']) {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.append(cell);
        }
        rows.push(row);
      }
    }
    body.replaceChildren(...rows);
    table.hidden = false;
  }

  async function loadBenchmark() {
    try {
      const response = await fetch(`${imageDirectory}benchmark.json`);
      if (!response.ok) throw new Error(`Benchmark ${response.status}`);
      const candidate = await response.json();
      for (const scene of ['hallway', 'forest']) {
        for (const method of Object.keys(methodNames)) {
          const result = candidate.scenes[scene][method];
          if (!Number.isFinite(result.medianMs) || !Number.isFinite(result.p95Ms)) throw new Error('Invalid benchmark');
        }
      }
      report = candidate;
    } catch {
      reportError = true;
    }
    renderBenchmark();
  }

  languageButton.addEventListener('click', () => {
    english = !english;
    const url = new URL(location.href);
    if (english) url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    setLanguage();
    renderLabels(lastView);
    updateSlider();
    renderBenchmark();
  });
  sceneSelect.addEventListener('change', () => {
    divider.value = sceneSelect.value === 'forest' ? '59' : '50';
    trackInteraction();
    updateViewer();
  });
  methodSelect.addEventListener('change', () => {
    stage = 'comparison';
    trackInteraction();
    updateViewer();
  });
  for (const button of stages) button.addEventListener('click', () => {
    stage = button.dataset.stage;
    trackInteraction();
    updateViewer();
  });
  zoomSelect.addEventListener('change', () => {
    const zoomed = zoomSelect.value === '2';
    scroller.dataset.zoom = zoomSelect.value;
    if (zoomed) {
      scroller.tabIndex = 0;
      scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
    } else {
      scroller.removeAttribute('tabindex');
      scroller.scrollTo(0, 0);
    }
  });
  divider.addEventListener('input', updateSlider);
  divider.addEventListener('change', () => {
    trackInteraction();
    if (Number(divider.value) <= 10) inspected.add('restored');
    if (Number(divider.value) >= 90) inspected.add('input');
    if (!completed && inspected.size === 2) {
      track('demo_completed', {demo: 'vision'});
      completed = true;
    }
  });

  setLanguage();
  languageButton.hidden = false;
  for (const element of document.querySelectorAll('[data-vision-control]')) element.hidden = false;
  updateViewer();
  loadBenchmark();
})();
