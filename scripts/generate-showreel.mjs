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
  const previews = close ? '' : `<div class="cover-previews">
    ${image('evidence/vision/hallway-migan.webp', 'MI-GAN inpainting output')}
    ${image('evidence/featured/robotics.webp', 'Public workcell design demo')}
  </div>`;
  return `<main class="cover ${close ? 'close' : ''}">
    <div>${image('logo-full-light.png', 'Quantquer', 'cover-logo')}
      <h1>${close ? 'From Silicon<br>to <span>Intelligence.</span>' : 'Engineering<br>in <span>practice.</span>'}</h1>
      ${close ? '<p class="address">quantquer.com</p>' : '<p class="summary">Model outputs, system demos and recorded runs.</p>'}
    </div>${previews}
  </main>`;
}

function vision() {
  return frame('RECORDED MODEL OUTPUT', 'Generative vision', 'MI-GAN-512 · ONNX Runtime · Desktop CPU',
    `<div class="vision-grid">
      <figure>
        <div class="vision-wipe">
          ${image('evidence/vision/hallway-input.webp', 'Hallway photo with an illustrated foreground person')}
          ${image('evidence/vision/hallway-migan.webp', 'Recorded MI-GAN inpainting result', 'vision-after')}
          <span aria-hidden="true"></span>
        </div>
        <figcaption><span>Before · Test input</span><span>After · MI-GAN output</span></figcaption>
      </figure>
      <div class="vision-note">
        ${image('evidence/vision/hallway-mask.webp', 'Mask supplied to the model')}
        <p>Supplied person mask</p>
        <p class="source">Controlled still image. Background photo by Daderot (public domain).</p>
      </div>
    </div>`);
}

function updateVision(progress) {
  const sweep = Math.max(0, Math.min(1, (progress - .1) / .72));
  const split = 92 - 87 * sweep * sweep * (3 - 2 * sweep);
  document.querySelector('.vision-wipe').style.setProperty('--split', `${split}%`);
}

function workcell() {
  return frame('FOUNDER’S INDEPENDENT PUBLIC DEMO', 'Industrial workcell design', 'Review a sample layout in the workcell design tool.',
    `<div class="workcell-grid"><figure>${image('evidence/featured/robotics.webp', 'Actual demo screen with a 3D workcell, input specifications and layout scoring')}
      <figcaption>Screen from the public demo · Sample configuration</figcaption></figure>
      <ol><li>Review equipment and facility constraints</li><li>Inspect the 3D layout and placement</li><li>Use the layout and scores for engineering review</li></ol>
    </div>`);
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

function gpu(jobs, duration) {
  const interval = (start, end) => `--start:${100 * start / duration}%;--duration:${100 * (end - start) / duration}%`;
  const rows = jobs.map(job => {
    const [submit, start, end] = job.times;
    return `<span class="queue-name">${escape(job.name)}</span><div class="queue-track"><div class="queue-fill">
      ${start > submit ? `<span class="waiting" style="${interval(submit, start)}" aria-hidden="true"></span>` : ''}
      <span class="${job.name === 'CPU C' ? 'cpu' : ''}" style="${interval(start, end)}" aria-hidden="true"></span></div></div>`;
  });
  return frame('RECORDED CONTROLLED RUN', 'Shared GPU scheduling', 'One GPU slot · Two CUDA fixtures · One CPU-only fixture',
    `<div class="queue"><span>Job</span><div class="queue-axis">${Array.from({length: 6}, (_, index) =>
      `<span>${Number((index * duration / 5).toFixed(1))}${index === 5 ? ' s' : ''}</span>`).join('')}</div>
      ${rows.join('')}</div>
      <p class="queue-callout"><span>Trace time <b id="trace-time">0.00 s</b></span><span>Dashed bars show waiting · Time compressed for playback</span></p>
      <p class="source">Actual admission and completion events from one controlled workstation run.</p>`);
}

function updateTrace(progress, duration) {
  const playback = Math.min(progress / .9, 1);
  document.querySelector('.queue').style.setProperty('--progress', `${playback * 100}%`);
  document.getElementById('trace-time').textContent = `${(playback * duration).toFixed(2)} s`;
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

const videoSettings = ['-an', '-c:v', 'libx264', '-tune', 'stillimage', '-crf', '20', '-pix_fmt', 'yuv420p', '-threads', '2'];

async function renderFrames(scenes, page) {
  const clips = [];
  for (const [index, scene] of scenes.entries()) {
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>${css}</style>${scene.data}</html>`);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...Array.from(document.images, image => image.decode())]));
    const clip = join(scratch, `scene-${index}.mp4`);
    if (scene.motion) {
      const fps = 10;
      const frames = scene.duration * fps;
      for (let frame = 0; frame < frames; frame++) {
        await page.evaluate(scene.motion, frame / (frames - 1), scene.traceDuration);
        await page.screenshot({ path: join(scratch, `frame-${index}-${String(frame).padStart(3, '0')}.png`) });
      }
      ffmpeg('-framerate', String(fps), '-i', join(scratch, `frame-${index}-%03d.png`), '-vf', 'fps=24', ...videoSettings, clip);
    } else {
      const png = join(scratch, `scene-${index}.png`);
      await page.screenshot({ path: png });
      ffmpeg('-loop', '1', '-framerate', '24', '-i', png, '-t', String(scene.duration), ...videoSettings, clip);
    }
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
  const traceDuration = Math.ceil(Math.max(...jobs.map(job => job.times[2])));
  const scenes = [
    { duration: 3, data: cover(), en: 'Quantquer engineering in practice.', zh: '量維資科工程成果短片。' },
    { duration: 7, data: vision(), motion: updateVision, en: 'Compare the controlled input with recorded MI-GAN output.\nThe model used a supplied person mask and ran on a desktop CPU.', zh: '比較受控輸入與 MI-GAN 的實際輸出。\n模型使用已知人物遮罩，在桌面 CPU 上執行。' },
    { duration: 6, data: workcell(), en: 'Public demo with a sample layout. Review the robot placement\nand 3D workcell in the founder’s independent tool.', zh: '畫面是創辦人獨立公開工具的示例配置，\n可在介面中查看機器人擺位和 3D 工作站。' },
    { duration: 8, data: gpu(jobs, traceDuration), motion: updateTrace, traceDuration, en: 'Recorded single-GPU run. The second CUDA job waits for the GPU.\nThe CPU-only job overlaps the first CUDA job.', zh: '單張 GPU 的實跑回放。第二項 CUDA 任務等待執行槽，\nCPU 任務與第一項 CUDA 任務並行。' },
    { duration: 3, data: optics(mesh[0], false), en: 'Four-stage photonic mesh software simulation. Ideal reference.', zh: '四級光子網格軟體模擬，先看無故障基準。' },
    { duration: 4, data: optics(mesh[1], true), en: 'Injected phase drift and attenuation change simulated outputs.', zh: '注入相位漂移與衰減後，模擬輸出隨之改變。' },
    { duration: 5, data: paperEvidence(), en: 'Open-source paper-evidence checks numbers against synthetic text.\nIt rejects a number found only in another context.', zh: '開源 paper-evidence 用合成文本測試引文查核，\n拒絕只出現在其他上下文的數字。' },
    { duration: 3, data: cover(true), en: 'Discuss your engineering project at quantquer.com.', zh: '歡迎到 quantquer.com 討論工程需求。' },
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
    { scene: 2, duration: 3, en: 'Public workcell design demo with a sample layout.', zh: '公開工作站設計示範，使用示例配置。' },
    { scene: 3, duration: 5, en: 'Recorded single-GPU execution.', zh: '單張 GPU 的實際排程回放。' },
    { scene: 5, duration: 3, en: 'Photonic mesh fault simulation.', zh: '光子網格故障模擬。' },
    { scene: 7, duration: 3, en: 'Discuss your project at quantquer.com.', zh: '歡迎到 quantquer.com 討論你的專案。' },
  ];
  const shortClips = shortTimeline.map(({ scene, duration }, shortIndex) => {
    const clip = join(scratch, `short-${shortIndex}.mp4`);
    ffmpeg('-i', clips[scene], '-t', String(duration), ...videoSettings, clip);
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
