import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const { values } = parseArgs({ options: {
  browser: { type: 'string', default: '/usr/bin/google-chrome' },
  puppeteer: { type: 'string' },
} });

const require = createRequire(import.meta.url);
const puppeteer = require(values.puppeteer ? resolve(values.puppeteer) : 'puppeteer-core');
const root = fileURLToPath(new URL('../', import.meta.url));
const destination = join(root, 'assets/evidence/showreel');
const scratch = mkdtempSync(join(tmpdir(), 'quantquer-showreel-'));
const css = readFileSync(new URL('./generate-showreel.css', import.meta.url), 'utf8');
const imageTypes = { '.png': 'png', '.webp': 'webp' };
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function image(path, alt, className = '') {
  const data = readFileSync(join(root, 'assets', path)).toString('base64');
  const src = `data:image/${imageTypes[extname(path)]};base64,${data}`;
  return `<img src="${src}" alt="${escape(alt)}" class="${escape(className)}">`;
}

function frame(category, title, summary, content) {
  return `<main><header>${image('logo-mark.png', 'Quantquer')}<p>QUANTQUER</p></header>
  <p class="kicker">${escape(category)}</p><h1>${escape(title)}</h1><p class="summary">${escape(summary)}</p>${content}</main>`;
}

function cover(close = false) {
  return `<main class="cover ${close ? 'close' : ''}">${image('logo-full-light.png', 'Quantquer', 'cover-logo')}
    <p class="kicker">${close ? 'TECHNICAL CONSULTATION' : 'SELECTED ENGINEERING WORK'}</p>
    <h1>From Silicon<br>to <span>Intelligence.</span></h1>
    <p class="summary">${close ? 'Bring your target system, constraints and acceptance criteria.' : 'Research-driven AI and deep-tech engineering'}</p>
    ${close ? '<p class="address">quantquer.com</p>' : '<div class="cover-rule"></div>'}</main>`;
}

function vision() {
  const views = [
    ['hallway-input.webp', 'Input with illustrated occluder'],
    ['hallway-mask.webp', 'Known supplied mask'],
    ['hallway-migan.webp', 'Actual MI-GAN inpainting output'],
  ];
  return frame('RECORDED MODEL OUTPUT', 'Generative vision', 'MI-GAN-512 · ONNX Runtime · Desktop CPU',
    `<div class="vision-grid">${views.map(([path, label]) =>
      `<figure>${image(`evidence/vision/${path}`, label)}<figcaption>${escape(label)}</figcaption></figure>`).join('')}</div>
    <p class="source">Controlled still image with an illustrated overlay · Background photo by Daderot (public domain)</p>`);
}

function workcell() {
  const steps = ['Operating requirements and facility CAD', 'Robot and layout candidates', 'Reachability and cycle-time estimates', 'Reviewable layout, CAD and bill of materials'];
  return frame('ANONYMIZED ENGINEERING · SOFTWARE DELIVERY', 'Industrial workcell design', 'From operating constraints to designs an engineer can review.',
    `<div class="workcell-grid"><figure>${image('cases/robot-768.webp', 'Concept illustration of palletizing workcell placement')}
    <figcaption>Concept illustration from the public case study</figcaption></figure>
    <ol>${steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></div>
    <p class="source">quantquer.com/work/industrial-robotics/</p>`);
}

async function captureMesh(page) {
  const route = '/labs/evidence/photonics/';
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript' };
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path !== route && !path.startsWith('/assets/')) return response.writeHead(404).end();
    try {
      const file = join(root, path === route ? `${path}index.html` : path);
      const content = readFileSync(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
      return response.end(content);
    } catch {
      return response.writeHead(404).end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await page.setRequestInterception(true);
    page.on('request', request => (request.url().startsWith(`${origin}/`) ? request.continue() : request.abort()));
    await page.evaluateOnNewDocument(() => localStorage.setItem('theme', 'dark'));
    await page.goto(`${origin}${route}?lang=en`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('#mesh-output tr') !== null, { timeout: 8_000 });
    const captures = [];
    for (const fault of [false, true]) {
      captures.push(await page.evaluate(enabled => {
        const control = document.getElementById('mesh-fault');
        control.checked = enabled;
        control.dispatchEvent(new Event('input', { bubbles: true }));
        const chart = document.getElementById('mesh-canvas');
        return {
          url: chart.toDataURL(),
          summary: document.getElementById('mesh-summary').textContent,
          phase: document.getElementById('mesh-phase').value,
          attenuation: document.getElementById('mesh-attenuation').value,
        };
      }, fault));
    }
    if (captures[0].summary === captures[1].summary || captures[0].url === captures[1].url) {
      throw new Error('Ideal and fault captures must show different simulation results.');
    }
    return captures;
  } finally {
    await page.close();
    await new Promise(resolve => server.close(resolve));
  }
}

function optics(capture, faulty) {
  const label = faulty
    ? `Injected fault · ${capture.phase}° phase drift · ${capture.attenuation}% upper-arm attenuation`
    : 'Ideal lossless reference · One active input';
  return frame('SOFTWARE SIMULATION', 'Photonic mesh fault propagation', 'Four optical channels · Four stages · MZI transfer model',
    `<figure class="mesh-graph"><img src="${capture.url}" alt="${escape(label)}">
      <figcaption>${escape(label)}</figcaption></figure>
    <p class="source">${escape(capture.summary)}</p>`);
}

function trace() {
  const record = JSON.parse(readFileSync(join(root, 'assets/evidence/gpu/trace.json'), 'utf8'));
  const job = name => {
    const row = record.jobs.find(entry => entry.id === name);
    if (!row || row.exitCode !== 0) throw new Error(`No successful trace entry for ${name}.`);
    const times = [row.submitted, row.started, row.finished];
    if (times.some(value => !Number.isFinite(value) || value < 0) || times[0] > times[1] || times[1] > times[2]) {
      throw new Error(`Invalid trace interval for ${name}.`);
    }
    return { name, times };
  };
  return ['GPU A', 'GPU B', 'CPU C'].map(job);
}

function gpu(jobs, afterRelease) {
  const scale = Math.ceil(Math.max(...jobs.map(job => job.times[2])) / 5) * 5;
  const label = afterRelease ? 'The second CUDA task starts only after the first releases the GPU slot.' : 'The CPU-only task runs alongside the first CUDA task.';
  const interval = (start, end) => `--start:${100 * start / scale}%;--duration:${100 * (end - start) / scale}%`;
  const rows = jobs.map((job, index) => {
    const [submit, start, end] = job.times;
    const focus = afterRelease ? index === 1 : index !== 1;
    return `<span class="queue-name">${escape(job.name)}</span><div class="queue-track">
      ${start > submit ? `<span class="waiting" style="${interval(submit, start)}" aria-hidden="true"></span>` : ''}
      <span class="${index === 2 ? 'cpu' : ''} ${focus ? 'focus' : ''}" style="${interval(start, end)}" aria-hidden="true"></span></div>`;
  });
  return frame('RECORDED CONTROLLED RUN', 'Shared GPU scheduling', 'One GPU slot · Two CUDA fixtures · One CPU-only fixture',
    `<div class="queue"><span>Job</span><div class="queue-axis">${Array.from({length: 6}, (_, index) =>
      `<span>${Number((index * scale / 5).toFixed(1))}${index === 5 ? ' s' : ''}</span>`).join('')}</div>
      ${rows.join('')}</div><p class="queue-callout">${escape(label)}</p>
    <p class="source">Relative time since first submission · Dashed bars show waiting · Single controlled run</p>`);
}

function paperEvidence() {
  const replay = JSON.parse(readFileSync(join(root, 'assets/evidence/research/quote-gate.json'), 'utf8'));
  const exact = replay.cases.find(item => item.id === 'exact');
  const context = replay.cases.find(item => item.id === 'out-of-context');
  if (exact?.status !== 'EXACT' || context?.status !== 'NUM_FAIL') throw new Error('Research fixture outcomes differ from the reviewed inputs.');
  const cards = [[exact, 'Number matches its quote'], [context, 'Number from another context']].map(([result, label]) => `<article>
    <h2>${escape(label)} · Claimed ${escape(result.numbers[0])}</h2><blockquote>${escape(result.quote)}</blockquote>
    <p class="verdict ${result.passed ? '' : 'rejected'}">${escape(result.status)} · ${result.passed ? 'Accept' : 'Reject'}</p></article>`);
  return frame('OPEN-SOURCE VERIFICATION · SYNTHETIC TEXT FIXTURE', 'Research evidence checks', 'Verify that a cited number is supported by its context.',
    `<div class="check-grid">${cards.join('')}</div><p class="source">paper-evidence public verification core · Offline run on a synthetic text fixture</p>`);
}

function cues(scenes, locale) {
  const stamp = seconds => `00:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.000`;
  let start = 0;
  const lines = scenes.map(scene => {
    const caption = `${stamp(start)} --> ${stamp(start + scene.duration)}\n${scene[locale]}`;
    start += scene.duration;
    return caption;
  });
  return `WEBVTT\n\n${lines.join('\n\n')}\n`;
}

function ffmpeg(...args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
}

function encodeStill(image, duration, clip) {
  ffmpeg('-loop', '1', '-framerate', '24', '-i', image, '-t', String(duration), '-an',
    '-c:v', 'libx264', '-tune', 'stillimage', '-crf', '20', '-pix_fmt', 'yuv420p', '-threads', '2', clip);
}

async function renderFrames(scenes, page) {
  const clips = [];
  for (const [index, scene] of scenes.entries()) {
    const png = join(scratch, `scene-${index}.png`);
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>${css}</style>${scene.data}</html>`);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...Array.from(document.images, image => image.decode())]));
    await page.screenshot({ path: png });
    const clip = join(scratch, `scene-${index}.mp4`);
    encodeStill(png, scene.duration, clip);
    clips.push(clip);
  }
  return clips;
}

function assemble(clips, destination) {
  const list = destination + '.txt';
  writeFileSync(list, clips.map(path => `file '${path}'`).join('\n') + '\n');
  ffmpeg('-f', 'concat', '-safe', '0', '-i', list, '-map_metadata', '-1', '-c', 'copy', '-movflags', '+faststart', destination);
}

let browser;
try {
  browser = await puppeteer.launch({ executablePath: values.browser, headless: true,
    userDataDir: join(scratch, 'profile'),
    args: ['--no-sandbox', '--disable-background-networking'] });
  const sourcePage = await browser.newPage();
  await sourcePage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const mesh = await captureMesh(sourcePage);
  const jobs = trace();
  const scenes = [
    { duration: 4, data: cover(), en: 'Quantquer. Research-driven AI and deep-tech engineering.', zh: '量維資科。研究驅動的 AI 與深科技工程。' },
    { duration: 8, data: vision(), en: 'Recorded MI-GAN model output with a supplied mask.\nDesktop CPU and controlled still image.', zh: '使用已知遮罩的 MI-GAN 實際推論輸出。\n測試使用桌面 CPU 與受控靜態影像。' },
    { duration: 7, data: workcell(), en: 'Anonymized delivery: workcell layouts, CAD,\nand equipment bill of materials.', zh: '匿名軟體交付涵蓋機器人工作站佈局、CAD 與設備物料清單。' },
    { duration: 3, data: optics(mesh[0], false), en: 'Four-stage photonic mesh software simulation.\nThe first view is the ideal lossless reference.', zh: '四級光子網路軟體模擬。\n先觀察理想無耗損基準。' },
    { duration: 5, data: optics(mesh[1], true), en: 'Injecting phase drift and attenuation changes the simulated outputs.', zh: '注入相位漂移與衰減後，可觀察各通道輸出的變化。' },
    { duration: 4, data: gpu(jobs, false), en: 'Recorded run on one GPU. The CPU-only task\nstarts alongside the first CUDA task.', zh: '單張 GPU 的實際測試。CPU 任務可與第一項 CUDA 任務並行。' },
    { duration: 4, data: gpu(jobs, true), en: 'The second CUDA task waits for the GPU slot to become available.', zh: '第二項 CUDA 任務等待 GPU 執行槽釋出。' },
    { duration: 8, data: paperEvidence(), en: 'An offline check with paper-evidence accepts the number supported by its quote\nand rejects a number from another context.', zh: '使用開源 paper-evidence 離線實跑。\n引文支持的數字通過，來自別段的數字被拒絕。' },
    { duration: 9, data: cover(true), en: 'Discuss your deployment target and acceptance criteria with Quantquer.', zh: '歡迎與量維資科討論部署目標、技術限制及驗收條件。' },
  ];
  const outputPage = await browser.newPage();
  await outputPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const clips = await renderFrames(scenes, outputPage);
  const mp4 = join(scratch, 'quantquer-technical-showreel.mp4');
  const webm = join(scratch, 'quantquer-technical-showreel.webm');
  const poster = join(scratch, 'poster.webp');
  const short = join(scratch, 'quantquer-technical-showreel-short.mp4');
  assemble(clips, mp4);
  ffmpeg('-i', mp4, '-an', '-map_metadata', '-1', '-c:v', 'libvpx-vp9', '-deadline', 'good', '-cpu-used', '5',
    '-threads', '2', '-crf', '32', '-b:v', '0', webm);
  ffmpeg('-i', join(scratch, 'scene-0.png'), '-frames:v', '1', '-vf', 'scale=1280:720', '-c:v', 'libwebp', '-quality', '83', poster);
  const shortTimeline = [
    { scene: 0, duration: 2, en: 'Quantquer engineering showcase.', zh: '量維資科工程成果。' },
    { scene: 1, duration: 4, en: 'Recorded MI-GAN output on desktop CPU.', zh: '桌面 CPU 的 MI-GAN 實際輸出。' },
    { scene: 2, duration: 3, en: 'Industrial workcell design software.', zh: '工業機器人工作站設計軟體。' },
    { scene: 4, duration: 3, en: 'Photonic mesh fault simulation.', zh: '光子網路故障模擬。' },
    { scene: 6, duration: 3, en: 'Recorded single-GPU execution.', zh: '單張 GPU 的實際排程回放。' },
    { scene: 8, duration: 4, en: 'Discuss your project at quantquer.com.', zh: '歡迎至 quantquer.com 討論您的專案。' },
  ];
  const shortClips = shortTimeline.map(({ scene, duration }, shortIndex) => {
    const clip = join(scratch, `short-${shortIndex}.mp4`);
    encodeStill(join(scratch, `scene-${scene}.png`), duration, clip);
    return clip;
  });
  assemble(shortClips, short);
  mkdirSync(destination, { recursive: true });
  for (const name of ['quantquer-technical-showreel.mp4', 'quantquer-technical-showreel.webm', 'quantquer-technical-showreel-short.mp4', 'poster.webp']) {
    copyFileSync(join(scratch, name), join(destination, name));
  }
  for (const locale of ['zh', 'en']) {
    writeFileSync(join(destination, `captions-${locale}.vtt`), cues(scenes, locale));
    writeFileSync(join(destination, `captions-short-${locale}.vtt`), cues(shortTimeline, locale));
  }
  console.log(`Generated a ${scenes.reduce((sum, scene) => sum + scene.duration, 0)} second bilingual-captioned showreel.`);
} finally {
  await browser?.close();
  rmSync(scratch, { recursive: true, force: true });
}
