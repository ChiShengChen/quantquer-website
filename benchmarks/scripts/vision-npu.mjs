import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const help = `Validate a prepared target-device inpainting capture

  node benchmarks/scripts/vision-npu.mjs /path/capture.json /path/runtime-placement.log

Required capture fields
  date                              ISO YYYY-MM-DD date of the actual run
  hardware.device, .soc, .accelerator  Device, SoC and NPU identifiers
  os                                Operating system and version
  runtime.name, .version, .provider  Named runtime and selected execution provider
  model.name, .sha256, .precision     Executed artifact; precision: fp32, fp16, int8 or mixed
  fixture.sha256, .width, .height    Pinned image, mask and reference package and resolution
  measurement.scope                 model-only or prepared-input-to-rgb
  measurement.batch, .warmups       Positive batch size and integer warm-up count
  measurement.samplesMs             Array of measured latencies in milliseconds
  measurement.peakMemoryMiB         Captured peak in MiB, or null if unavailable
  measurement.memoryScope          Device, process, shared or explanation for null
  quality.maskedPsnrDb, .referenceSha256
                                    Matched masked PSNR and clean-reference fingerprint
  placement.npu, .cpu, .gpu, .unknown
                                    Operator counts from the actual runtime report
  placement.sha256                  SHA-256 of the accompanying report bytes

Run the benchmark and export placement with the device vendor's runtime first.
This utility checks the structure and report digest, recalculates percentiles, and
labels known CPU/GPU fallback separately. It cannot authenticate a profiler report
or confirm the measurements. Review device setup, node placement and disclosure
permission before recording the result in the public catalog. No sample NPU
measurements are shipped. Requires Node.js 18 or newer.
`;

const positive = value => Number.isFinite(value) && value > 0;
const count = value => Number.isSafeInteger(value) && value >= 0;
const digest = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const label = value => typeof value === 'string' && value.trim().length > 0;

function requireField(condition, field) {
  if (!condition) throw new TypeError(`Invalid or missing ${field}`);
}

function percentile(sorted, fraction) {
  const rank = (sorted.length - 1) * fraction;
  const lower = Math.floor(rank);
  return sorted[lower] + (sorted[Math.ceil(rank)] - sorted[lower]) * (rank - lower);
}

const rounded = value => Number(value.toFixed(3));

export function summarizeNpuCapture(capture, placementBytes) {
  const { date, hardware, os, runtime, model, fixture, measurement, quality, placement } = capture ?? {};
  const day = new Date(`${date}T00:00:00Z`);
  requireField(/^\d{4}-\d\d-\d\d$/.test(date) && Number.isFinite(day.valueOf()) && day.toISOString().startsWith(date), 'date');
  requireField([hardware?.device, hardware?.soc, hardware?.accelerator].every(label), 'hardware identifiers');
  requireField(label(os), 'OS version');
  requireField([runtime?.name, runtime?.version, runtime?.provider].every(label), 'runtime and provider');
  const provider = runtime.provider.replace(/[^a-z\d]/gi, '');
  requireField(!/^(?:cpu(?:only|executionprovider)?|(?:cuda|gpu|tensorrt)(?:executionprovider)?)$/i.test(provider), 'NPU-capable runtime provider');
  requireField(label(model?.name) && digest(model?.sha256) && ['fp32', 'fp16', 'int8', 'mixed'].includes(model?.precision), 'model artifact and precision');
  requireField(digest(fixture?.sha256) && [fixture?.width, fixture?.height].every(value => count(value) && value > 0), 'fixture fingerprint and dimensions');
  requireField(['model-only', 'prepared-input-to-rgb'].includes(measurement?.scope), 'measurement interval');
  requireField(count(measurement?.batch) && measurement.batch > 0 && count(measurement?.warmups), 'batch and warm-up counts');
  requireField(Array.isArray(measurement?.samplesMs) && measurement.samplesMs.length > 0 && measurement.samplesMs.every(positive), 'positive measured latency samples');
  requireField((measurement?.peakMemoryMiB === null || positive(measurement?.peakMemoryMiB)) && label(measurement?.memoryScope), 'peak memory and scope');
  requireField(Number.isFinite(quality?.maskedPsnrDb) && quality.maskedPsnrDb >= 0 && digest(quality?.referenceSha256), 'masked PSNR and reference fingerprint');
  const nodes = [placement?.npu, placement?.cpu, placement?.gpu, placement?.unknown];
  requireField(nodes.every(count) && placement.npu > 0 && placement.unknown === 0, 'resolved placement counts with NPU execution');
  requireField(placementBytes instanceof Uint8Array && placementBytes.length > 0 && digest(placement?.sha256), 'runtime placement report');
  const reportDigest = createHash('sha256').update(placementBytes).digest('hex');
  requireField(reportDigest === placement.sha256.toLowerCase(), 'runtime placement report SHA-256');

  const samples = [...measurement.samplesMs].sort((a, b) => a - b);
  return {
    status: 'prepared-capture-awaiting-review',
    execution: placement.cpu || placement.gpu ? 'hybrid-with-npu' : 'npu-operator-placement',
    date,
    hardware: { device: hardware.device, soc: hardware.soc, accelerator: hardware.accelerator },
    os,
    runtime: { name: runtime.name, version: runtime.version, provider: runtime.provider },
    model: { name: model.name, sha256: model.sha256.toLowerCase(), precision: model.precision },
    fixture: { sha256: fixture.sha256.toLowerCase(), width: fixture.width, height: fixture.height },
    measurement: {
      scope: measurement.scope, batch: measurement.batch, warmups: measurement.warmups, sampleCount: samples.length,
      p50Ms: rounded(percentile(samples, 0.5)), p95Ms: samples.length > 1 ? rounded(percentile(samples, 0.95)) : null,
      peakMemoryMiB: measurement.peakMemoryMiB, memoryScope: measurement.memoryScope,
    },
    quality: { maskedPsnrDb: quality.maskedPsnrDb, referenceSha256: quality.referenceSha256.toLowerCase() },
    placement: { npu: placement.npu, cpu: placement.cpu, gpu: placement.gpu, unknown: placement.unknown, sha256: reportDigest },
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(help);
    return;
  }
  if (args.length !== 2) throw new Error('Supply a capture JSON and runtime placement report. Run with --help for the format.');
  const [json, reportBytes] = await Promise.all([readFile(args[0], 'utf8'), readFile(args[1])]);
  console.log(JSON.stringify(summarizeNpuCapture(JSON.parse(json), reportBytes), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
