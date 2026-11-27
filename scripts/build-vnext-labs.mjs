import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { escapeHtml as h, studioPath, writeStudioPage } from './vnext-layout.mjs';
import { labCategories, labMaturity, labProjects, labDemos } from '../data/studio-labs.mjs';
import { artifacts, gpu, gpuRows, photonicFixture, quoteGate, resultIndex, round, vision, visionRows } from '../benchmarks/results.mjs';

export const labsRoutes = ['/labs/', '/labs/projects/', '/labs/demos/', '/labs/benchmarks/', '/labs/evidence/'];
const [home, projects, demos, benchmarks, evidence] = labsRoutes;
const jsonPath = '/benchmarks/results/index.json';
const schemaPath = '/benchmarks/schemas/result.schema.json';
const readme = '/benchmarks/README.md';
const visionReport = '/benchmarks/reports/vision-cpu.md';

const copy = {
  [home]: {
    title: ['Quantquer Labs', 'Quantquer Labs'],
    description: ['瀏覽量維的開源工具、研究原型、互動技術展示與可追溯的工程結果。', 'Explore open-source tools, research prototypes, interactive demonstrations, and inspectable engineering results.'],
  },
  [projects]: {
    title: ['Labs 專案', 'Labs Projects'],
    description: ['依技術類別及成熟度瀏覽專案，查看架構、實驗證據、程式與相關服務。', 'Browse projects by domain and maturity, with architecture, evidence, source code, and related services.'],
  },
  [demos]: {
    title: ['互動工程展示', 'Interactive Engineering Demos'],
    description: ['操作可公開檢查的模型、合成情境與實跑紀錄。每項展示標明輸入與結果來源。', 'Explore numerical models, synthetic scenarios, and replayed runs. Each entry identifies its inputs and the origin of its results.'],
  },
  [benchmarks]: {
    title: ['Benchmark 與實驗結果', 'Benchmarks and Experiment Results'],
    description: ['查看 CPU 實測、受控 GPU 重播、光子網路模擬及研究查核重跑的條件、數值與限制。', 'Inspect the conditions, results, and limits of CPU measurements, a controlled GPU replay, a photonic simulation, and research verification fixtures.'],
  },
  [evidence]: {
    title: ['工程證據中心', 'Engineering Evidence Center'],
    description: ['從公開結果追溯到逐次量測、事件紀錄、模型、可重跑的案例與方法。', 'Trace published results to per-run measurements, event logs, numerical models, reproducible fixtures, and methods.'],
  },
};

const translate = locale => (zh, en) => locale === 'en' ? en : zh;
const value = (item, locale) => Array.isArray(item) ? item[locale === 'en' ? 1 : 0] : item;

function labPath(path, locale, legacy = false) {
  if (!path.startsWith('/')) return path;
  if (!legacy) return studioPath(path, locale);
  if (locale !== 'en') return path;
  const [base, fragment] = path.split('#', 2);
  return base + '?lang=en' + (fragment ? '#' + fragment : '');
}

function link(href, label, { download = false, event } = {}) {
  return `<a class="text-link" href="${h(href)}"${download ? ' download' : ''}${event ? ` data-analytics="${event}"` : ''}>${h(label)}</a>`;
}

function rowLinks(links) {
  return `<div class="entry-links lab-hub-links">${links.join('')}</div>`;
}

function hero(route, locale) {
  return `<section class="topic-hero lab-hub-hero"><div class="wrap">
    <h1>${h(value(copy[route].title, locale))}</h1>
    <p class="topic-intro">${h(value(copy[route].description, locale))}</p>
  </div></section>`;
}

function routeCard(route, locale) {
  return `<article class="topic-panel lab-hub-card">
    <h2>${link(studioPath(route, locale), value(copy[route].title, locale))}</h2>
    <p>${h(value(copy[route].description, locale))}</p>
  </article>`;
}

function landingPage(locale) {
  const t = translate(locale);
  return `${hero(home, locale)}
    <section class="topic-section lab-hub-section"><div class="wrap lab-hub-grid">
      ${labsRoutes.slice(1).map(route => routeCard(route, locale)).join('')}
    </div></section>
    <section class="topic-section lab-hub-section axis-divider"><div class="wrap">
      <h2>${t('技術領域', 'Technology areas')}</h2>
      <ul class="lab-hub-category-list">${Object.entries(labCategories).map(([id, label]) =>
        `<li>${link(studioPath(projects, locale) + '?category=' + id + '#project-list', value(label, locale))}</li>`
      ).join('')}</ul>
    </div></section>`;
}

function projectResources(project, locale) {
  const t = translate(locale);
  const repo = project.repo
    ? link(project.repo, value(project.repoLabel, locale) || t('程式庫', 'Repository'), { event: 'repository_clicked' })
    : t('未公開', 'Unavailable publicly');
  const demonstration = project.demo
    ? link(labPath(project.demo, locale, project.legacy), t('操作展示', 'Open demo'))
    : t('未公開', 'Unavailable publicly');
  const notesPath = project.notes ? labPath(value(project.notes, locale), locale, project.notesLegacy) : project.repo;
  const methodology = notesPath ? link(notesPath, t('閱讀說明', 'Read documentation'))
    : project.demo ? link(labPath(project.demo, locale, project.legacy), t('方法與限制', 'Methods and limits'))
    : t('未公開', 'Unavailable publicly');
  return `<dl class="lab-hub-resources">
    <div><dt>${t('程式', 'Source')}</dt><dd>${repo}</dd></div>
    <div><dt>${t('展示', 'Demo')}</dt><dd>${demonstration}</dd></div>
    <div><dt>${t('文件', 'Docs')}</dt><dd>${methodology}</dd></div>
  </dl>`;
}

function projectCard(project, locale) {
  const t = translate(locale);
  const searchWords = [
    project.id, project.name, labCategories[project.category], labMaturity[project.maturity],
    project.purpose, project.architecture, project.evidence,
  ].flat().join(' ');
  return `<article class="topic-panel lab-hub-card" id="project-${project.id}" data-lab-project data-category="${project.category}" data-maturity="${project.maturity}" data-lab-search="${h(searchWords)}">
    <p class="lab-hub-meta"><span>${h(value(labCategories[project.category], locale))}</span><span>${h(value(labMaturity[project.maturity], locale))}</span></p>
    <h2>${h(value(project.name, locale))}</h2>
    <p>${h(value(project.purpose, locale))}</p>
    <dl class="lab-hub-details">
      <div><dt>${t('架構', 'Architecture')}</dt><dd>${h(value(project.architecture, locale))}</dd></div>
      <div><dt>${t('證據', 'Evidence')}</dt><dd>${h(value(project.evidence, locale))}</dd></div>
    </dl>
    ${projectResources(project, locale)}
    ${link(studioPath(project.offer, locale), t('相關工程服務', 'Related engineering service'))}
  </article>`;
}

function selectControl(name, label, all, vocabulary, locale) {
  const options = Object.entries(vocabulary).map(([id, text]) => `<option value="${id}">${h(value(text, locale))}</option>`).join('');
  return `<label>${label}<select name="${name}"><option value="">${all}</option>${options}</select></label>`;
}

function projectsPage(locale) {
  const t = translate(locale);
  return `${hero(projects, locale)}
    <section class="topic-section lab-hub-section"><div class="wrap">
      <form class="lab-hub-filters" data-lab-filters hidden>
        <label>${t('搜尋專案', 'Search projects')}<input name="query" type="search" autocomplete="off"></label>
        ${selectControl('category', t('技術類別', 'Technology area'), t('全部類別', 'All areas'), labCategories, locale)}
        ${selectControl('maturity', t('成熟度', 'Maturity'), t('全部狀態', 'All statuses'), labMaturity, locale)}
        <button class="btn btn-ghost" type="reset">${t('清除篩選', 'Clear filters')}</button>
      </form>
      <p class="lab-hub-count" data-lab-count data-template="${t('{count} / {total} 個專案', '{count} of {total} projects')}" role="status" hidden></p>
      <p class="topic-panel lab-hub-empty" data-lab-empty hidden>${t('沒有符合的專案。請調整搜尋或清除篩選。', 'No projects match. Adjust the search or clear the filters.')}</p>
      <div class="lab-hub-grid" id="project-list">${labProjects.map(project => projectCard(project, locale)).join('')}</div>
    </div></section>`;
}

function demosPage(locale) {
  const t = translate(locale);
  return `${hero(demos, locale)}
    <section class="topic-section lab-hub-section"><div class="wrap lab-hub-grid">
    ${labDemos.map(demo => `<article class="topic-panel lab-hub-card">
      <p class="lab-hub-meta"><span>${h(value(labCategories[demo.category], locale))}</span></p>
      <h2>${link(labPath(demo.route, locale, demo.legacy), value(demo.name, locale))}</h2>
      <p>${h(value(demo.detail, locale))}</p>
      <p class="lab-hub-source"><strong>${t('證據類型', 'Evidence type')}</strong> ${h(value(demo.evidence, locale))}</p>
    </article>`).join('')}
    </div></section>`;
}

function table(caption, heads, rows) {
  return `<div class="lab-hub-table-wrap"><table class="lab-hub-table">
    <caption>${h(caption)}</caption>
    <thead><tr>${heads.map(head => `<th scope="col">${h(head)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(([first, ...cells]) =>
      `<tr><th scope="row">${h(first)}</th>${cells.map(cell => `<td>${h(cell)}</td>`).join('')}</tr>`
    ).join('')}</tbody>
  </table></div>`;
}

const experiments = [
  {
    id: 'vision-cpu', type: 'measured', raw: artifacts.vision, replay: '/labs/evidence/vision/',
    title: ['影像修補桌面 CPU 基線', 'Image Inpainting Desktop CPU Baseline'],
    detail: ['同一組輸入比較 MI-GAN-512 與 Telea。提供 p50、p95、遮罩區域 PSNR 與逐次樣本。', 'Compare MI-GAN-512 and Telea on identical inputs, with p50, p95, masked PSNR, and per-run samples.'],
  },
  {
    id: 'gpu-trace', type: 'replayed', raw: artifacts.gpu, replay: '/labs/evidence/gpu/',
    title: ['受控單 GPU 排程紀錄', 'Controlled Single-GPU Scheduling Trace'],
    detail: ['兩項 CUDA 工作與一項 CPU 工作的排程事件和程序 VRAM 抽樣。', 'Scheduling events and per-process VRAM samples from two CUDA jobs and one CPU job.'],
  },
  {
    id: 'photonics-model', type: 'simulated', raw: artifacts.photonics, replay: '/labs/evidence/photonics/',
    title: ['四級光子網路故障', 'Four-Stage Photonic Mesh Fault'],
    detail: ['一組明確指定輸入與故障的數值模型輸出。', 'Model outputs for a specified input and fault condition.'],
  },
  {
    id: 'quote-gate', type: 'replayed', raw: artifacts.research, replay: '/labs/evidence/research/',
    title: ['Paper Evidence 引文與數字查核', 'Paper Evidence Quote and Number Checks'],
    detail: ['固定開源版本下的四組合成輸入、預期與重跑結果。', 'Four synthetic inputs and recorded outcomes from pinned open source.'],
  },
];

const evidenceTypes = {
  measured: ['實測', 'Measured'],
  replayed: ['重播', 'Replayed'],
  simulated: ['模擬', 'Simulated'],
};
const resultType = (type, locale) => value(evidenceTypes[type], locale);

function evidenceLinks(experiment, locale) {
  const t = translate(locale);
  return [
    link(experiment.raw, t('下載原始 JSON', 'Download raw JSON'), { download: true }),
    link(labPath(experiment.replay, locale, true), t('打開驗證展示', 'Open evidence viewer')),
  ];
}

function benchmarkSection(experiment, locale, contents, extraLinks = []) {
  return `<section class="topic-section lab-hub-section axis-divider" id="${experiment.id}"><div class="wrap">
    <p class="lab-hub-meta"><span>${h(resultType(experiment.type, locale))}</span></p>
    <h2>${h(value(experiment.title, locale))}</h2>
    <p class="topic-lead">${h(value(experiment.detail, locale))}</p>
    ${contents}
    ${rowLinks([...evidenceLinks(experiment, locale), ...extraLinks])}
  </div></section>`;
}

function visionBenchmark(locale) {
  const t = translate(locale);
  const names = { hallway: t('室內走廊', 'Hallway'), forest: t('戶外林徑', 'Forest'), migan: 'MI-GAN-512', telea: 'OpenCV Telea' };
  const resolution = vision.inputSize.join(' × ');
  const runtime = `ONNX Runtime ${vision.onnxRuntime}, OpenCV ${vision.openCV}`;
  const hardware = t(
    `${vision.device} 桌面 CPU，${runtime}。${resolution} RGB、批次 ${vision.batchSize}、${vision.threads} 執行緒。各場景及方法暖機 ${vision.warmups} 次，記錄 ${vision.runs} 次。`,
    `${vision.device} desktop CPU with ${runtime}. ${resolution} RGB, batch ${vision.batchSize}, and ${vision.threads} threads. ${vision.warmups} warm-ups and ${vision.runs} samples per scene and method.`
  );
  const scope = t('從備妥的輸入與遮罩計時至 RGB 輸出，包含 MI-GAN 前後處理與合成。PSNR 以未壓縮圖像的遮罩像素對照原背景。走廊由 MI-GAN 的 PSNR 領先，林徑由 Telea 領先。', 'Timing covers prepared image and mask to restored RGB, including MI-GAN pre/postprocessing and compositing. Masked PSNR compares uncompressed pixels with the reference background. MI-GAN leads on PSNR in the hallway, and Telea leads in the forest.');
  return benchmarkSection(experiments[0], locale,
    `<p>${hardware}</p>${table(t('各場景與方法的 CPU 量測', 'CPU measurements by scene and method'),
      [t('場景', 'Scene'), t('方法', 'Method'), 'p50 (ms)', 'p95 (ms)', t('遮罩 PSNR (dB)', 'Masked PSNR (dB)')],
      visionRows.map(row => [names[row.scene], names[row.method], row.medianMs, row.p95Ms, row.psnrDb])
    )}<p>${scope}</p>
      <details class="lab-hub-method" open><summary>${t('裝置部署與仍待驗證項目', 'Device deployment and remaining measurements')}</summary>
      <p>${t('目標 NPU／GPU 的延遲、尖峰記憶體、功耗、不同模型精度，以及自動分割與影片跨幀一致性，皆尚未量測。CPU 測試的作業系統版本未記錄。', 'Target NPU/GPU latency, peak memory, power, precision variants, automatic segmentation, and video temporal consistency are not yet measured. The CPU host OS version was unrecorded.')}</p></details>`,
    [link(visionReport, t('量測方法與重跑步驟', 'Method and reproduction')),
      link('/scripts/reproduce-vision.py', t('下載 CPU runner', 'Download CPU runner'), { download: true })]);
}

function gpuBenchmark(locale) {
  const t = translate(locale);
  return benchmarkSection(experiments[1], locale,
    `<p>${t(
      `${gpu.deviceMemoryMiB / 1024} GiB 單 GPU 工作站、${gpu.gpuSlots} 個 GPU 槽和 ${gpu.executionSlots} 個執行槽。每項 CUDA 工作配置 ${gpu.allocationMiB} MiB。等待時間由開始減提交，執行時間由完成減開始。`,
      `One ${gpu.deviceMemoryMiB / 1024} GiB GPU, ${gpu.gpuSlots} GPU slot, and ${gpu.executionSlots} execution slots. Each CUDA fixture allocates ${gpu.allocationMiB} MiB. Wait is start minus submission, and duration is completion minus start.`
    )}</p>
    <p>${t('公開紀錄未列 GPU 型號、作業系統、排程器與驅動版本，亦未列對照排程器。可透過下方紀錄重播核對，不含原執行環境。', 'The release omits the GPU model, OS, scheduler and driver versions, and comparative scheduler baseline. The trace can be replayed below. The original runtime is unavailable.')}</p>
    ${table(t('三項工作依紀錄推算的時間與記憶體', 'Timing and memory derived from the three-job trace'),
      [t('工作', 'Job'), t('等待 (s)', 'Wait (s)'), t('執行 (s)', 'Run (s)'), t('GPU 保留 (MiB)', 'GPU reservation (MiB)'), t('程序 VRAM 峰值抽樣 (MiB)', 'Peak sampled process VRAM (MiB)'), t('結束碼', 'Exit code')],
      gpuRows.map(job => [job.id, job.queueWait.toFixed(3), job.runDuration.toFixed(3), job.requestedMiB, job.group === 'GPU' ? job.peakMiB : '—', job.exitCode])
    )}
    <p>${t('峰值取自程序 VRAM 抽樣並包含 CUDA context。公開資料可核對工作准入次序與 CPU 並行。GPU 利用率、正式環境吞吐量與多卡擴展尚未量測。', 'Peak values are sampled per-process VRAM including the CUDA context. The public trace supports checking admission order and concurrent CPU work. GPU utilization, production throughput, and multi-GPU scaling are not yet measured.')}</p>`,
    [link(labPath('/labs/interactive/#gpu-orchestration', locale, true), t('查看獨立的策略模擬', 'Open the separate policy simulator'))]);
}

function photonicsBenchmark(locale) {
  const t = translate(locale);
  const fixture = photonicFixture.result;
  const powerLoss = round(fixture.relativePowerLoss * 100, 3);
  return benchmarkSection(experiments[2], locale,
    `<p>${t('資料由四通道、四階段理想 MZI 的 JavaScript 數值模型計算，基線為無故障網路。執行端硬體及瀏覽器版本未列。', 'A JavaScript model computes results for a four-channel, four-stage ideal MZI mesh. The fault-free network is the baseline. Host hardware and browser version are unreported.')}</p>
    <p>${t('第一輸入埠為 100% 正規化功率，2-23 單元設為 +35° 相位偏移及 20% 局部功率衰減。', 'The first input port has 100% normalized power. Cell 2-23 has a +35° phase offset and 20% local attenuation.')}</p>
    ${table(t('理想與故障輸出埠的模擬功率', 'Simulated power at ideal and faulted output ports'),
      [t('輸出埠', 'Output port'), t('理想正規化功率', 'Ideal normalized power'), t('故障下正規化功率', 'Faulted normalized power')],
      fixture.idealPortPowers.map((power, index) => [index + 1, round(power, 6), round(fixture.faultedPortPowers[index], 6)]))}
    <p>${t(
      `模型計算所得的總功率降低 ${powerLoss}%。採用理想 50:50 耦合器。製程、漂移、偵測器雜訊及實體晶片基準尚未量測。`,
      `The model estimates a ${powerLoss}% reduction in total power with ideal 50:50 couplers. Fabrication parameters, drift, detector noise, and physical chip benchmarks are not yet measured.`
    )}</p>`,
    [link('/assets/evidence/photonics/model.mjs', t('下載數值模型', 'Download numerical model'), { download: true })]);
}

function researchBenchmark(locale) {
  const t = translate(locale);
  const labels = {
    exact: t('逐字命中', 'Exact quote'), normalized: t('正規化命中', 'Normalized quote'),
    'out-of-context': t('數字上下文不符', 'Out-of-context number'), unlocated: t('無法定位', 'Unlocated quote'),
  };
  return benchmarkSection(experiments[3], locale,
    `<p>${t('公開資料未列執行硬體、作業系統或比較基線。結果依下列固定版本及測試輸入重跑。', 'Host hardware, OS and comparator are unreported. The pinned version and fixtures below reproduce the results.')}</p>
    <p>${t('固定公開版查核核心。引用數字的上下文視窗為前後各 200 個字元，關閉模糊比對。', 'A pinned public verification core checks numbers within 200 characters on either side of the quote, with fuzzy matching disabled.')}</p>
    ${table(t('四組合成輸入重跑結果', 'Replay results for four synthetic inputs'),
      [t('案例', 'Fixture'), t('狀態碼', 'Status'), t('判定', 'Decision')],
      quoteGate.cases.map(item => [labels[item.id], item.status, item.passed ? t('通過', 'Passed') : t('擋下', 'Blocked')]))}
    <p>${t('結果涵蓋這四組確定性的合成輸入。研究論點的真實性、語意推論與模型整體準確率需另行驗證。', 'The outcomes cover four deterministic synthetic inputs. Claim truth, semantic interpretation, and overall model accuracy need separate validation.')}</p>`,
    [link(quoteGate.repository + '/tree/' + quoteGate.commit, t('查看固定開源版本', 'Inspect pinned open source'), { event: 'repository_clicked' })]);
}

function benchmarksPage(locale) {
  const t = translate(locale);
  return `${hero(benchmarks, locale)}
    <div class="wrap lab-hub-toc">
      ${rowLinks(experiments.map(experiment => link('#' + experiment.id, value(experiment.title, locale))))}
      ${rowLinks([link(jsonPath, t('下載結果索引', 'Download result index'), { download: true }), link(schemaPath, t('下載資料 Schema', 'Download result schema'), { download: true }), link(readme, t('重跑說明', 'Reproduction guide'))])}
    </div>
    ${visionBenchmark(locale)}
    ${gpuBenchmark(locale)}
    ${photonicsBenchmark(locale)}
    ${researchBenchmark(locale)}`;
}

function evidencePage(locale) {
  const t = translate(locale);
  return `${hero(evidence, locale)}
    <section class="topic-section lab-hub-section"><div class="wrap">
      <dl class="lab-hub-evidence-key">
        <div><dt>${t('實測', 'Measured')}</dt><dd>${t('從記錄的環境直接取得數值。', 'Values captured directly in the recorded environment.')}</dd></div>
        <div><dt>${t('重播', 'Replayed')}</dt><dd>${t('檢查既有實跑事件，或以固定版本程式與測試輸入重跑。', 'Inspect recorded events or repeat fixtures through pinned source.')}</dd></div>
        <div><dt>${t('模擬', 'Simulated')}</dt><dd>${t('數值來自明確定義的模型、參數與假設。', 'Values computed from a model and identified inputs and assumptions.')}</dd></div>
        <div><dt>${t('已發表', 'Published')}</dt><dd>${t('有公開論文或正式出版來源可查。', 'A public paper or formal publication is available.')}</dd></div>
        <div><dt>${t('可重現', 'Reproducible')}</dt><dd>${t('提供固定版本、輸入資料與重跑步驟。', 'Pinned code, inputs and steps are available.')}</dd></div>
        <div><dt>${t('原型', 'Prototype')}</dt><dd>${t('在明列的情境中展示可運作的實作。', 'A working implementation is demonstrated under stated conditions.')}</dd></div>
        <div><dt>${t('概念示意', 'Conceptual')}</dt><dd>${t('圖解或示範用於說明方法。', 'A diagram or demonstration explains a method.')}</dd></div>
      </dl>
      <div class="lab-hub-grid">
        ${experiments.map(experiment => `<article class="topic-panel lab-hub-card">
          <p class="lab-hub-meta"><span>${h(resultType(experiment.type, locale))}</span></p>
          <h2>${link(studioPath(benchmarks, locale) + '#' + experiment.id, value(experiment.title, locale))}</h2>
          <p>${h(value(experiment.detail, locale))}</p>
          ${rowLinks(evidenceLinks(experiment, locale))}
        </article>`).join('')}
      </div>
      ${rowLinks([link(jsonPath, t('下載全部結果索引', 'Download all indexed results'), { download: true }), link(readme, t('重跑說明', 'Reproduction guide'))])}
      <h2>${t('更多工程資料', 'More engineering material')}</h2>
      ${rowLinks([
        link(labPath('/labs/demos/', locale), t('互動展示', 'Interactive demos')),
        link(labPath('/work/', locale), t('案例架構圖', 'Case study architecture')),
        link(labPath('/research/', locale), t('論文與研究成果', 'Publications and research')),
        link(labPath('/labs/projects/', locale), t('公開程式與文件', 'Open source and documentation')),
        link('/#showreel', t('工程展示影片', 'Engineering showreel')),
      ])}
    </div></section>`;
}

const renderers = [landingPage, projectsPage, demosPage, benchmarksPage, evidencePage];

async function writeJson(path, data, check) {
  const place = new URL('..' + path, import.meta.url);
  const output = JSON.stringify(data, null, 2) + '\n';
  const existing = await readFile(place, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return '';
  });
  if (existing === output) return;
  if (check) throw new Error('Outdated benchmark artifact ' + path);
  await mkdir(new URL('./', place), { recursive: true });
  await writeFile(place, output);
}

export async function buildVnextLabs({ check = false } = {}) {
  await writeJson(jsonPath, resultIndex, check);
  await writeJson(artifacts.photonics, photonicFixture, check);
  for (const locale of ['zh', 'en']) {
    for (const [index, route] of labsRoutes.entries()) {
      const t = translate(locale);
      const breadcrumbs = [{ href: studioPath('/', locale), label: t('首頁', 'Home') }];
      if (route !== home) breadcrumbs.push({ href: studioPath(home, locale), label: 'Labs' });
      await writeStudioPage({
        route, locale,
        title: value(copy[route].title, locale), description: value(copy[route].description, locale),
        content: renderers[index](locale), breadcrumbs, structuredData: { '@type': 'CollectionPage' },
        styles: ['/assets/vnext-labs.css'], scripts: route === projects ? ['/assets/vnext-labs.mjs'] : [],
      }, { check });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildVnextLabs({ check: process.argv.includes('--check') });
}
