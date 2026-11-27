(() => {
  const element = id => document.getElementById(id);
  const languageButton = element('showcase-language');
  const themeButton = element('themeToggle');
  const htmlTitle = document.title;
  const queryLanguage = () => new URLSearchParams(location.search).get('lang') === 'en';
  let isEnglish = queryLanguage();
  const translate = (zh, en) => isEnglish ? en : zh;

  const translations = Array.from(document.querySelectorAll('[data-en]'), node => ({
    node,
    original: node.textContent.trim(),
    english: node.dataset.en,
  }));
  const accessibleNames = Array.from(document.querySelectorAll('[data-en-aria]'), node => ({
    node,
    original: node.getAttribute('aria-label'),
    english: node.dataset.enAria,
  }));
  const links = Array.from(document.querySelectorAll('[data-en-href]'), node => ({
    node,
    original: node.getAttribute('href'),
    english: node.dataset.enHref,
  }));

  function paintShape(context, color, points) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(...points[0]);
    points.slice(1).forEach(point => context.lineTo(...point));
    context.closePath();
    context.fill();
  }

  function paintLandscape(context) {
    const sky = context.createLinearGradient(0, 0, 0, 112);
    sky.addColorStop(0, '#BBD5E9');
    sky.addColorStop(1, '#F6E6D1');
    context.fillStyle = sky;
    context.fillRect(0, 0, 320, 180);

    context.fillStyle = '#FFF2C4';
    context.beginPath();
    context.arc(221, 42, 16, 0, Math.PI * 2);
    context.fill();

    paintShape(context, '#849DB4', [[0, 104], [30, 91], [65, 96], [127, 48], [156, 83], [174, 69], [212, 102], [270, 63], [320, 92], [320, 180], [0, 180]]);
    paintShape(context, '#B1C4D2', [[99, 70], [127, 48], [146, 70], [136, 65], [133, 71], [125, 64], [119, 67]]);
    paintShape(context, '#5F8F91', [[0, 117], [56, 112], [109, 128], [161, 101], [193, 111], [231, 99], [278, 110], [320, 103], [320, 180], [0, 180]]);
    paintShape(context, '#416C79', [[0, 141], [62, 149], [121, 135], [166, 119], [203, 134], [253, 125], [320, 139], [320, 180], [0, 180]]);
    paintShape(context, '#D5BE90', [[0, 158], [65, 150], [121, 157], [165, 146], [202, 143], [264, 145], [320, 135], [320, 180], [0, 180]]);
    paintShape(context, '#A48268', [[0, 170], [55, 164], [116, 173], [181, 161], [246, 167], [320, 151], [320, 180], [0, 180]]);

    context.strokeStyle = '#F0DBAC';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 162);
    context.quadraticCurveTo(125, 158, 198, 150);
    context.quadraticCurveTo(248, 150, 320, 139);
    context.stroke();
  }

  function paintPerson(context) {
    context.fillStyle = '#223344';
    context.beginPath();
    context.arc(163, 66, 10, 0, Math.PI * 2);
    context.fill();
    paintShape(context, '#24374C', [[151, 112], [176, 112], [180, 147], [184, 159], [172, 159], [163, 133], [157, 158], [143, 158], [148, 145]]);
    paintShape(context, '#A0423D', [[152, 77], [172, 77], [183, 87], [187, 116], [179, 118], [174, 97], [176, 118], [149, 118], [151, 96], [145, 117], [137, 114], [143, 87]]);
    paintShape(context, '#CE6554', [[152, 77], [163, 79], [159, 116], [149, 118], [151, 96], [143, 114], [137, 114], [143, 87]]);
  }

  function initializeVision() {
    const before = element('vision-before');
    const after = element('vision-after');
    const source = before.getContext('2d');
    const restored = after.getContext('2d');
    const frame = element('vision-frame');
    const reveal = element('vision-reveal');
    const mask = element('vision-mask');
    const output = element('vision-result');

    paintLandscape(source);
    const cleanImage = source.getImageData(0, 0, before.width, before.height);
    paintPerson(source);
    const occludedImage = source.getImageData(0, 0, before.width, before.height);
    let maskedError = 0;
    let maskedCount = 0;

    const updateReveal = () => {
      const percent = Number(reveal.value);
      frame.style.setProperty('--revealed', percent + '%');
      frame.querySelector('.vision-key-before').hidden = percent > 83;
      frame.querySelector('.vision-key-after').hidden = percent < 17;
      frame.querySelector('.vision-divider').hidden = percent === 0 || percent === 100;
      element('vision-reveal-value').value = percent + '%';
      frame.setAttribute('aria-label', translate(
        `合成場景，修復影像顯示 ${percent}%，其餘為原始人物遮擋畫面。`,
        `Synthetic scene, ${percent}% restored view, with the rest showing the original occluding figure.`
      ));
    };

    const describeResult = () => {
      output.textContent = translate(
        `修復 ${maskedCount} 個遮罩像素 · RGB 平均絕對誤差 ${maskedError.toFixed(2)}／255`,
        `Restored ${maskedCount} masked pixels · RGB mean absolute error ${maskedError.toFixed(2)} / 255`
      );
    };

    const reconstruct = () => {
      const padding = Number(mask.value);
      const left = 137 - padding;
      const right = 188 + padding;
      const top = 56 - padding;
      const bottom = 160 + padding;
      const { width, height, data } = occludedImage;
      const filled = new ImageData(new Uint8ClampedArray(data), width, height);
      let error = 0;
      for (let y = top; y < bottom; y += 1) {
        const row = y * width;
        const first = (row + left - 1) * 4;
        const last = (row + right) * 4;
        const distance = right - left + 1;
        for (let x = left; x < right; x += 1) {
          const pixel = (row + x) * 4;
          const amount = (x - left + 1) / distance;
          for (let channel = 0; channel < 3; channel += 1) {
            const sample = pixel + channel;
            filled.data[sample] = data[first + channel] * (1 - amount) + data[last + channel] * amount;
            error += Math.abs(filled.data[sample] - cleanImage.data[sample]);
          }
        }
      }
      restored.putImageData(filled, 0, 0);
      maskedCount = (right - left) * (bottom - top);
      maskedError = error / (maskedCount * 3);
      describeResult();
    };

    mask.addEventListener('change', reconstruct);
    reveal.addEventListener('input', updateReveal);
    reconstruct();
    return () => {
      updateReveal();
      describeResult();
    };
  }

  function outputPowers(phase, loss) {
    const gain = Math.sqrt(1 - loss);
    const interference = 2 * gain * Math.cos(phase * Math.PI / 180);
    const scale = 1 + gain * gain;
    return [(scale - interference) / 4, (scale + interference) / 4];
  }

  function initializePhotonicFlow() {
    const canvas = element('photon-flow');
    const context = canvas.getContext('2d');
    if (!context) {
      element('photon-flow-panel').hidden = true;
      return;
    }

    const play = element('photon-play');
    const speed = element('photon-speed');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const pulseSpacing = 26;
    const guides = [
      [[.06, .50], [.22, .50]],
      [[.22, .50], [.34, .28], [.50, .28]],
      [[.50, .28], [.62, .28], [.74, .50]],
      [[.22, .50], [.34, .72], [.62, .72], [.74, .50]],
      [[.74, .50], [.84, .31], [.94, .31]],
      [[.74, .50], [.84, .69], [.94, .69]],
    ];
    let width = 0;
    let height = 0;
    let guidesInPixels = [];
    let offsets = [];
    let state;
    let colors;
    let playing = !motion.matches;
    let visible = false;
    let frameId = 0;
    let lastFrame = 0;
    let travel = 0;

    const px = (x, y) => [x * width, y * height];

    function readPalette() {
      const style = getComputedStyle(canvas);
      const tokens = ['--accent', '--fg-dim', '--bg-2', '--flow-grid', '--flow-guide', '--flow-fault'];
      colors = Object.fromEntries(tokens.map(token => [token, style.getPropertyValue(token).trim()]));
    }

    function draw() {
      if (!width || !height || !state) return;
      const {phase, loss, outputs, fault} = state;
      const accent = colors['--accent'];
      const warning = colors['--flow-fault'];
      const powers = [1, .5, (1 - loss) / 2, .5, ...outputs];

      context.clearRect(0, 0, width, height);
      context.fillStyle = colors['--bg-2'];
      context.fillRect(...px(.16, .12), width * .68, height * .76);
      context.strokeStyle = colors['--flow-grid'];
      context.lineWidth = 1;
      context.strokeRect(...px(.16, .12), width * .68, height * .76);
      for (let x = width * .16 + 21; x < width * .84; x += 21) {
        context.beginPath();
        context.moveTo(x, height * .12);
        context.lineTo(x, height * .88);
        context.stroke();
      }

      context.lineCap = 'round';
      context.lineJoin = 'round';
      guidesInPixels.forEach(({points, segments, length}, index) => {
        const power = powers[index];
        context.beginPath();
        context.moveTo(...points[0]);
        points.slice(1).forEach(point => context.lineTo(...point));
        context.strokeStyle = colors['--flow-guide'];
        context.lineWidth = 2;
        context.stroke();
        if (power < .0001) return;

        context.strokeStyle = accent;
        context.lineWidth = 1 + power * 3;
        context.globalAlpha = .22 + power * .53;
        context.stroke();
        context.globalAlpha = .24 + Math.sqrt(power) * .76;
        context.fillStyle = accent;
        const first = ((travel - offsets[index]) % pulseSpacing + pulseSpacing) % pulseSpacing;
        for (let distance = first; distance < length; distance += pulseSpacing) {
          let remaining = distance;
          for (const {start, dx, dy, length: segmentLength} of segments) {
            if (remaining <= segmentLength) {
              const fraction = remaining / segmentLength;
              context.beginPath();
              context.arc(start[0] + dx * fraction, start[1] + dy * fraction, 1.8 + power * 1.6, 0, Math.PI * 2);
              context.fill();
              break;
            }
            remaining -= segmentLength;
          }
        }
        context.globalAlpha = 1;
      });

      for (const x of [.22, .74]) {
        const [left, top] = px(x, .50);
        context.fillStyle = colors['--bg-2'];
        context.strokeStyle = accent;
        context.lineWidth = 2;
        context.fillRect(left - 5, top - 5, 10, 10);
        context.strokeRect(left - 5, top - 5, 10, 10);
      }
      context.beginPath();
      context.arc(...px(.50, .28), fault ? 7 : 5, 0, 2 * Math.PI);
      context.fillStyle = colors['--bg-2'];
      context.fill();
      context.strokeStyle = fault ? warning : accent;
      context.stroke();

      context.font = '500 12px system-ui, sans-serif';
      context.fillStyle = colors['--fg-dim'];
      context.textAlign = 'left';
      context.fillText(translate('輸入', 'Input'), ...px(.06, .41));
      context.textAlign = 'right';
      context.fillText(translate('埠 1', 'Port 1'), ...px(.94, .23));
      context.fillText(translate('埠 2', 'Port 2'), ...px(.94, .84));
      context.textAlign = 'center';
      context.fillStyle = fault ? warning : colors['--fg-dim'];
      context.fillText(translate('上臂', 'Upper arm') + ' · ' + phase + '°', ...px(.50, .18));
    }

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      guidesInPixels = guides.map(guide => {
        const points = guide.map(point => px(...point));
        const segments = points.slice(1).map((point, index) => {
          const start = points[index];
          const dx = point[0] - start[0];
          const dy = point[1] - start[1];
          return {start, dx, dy, length: Math.hypot(dx, dy)};
        });
        return {points, segments, length: segments.reduce((sum, segment) => sum + segment.length, 0)};
      });
      // A shared travel offset carries each pulse across the splitter and combiner.
      const [input, upperStart, , lower] = guidesInPixels.map(guide => guide.length);
      const couplingDistance = input + lower;
      offsets = [0, input, input + upperStart, input, couplingDistance, couplingDistance];
      draw();
    }

    function syncPlayback() {
      play.textContent = playing ? translate('暫停動畫', 'Pause animation') : translate('播放動畫', 'Play animation');
      if (playing && visible && !document.hidden) {
        if (!frameId) frameId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(frameId);
        frameId = 0;
        lastFrame = 0;
      }
    }

    function animate(now) {
      if (lastFrame) travel = (travel + Math.min(now - lastFrame, 64) * Number(speed.value) * .075) % pulseSpacing;
      lastFrame = now;
      draw();
      frameId = requestAnimationFrame(animate);
    }

    readPalette();
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }).observe(canvas);
    document.addEventListener('visibilitychange', syncPlayback);
    document.addEventListener('quantquer:themechange', () => {
      readPalette();
      draw();
    });
    play.addEventListener('click', () => {
      playing = !playing;
      syncPlayback();
    });
    motion.addEventListener('change', event => {
      if (event.matches) {
        playing = false;
        syncPlayback();
      }
    });

    return next => {
      state = next;
      draw();
      syncPlayback();
    };
  }

  function initializePhotonics() {
    const designPhase = element('photon-phase');
    const phaseDrift = element('photon-drift');
    const powerLoss = element('photon-loss');
    const enabled = element('photon-fault-enabled');
    const result = element('photon-result');
    const updateFlow = initializePhotonicFlow();

    function render() {
      const reference = outputPowers(Number(designPhase.value), 0);
      const drift = enabled.checked ? Number(phaseDrift.value) : 0;
      const loss = enabled.checked ? Number(powerLoss.value) / 100 : 0;
      const phase = (Number(designPhase.value) + drift + 360) % 360;
      const current = outputPowers(phase, loss);
      updateFlow?.({phase, loss, outputs: current, fault: drift !== 0 || loss !== 0});
      phaseDrift.disabled = !enabled.checked;
      powerLoss.disabled = !enabled.checked;
      element('photon-phase-value').value = designPhase.value + '°';
      element('photon-drift-value').value = phaseDrift.value + '°';
      element('photon-loss-value').value = powerLoss.value + '%';
      const percent = power => (power * 100).toFixed(2) + '%';
      element('photon-arm-upper').value = percent((1 - loss) / 2) + ' · ' + phase + '°';
      current.forEach((power, index) => {
        const port = index + 1;
        element('photon-reference-' + port).value = percent(reference[index]);
        element('photon-current-' + port).value = percent(power);
        element('photon-bar-' + port).style.setProperty('--showcase-width', percent(power));
      });
      const delta = Math.abs(current[0] - reference[0]) * 100;
      const total = percent(current[0] + current[1]);
      result.textContent = translate(
        `總輸出 ${total} · 輸出埠 1 與無故障基準相差 ${delta.toFixed(2)} 個百分點`,
        `Total output ${total} · Port 1 differs from the reference by ${delta.toFixed(2)} percentage points`
      );
    }
    for (const input of [designPhase, phaseDrift, powerLoss]) input.addEventListener('input', render);
    enabled.addEventListener('change', render);
    return render;
  }

  const syntheticJobs = [
    { zh: '視覺訓練', en: 'Vision training', vram: 8, cpu: 4, duration: 6 },
    { zh: '特徵擷取', en: 'Feature extraction', vram: 6, cpu: 3, duration: 4 },
    { zh: '模型微調', en: 'Model fine-tuning', vram: 12, cpu: 4, duration: 7 },
    { zh: '音訊推論', en: 'Audio inference', vram: 3, cpu: 2, duration: 3 },
    { zh: '批次評測', en: 'Batch evaluation', vram: 4, cpu: 2, duration: 5 },
    { zh: '影格編碼', en: 'Frame encoding', vram: 2, cpu: 1, duration: 3 },
    { zh: '向量嵌入', en: 'Embedding run', vram: 6, cpu: 2, duration: 4 },
    { zh: '合成影像', en: 'Synthetic images', vram: 7, cpu: 4, duration: 5 },
  ];

  function simulateQueue(jobs, capacity, policy) {
    const admits = (job, resources) => job.vram <= resources.vram && job.cpu <= resources.cpu;
    const waiting = jobs.filter(job => admits(job, capacity));
    const schedules = new Map();
    const frames = [];
    let active = [];
    let peak = 0;
    let finish = 0;

    while (waiting.length || active.length) {
      const time = frames.length;
      active = active.filter(job => schedules.get(job).end > time);
      const available = { ...capacity };
      const started = [];
      for (const job of active) {
        available.vram -= job.vram;
        available.cpu -= job.cpu;
      }

      while (waiting.length) {
        const firstFit = policy === 'backfill'
          ? waiting.findIndex(job => admits(job, available))
          : (admits(waiting[0], available) ? 0 : -1);
        if (firstFit < 0) break;
        const [job] = waiting.splice(firstFit, 1);
        const end = time + job.duration;
        schedules.set(job, { start: time, end });
        active.push(job);
        started.push(job);
        available.vram -= job.vram;
        available.cpu -= job.cpu;
        finish = Math.max(finish, end);
      }
      peak = Math.max(peak, capacity.vram - available.vram);
      frames.push({ started, head: waiting[0], available });
    }

    return { schedules, frames, finish, peak, blocked: jobs.length - schedules.size };
  }

  function initializeGpuScheduler() {
    const vram = element('gpu-vram');
    const cpu = element('gpu-cpu');
    const policy = element('gpu-policy');
    const jobCount = element('gpu-jobs');
    const queue = element('gpu-queue');
    const result = element('gpu-result');
    const play = element('gpu-play');
    const step = element('gpu-step');
    const time = element('gpu-time');
    const timeOutput = element('gpu-time-value');
    const compare = element('gpu-compare');
    const comparison = element('gpu-comparison');
    const differenceMessage = element('gpu-divergence');
    const comparisonTotals = element('gpu-totals');
    const decision = element('gpu-decision');
    const overCapacity = element('gpu-over-capacity');
    const waiting = element('gpu-waiting');
    const running = element('gpu-running');
    const completed = element('gpu-completed');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const resources = ['vram', 'cpu'].map(key => ({
      key,
      bar: element('gpu-' + key + '-segments'),
      usage: element('gpu-' + key + '-used'),
    }));
    const policies = ['fifo', 'backfill'];
    const policyName = { fifo: 'FIFO', backfill: 'Backfill' };
    const jobName = job => translate(job.zh, job.en);
    let jobs, capacity, simulations, finish, divergence;
    let cards = [];
    let rails = [];
    let tick = -1;
    let timer = null;

    function configure() {
      stop();
      tick = -1;
      jobs = syntheticJobs.slice(0, Number(jobCount.value));
      capacity = { vram: Number(vram.value), cpu: Number(cpu.value) };
      const [fifo, backfill] = policies.map(name => simulateQueue(jobs, capacity, name));
      simulations = { fifo, backfill };
      finish = Math.max(fifo.finish, backfill.finish);
      divergence = -1;
      for (let index = 0; index < finish; index += 1) {
        const first = fifo.frames[index]?.started ?? [];
        const second = backfill.frames[index]?.started ?? [];
        if (first.length !== second.length || first.some(job => !second.includes(job))) {
          divergence = index;
          break;
        }
      }
      element('gpu-jobs-value').value = String(jobs.length);
      time.max = String(finish);
      time.disabled = finish === 0;
      for (const lane of [waiting, running, completed]) lane.replaceChildren();
      for (const { bar } of resources) bar.replaceChildren();
      cards = jobs.flatMap((job, index) => {
        if (!fifo.schedules.has(job)) return [];
        const card = document.createElement('li');
        const color = `var(--gpu-job-${index})`;
        card.className = 'gpu-card';
        card.dataset.order = index;
        card.style.setProperty('--gpu-job-color', color);
        waiting.append(card);
        const segments = resources.map(resource => {
          const segment = document.createElement('span');
          segment.style.setProperty('--gpu-job-color', color);
          resource.bar.append(segment);
          return segment;
        });
        return [{ job, index, card, segments }];
      });
      render();
    }

    function buildRail(name, timing) {
      const rail = document.createElement('div');
      rail.className = 'gpu-rail';
      rail.dataset.policy = name;
      rail.dataset.secondary = String(name !== policy.value);
      const track = document.createElement('div');
      track.className = 'gpu-track';
      track.setAttribute('aria-hidden', 'true');
      const windowBar = document.createElement('span');
      windowBar.className = 'gpu-window';
      windowBar.style.setProperty('--gpu-start', timing.start / finish * 100 + '%');
      windowBar.style.setProperty('--gpu-width', (timing.end - timing.start) / finish * 100 + '%');
      const elapsed = document.createElement('span');
      windowBar.append(elapsed);
      track.append(windowBar);
      const label = document.createElement('span');
      label.className = 'gpu-interval';
      label.textContent = timing.start + '–' + timing.end;
      if (compare.checked) {
        const tag = document.createElement('span');
        tag.className = 'gpu-policy-tag';
        tag.textContent = policyName[name] + ' ';
        rail.append(tag);
      }
      rail.append(track, label);
      rails.push({ timing, elapsed });
      return rail;
    }

    function render() {
      if (!simulations) {
        configure();
        return;
      }
      for (const { job, card, segments } of cards) {
        card.textContent = jobName(job);
        segments[0].title = `${jobName(job)} · ${job.vram} GB`;
        segments[1].title = translate(`${jobName(job)} · ${job.cpu} 核心`, `${jobName(job)} · ${job.cpu} cores`);
      }
      const { schedules, finish: total, peak, blocked } = simulations[policy.value];
      const visiblePolicies = compare.checked ? policies : [policy.value];
      rails = [];
      queue.closest('table').dataset.compare = String(compare.checked);
      const rows = jobs.map(job => {
        const row = document.createElement('tr');
        const name = document.createElement('th');
        name.scope = 'row';
        name.textContent = jobName(job);
        row.append(name);

        const demand = row.insertCell();
        demand.textContent = job.vram + ' GB';
        const cores = document.createElement('span');
        cores.className = 'gpu-detail';
        cores.textContent = translate(job.cpu + ' 核心', job.cpu + ' cores');
        demand.append(cores);

        const timeline = row.insertCell();
        if (schedules.has(job)) {
          timeline.append(...visiblePolicies.map(name => buildRail(name, simulations[name].schedules.get(job))));
        } else {
          timeline.textContent = translate('超出容量', 'Over capacity');
        }
        return row;
      });
      queue.replaceChildren(...rows);
      result.textContent = translate(
        `${policyName[policy.value]} · 完成 ${schedules.size}／${jobs.length} 件 · 超出容量 ${blocked} 件 · 耗時 ${total} 刻度 · VRAM 峰值 ${peak} GB`,
        `${policyName[policy.value]} · Completed ${schedules.size} / ${jobs.length} · ${blocked} over capacity · ${total} ticks · ${peak} GB peak VRAM`
      );
      overCapacity.hidden = blocked === 0;
      const excluded = jobs.filter(job => !schedules.has(job)).map(jobName);
      overCapacity.textContent = translate(`超出設備總容量（${excluded.join('、')}）`, `Over device capacity (${excluded.join(', ')})`);
      comparison.hidden = !compare.checked;
      comparisonTotals.textContent = translate(
        `FIFO ${simulations.fifo.finish} 刻度 · Backfill ${simulations.backfill.finish} 刻度`,
        `FIFO ${simulations.fifo.finish} ticks · Backfill ${simulations.backfill.finish} ticks`
      );
      renderFrame();
    }

    function describeFrame(simulation, frame) {
      if (tick < 0) return translate('所有任務將在刻度 0 到達。', 'All jobs arrive at tick 0.');
      if (tick >= simulation.finish) return translate('可排程的任務已全部完成。', 'All eligible jobs have completed.');
      const { head, available, started } = frame;
      if (!head) return translate('所有可排程的任務都已啟動。', 'All eligible jobs have started.');
      const limits = [];
      if (head.vram > available.vram) limits.push(translate(`需要 ${head.vram} GB，剩 ${available.vram} GB`, `needs ${head.vram} GB with ${available.vram} GB free`));
      if (head.cpu > available.cpu) limits.push(translate(`需要 ${head.cpu} 核心，剩 ${available.cpu} 核心`, `needs ${head.cpu} cores with ${available.cpu} free`));
      const later = started.filter(job => jobs.indexOf(job) > jobs.indexOf(head)).map(jobName);
      const reason = limits.join(' · ');
      const waitingReason = translate(`${jobName(head)}仍在等待（${reason}）。`, `${jobName(head)} is waiting (${reason}).`);
      if (!later.length || (compare.checked && tick === divergence)) return waitingReason;
      return waitingReason + translate(`${later.join('、')}先執行。`, ` Backfill starts ${later.join(', ')} first.`);
    }

    function renderFrame(animate = false) {
      const simulation = simulations[policy.value];
      const frame = simulation.frames[tick] ?? { available: capacity };
      const playing = timer !== null;
      const tickLabel = tick < 0 ? translate('就緒', 'Ready') : translate(`刻度 ${tick}／${finish}`, `Tick ${tick} / ${finish}`);
      timeOutput.value = tickLabel;
      time.value = String(tick);
      time.setAttribute('aria-valuetext', tickLabel);
      play.textContent = playing ? translate('暫停', 'Pause') : tick >= finish ? translate('重播', 'Replay') : translate('播放', 'Play');
      play.disabled = finish === 0;
      step.disabled = tick >= finish;

      const moves = [];
      for (const { job, index, card, segments } of cards) {
        const { start, end } = simulation.schedules.get(job);
        const active = start <= tick && tick < end;
        const lane = tick < start ? waiting : active ? running : completed;
        if (card.parentNode !== lane) {
          const before = animate && !reducedMotion.matches ? card.getBoundingClientRect() : null;
          moves.push({ card, index, lane, before });
        }
        segments.forEach((segment, keyIndex) => {
          const { key } = resources[keyIndex];
          segment.style.width = active ? job[key] / capacity[key] * 100 + '%' : '0%';
        });
      }
      for (const { card, lane, index } of moves) {
        const next = Array.from(lane.children).find(child => Number(child.dataset.order) > index);
        lane.insertBefore(card, next ?? null);
      }
      for (const { card, before } of moves) {
        card.getAnimations().forEach(animation => animation.cancel());
        if (!before) continue;
        const after = card.getBoundingClientRect();
        card.animate([
          { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px)` },
          { transform: 'none' },
        ], { duration: 260, easing: 'ease-out' });
      }
      for (const { key, usage } of resources) {
        const unit = key === 'vram' ? 'GB' : translate('核心', 'cores');
        usage.value = `${capacity[key] - frame.available[key]} / ${capacity[key]} ${unit}`;
      }
      queue.style.setProperty('--gpu-cursor', Math.max(0, tick) / (finish || 1) * 100 + '%');
      for (const { timing, elapsed } of rails) {
        const progress = Math.min(1, Math.max(0, (tick - timing.start) / (timing.end - timing.start)));
        elapsed.style.width = progress * 100 + '%';
      }
      decision.setAttribute('aria-live', playing ? 'off' : 'polite');
      const message = describeFrame(simulation, frame);
      if (decision.textContent !== message) decision.textContent = message;

      const notice = compare.checked && tick >= 0 && tick === divergence ? describeDivergence() : '';
      if (differenceMessage.textContent !== notice) differenceMessage.textContent = notice;
    }

    function describeDivergence() {
      const starts = policies.map(name => simulations[name].frames[tick]?.started ?? []);
      const decisions = policies.flatMap((name, index) => {
        const only = starts[index].filter(job => !starts[1 - index].includes(job));
        if (!only.length) return [];
        const names = only.map(jobName).join(translate('、', ', '));
        return [translate(`${policyName[name]} 此時啟動${names}。`, `${policyName[name]} starts ${names} at this tick.`)];
      });
      return translate('策略首次分歧。', 'First difference. ') + decisions.join(' ');
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function advance() {
      if (tick >= finish) return;
      tick += 1;
      if (tick >= finish || (compare.checked && tick === divergence)) stop();
      renderFrame(true);
    }

    play.addEventListener('click', () => {
      if (timer !== null) {
        stop();
      } else {
        if (tick >= finish) tick = -1;
        timer = setInterval(advance, 650);
      }
      renderFrame();
    });
    step.addEventListener('click', () => {
      stop();
      advance();
    });
    element('gpu-reset').addEventListener('click', () => {
      stop();
      tick = -1;
      renderFrame();
    });
    time.addEventListener('input', () => {
      stop();
      tick = Number(time.value);
      renderFrame();
    });
    for (const input of [policy, compare]) input.addEventListener('change', () => {
      stop();
      render();
    });
    for (const input of [vram, cpu]) input.addEventListener('change', configure);
    jobCount.addEventListener('input', configure);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden || timer === null) return;
      stop();
      renderFrame();
    });
    return render;
  }

  const renderDemos = [initializeVision(), initializePhotonics(), initializeGpuScheduler()];

  function updateThemeLabel() {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark
      ? translate('切換亮色模式', 'Switch to light mode')
      : translate('切換深色模式', 'Switch to dark mode'));
  }

  function applyLanguage() {
    document.documentElement.lang = translate('zh-Hant', 'en');
    document.title = translate(htmlTitle, 'Interactive technical showcase | Quantquer');
    languageButton.textContent = translate('English', '繁體中文');
    languageButton.lang = translate('en', 'zh-Hant');
    for (const { node, original, english } of translations) node.textContent = translate(original, english);
    for (const { node, original, english } of accessibleNames) node.setAttribute('aria-label', translate(original, english));
    for (const { node, original, english } of links) node.setAttribute('href', translate(original, english));
    updateThemeLabel();
    renderDemos.forEach(render => render());
  }

  languageButton.addEventListener('click', () => {
    const url = new URL(location.href);
    isEnglish = !isEnglish;
    if (isEnglish) {
      url.searchParams.set('lang', 'en');
    } else {
      url.searchParams.delete('lang');
    }
    history.replaceState(null, '', url);
    applyLanguage();
  });

  window.addEventListener('popstate', () => {
    isEnglish = queryLanguage();
    applyLanguage();
  });
  document.addEventListener('quantquer:themechange', updateThemeLabel);

  applyLanguage();
  languageButton.hidden = false;
  document.querySelectorAll('[data-showcase-widget]').forEach(widget => { widget.hidden = false; });
})();
