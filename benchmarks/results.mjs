import { readFileSync } from 'node:fs';
import { makeInput, simulateMesh } from '../assets/evidence/photonics/model.mjs';

export const artifacts = {
  vision: '/assets/evidence/vision/benchmark.json',
  gpu: '/assets/evidence/gpu/trace.json',
  photonics: '/benchmarks/results/photonic-fixture.json',
  research: '/assets/evidence/research/quote-gate.json',
};

const readJson = path => JSON.parse(readFileSync(new URL('..' + path, import.meta.url), 'utf8'));
export const vision = readJson(artifacts.vision);
export const gpu = readJson(artifacts.gpu);
export const quoteGate = readJson(artifacts.research);

export const round = (value, decimalPlaces = 3) => Number(value.toFixed(decimalPlaces));
const metric = (id, value, unit, group) => ({ id, value, unit, ...(group ? { group } : {}) });

export const visionRows = Object.entries(vision.scenes).flatMap(([scene, values]) =>
  ['migan', 'telea'].map(method => ({ scene, method, ...values[method] }))
);
export const gpuRows = gpu.jobs.map(job => ({
  ...job,
  queueWait: round(job.started - job.submitted),
  runDuration: round(job.finished - job.started),
}));

const config = { mode: '1', inputPowerPercent: 100, fault: { cell: '2-23', phaseDelta: 35, powerLoss: 20 } };
const mesh = simulateMesh(makeInput(config.mode, config.inputPowerPercent), config.fault);
export const photonicFixture = {
  experimentType: 'four-mode-reference-mesh',
  evidenceType: 'simulated',
  config,
  result: {
    idealPortPowers: mesh.ideal.history.at(-1),
    faultedPortPowers: mesh.current.history.at(-1),
    inputPower: mesh.inputPower,
    faultedOutputPower: mesh.outputPower,
    relativeOutputError: mesh.relativeError,
    relativePowerLoss: mesh.powerLoss,
  },
};

export const resultIndex = [
  {
    id: 'vision-cpu-inpainting',
    project: 'on-device-generative-vision',
    experimentType: 'masked-image-inpainting',
    evidenceType: 'measured',
    hardware: { processor: vision.device, accelerator: 'CPU only' },
    software: { runtime: 'ONNX Runtime ' + vision.onnxRuntime, provider: vision.provider, baseline: 'OpenCV ' + vision.openCV + ' Telea' },
    dataset: 'Two public-domain photographs with an illustrated foreground mask and unoccluded ground truth.',
    config: {
      resolution: vision.inputSize,
      modelTensorSize: vision.modelTensorSize,
      model: vision.model.name,
      modelBytes: vision.model.sizeBytes,
      modelSha256: vision.model.sha256,
      modelSource: vision.model.source,
      inputAndOutputDtype: 'uint8 RGB',
      precisionScope: 'Pinned published ONNX graph with its original operators; precision variants were not evaluated.',
      batchSize: vision.batchSize,
      threads: vision.threads,
      warmupsPerSceneAndMethod: vision.warmups,
      measuredRunsPerSceneAndMethod: vision.runs,
      timing: vision.timingScope,
    },
    metrics: visionRows.flatMap(({ scene, method, medianMs, p95Ms, psnrDb }) => [
      metric('latency-p50', medianMs, 'ms', [scene, method]),
      metric('latency-p95', p95Ms, 'ms', [scene, method]),
      metric('masked-psnr', psnrDb, 'dB', [scene, method]),
    ]),
    rawArtifactPath: artifacts.vision,
    reproducibilityCommand: 'python scripts/reproduce-vision.py --cache /tmp/quantquer-models --output /tmp/quantquer-vision',
    limitations: [
      'Two still images with prepared masks. No automatic person segmentation, Diffusion, scene generation, or video evaluation.',
      'Device NPU/GPU inference, peak memory, power and OS version were not recorded in this benchmark.',
      'PSNR is evaluated within the mask and can favor different methods across these two fixtures.',
    ],
    timestamp: vision.date,
    timestampMeaning: 'recorded run date',
  },
  {
    id: 'gpu-controlled-three-jobs',
    project: 'gpu-orchestration',
    experimentType: 'job-admission-and-process-memory',
    evidenceType: 'replayed',
    hardware: { accelerator: 'Single 24 GiB GPU workstation' },
    software: { instrumentation: 'Scheduler events and sampled process VRAM' },
    dataset: 'Two synthetic CUDA jobs and one CPU-only job.',
    config: { gpuSlots: gpu.gpuSlots, executionSlots: gpu.executionSlots, allocationMiBPerCudaFixture: gpu.allocationMiB },
    metrics: gpuRows.flatMap(job => [
      metric('queue-wait', job.queueWait, 's', [job.id]),
      metric('run-duration', job.runDuration, 's', [job.id]),
      metric('requested-vram', job.requestedMiB, 'MiB', [job.id]),
      metric('sampled-peak-process-vram', job.peakMiB, 'MiB', [job.id]),
      metric('exit-code', job.exitCode, 'code', [job.id]),
    ]),
    rawArtifactPath: artifacts.gpu,
    reproducibilityCommand: 'node --test scripts/test-vnext-labs.mjs',
    limitations: [
      'The public trace replays a prior controlled hardware run. The original scheduler runtime is outside the public replay package.',
      'VRAM samples cover test processes and include CUDA context. They do not establish device-wide utilization or continuous peaks.',
      'The run checks job order and overlap. Production throughput, multi-GPU scaling and cross-machine timing were not measured.',
    ],
    timestamp: gpu.date,
    timestampMeaning: 'recorded run date',
  },
  {
    id: 'photonics-four-mode-fault',
    project: 'photonic-computing-simulation',
    experimentType: 'four-mode-reference-mesh',
    evidenceType: 'simulated',
    software: { model: '/assets/evidence/photonics/model.mjs', execution: 'JavaScript complex-amplitude propagation' },
    dataset: 'A normalized reference mesh fixture with one configured MZI fault.',
    config,
    metrics: [
      metric('relative-power-loss', round(mesh.powerLoss * 100, 6), '%'),
      metric('relative-output-error', round(mesh.relativeError * 100, 6), '%'),
      ...mesh.current.history.at(-1).map((value, index) => metric('faulted-normalized-port-power', round(value, 9), 'ratio', ['port ' + (index + 1)])),
    ],
    rawArtifactPath: artifacts.photonics,
    reproducibilityCommand: 'node --test scripts/test-photonic-mesh.mjs && node scripts/build-vnext-labs.mjs',
    limitations: [
      'Ideal 50:50 couplers, fixed phases and a modeled single-cell fault.',
      'No calibrated chip measurements, fabrication process parameters, drift or detector noise.',
    ],
    timestamp: '2026-11-27',
    timestampMeaning: 'fixture report date',
  },
  {
    id: 'research-quote-gate-four-fixtures',
    project: 'paper-evidence',
    experimentType: 'deterministic-quote-and-number-verification',
    evidenceType: 'replayed',
    gitCommit: quoteGate.commit,
    software: { repository: quoteGate.repository, core: 'Pinned public Python quote gate' },
    dataset: 'Four synthetic quote and number test cases.',
    config: { numberWindowCharacters: quoteGate.numberWindow, fuzzyAllowed: quoteGate.fuzzyAllowed },
    metrics: [
      metric('fixtures-passed', quoteGate.cases.filter(item => item.passed).length, 'cases'),
      metric('fixtures-blocked', quoteGate.cases.filter(item => !item.passed).length, 'cases'),
    ],
    rawArtifactPath: artifacts.research,
    reproducibilityCommand: 'python scripts/reproduce-research-evidence.py /path/to/paper-evidence --check',
    limitations: [
      'Deterministic synthetic fixture outcomes, not overall research accuracy or an LLM performance benchmark.',
      'The replay does not score claim truth or whether a publication supports an interpretation.',
    ],
    timestamp: '2026-11-27',
    timestampMeaning: 'fixture report date',
  },
];
