export function jobState(job, time) {
  if (time < job.submitted) return 'pending';
  if (time < job.started) return 'queued';
  if (time < job.finished) return 'running';
  return job.exitCode === 0 ? 'done' : 'failed';
}

export function latestAt(list, time) {
  return list.findLast(item => item.time <= time);
}

export function jobEvents(jobs) {
  return jobs.flatMap(job => [
    { time: job.submitted, id: job.id, state: 'queued' },
    { time: job.started, id: job.id, state: 'running' },
    { time: job.finished, id: job.id, state: job.exitCode === 0 ? 'done' : 'failed' },
  ]).sort((a, b) => a.time - b.time);
}

export function checkedTrace(data) {
  if (data.kind !== 'recorded-replay' || !data.jobs?.length || !data.samples?.length) throw new Error('Missing replay data');
  const duration = Math.max(...data.jobs.map(job => job.finished));
  const number = value => Number.isFinite(value) && value >= 0;
  const goodJobs = data.jobs.every(job => typeof job.id === 'string'
    && [job.submitted, job.started, job.finished, job.requestedMiB, job.peakMiB].every(number)
    && job.submitted <= job.started && job.started < job.finished && ['GPU', 'CPU'].includes(job.group));
  const goodSamples = data.samples.every((sample, index) => [sample.time, sample.usedMiB, sample.reservedMiB].every(number)
    && sample.time <= duration && (!index || sample.time > data.samples[index - 1].time));
  if (!goodJobs || !goodSamples) throw new Error('Invalid replay data');
  return { ...data, duration, events: jobEvents(data.jobs) };
}
