// This synthetic fixture uses arbitrary fixed durations and GPU memory requests.
export const syntheticCapacity = Object.freeze({ memoryMiB: 8192, slots: 2 });
export const syntheticJobs = Object.freeze([
  { id: 'A', workload: 'batch', submitted: 0, duration: 12, memoryMiB: 5120, priority: 2 },
  { id: 'B', workload: 'batch', submitted: 0, duration: 8, memoryMiB: 3072, priority: 5 },
  { id: 'C', workload: 'batch', submitted: 0, duration: 10, memoryMiB: 6144, priority: 1 },
  { id: 'D', workload: 'batch', submitted: 0, duration: 3, memoryMiB: 1024, priority: 3 },
  { id: 'E', workload: 'interactive', submitted: 0, duration: 5, memoryMiB: 2048, priority: 2 },
  { id: 'F', workload: 'interactive', submitted: 4, duration: 6, memoryMiB: 4096, priority: 3 },
  { id: 'G', workload: 'batch', submitted: 7, duration: 4, memoryMiB: 3072, priority: 2 },
].map(Object.freeze));

const comparators = {
  fifo: () => 0,
  priority: (a, b) => b.priority - a.priority,
  memory: (a, b) => b.memoryMiB - a.memoryMiB,
  shortest: (a, b) => a.duration - b.duration,
  workload: (a, b) => Number(b.workload === 'interactive') - Number(a.workload === 'interactive'),
};

function summarize(dispatches) {
  if (!dispatches.length) {
    return { makespan: 0, meanWait: 0, jobsPerMinute: 0, peakMemoryMiB: 0, peakSlots: 0 };
  }
  const makespan = Math.max(...dispatches.map(job => job.finished)) - dispatches[0].submitted;
  const totalWait = dispatches.reduce((sum, job) => sum + job.started - job.submitted, 0);
  return {
    makespan,
    meanWait: totalWait / dispatches.length,
    jobsPerMinute: dispatches.length * 60 / makespan,
    peakMemoryMiB: Math.max(...dispatches.map(job => job.reservedAfterStartMiB)),
    peakSlots: Math.max(...dispatches.map(job => job.activeAfterStart)),
  };
}

export function simulateGpuPolicy(policy, jobs = syntheticJobs, capacity = syntheticCapacity) {
  if (!Object.hasOwn(comparators, policy)) throw new RangeError('Unknown scheduling policy');
  if (![capacity.memoryMiB, capacity.slots].every(value => Number.isSafeInteger(value) && value > 0)) {
    throw new RangeError('GPU capacity and slots must be positive integers');
  }
  const ids = new Set();
  const arrivals = jobs.map((job, order) => {
    if (typeof job.id !== 'string' || !job.id.trim() || ids.has(job.id)) {
      throw new RangeError('Job IDs must be nonempty and unique');
    }
    if (!Number.isFinite(job.submitted) || job.submitted < 0
      || !Number.isFinite(job.duration) || job.duration <= 0
      || !Number.isSafeInteger(job.memoryMiB) || job.memoryMiB < 1 || job.memoryMiB > capacity.memoryMiB
      || !Number.isFinite(job.priority) || !['interactive', 'batch'].includes(job.workload)) {
      throw new RangeError('Invalid fixture job: ' + job.id);
    }
    ids.add(job.id);
    return { ...job, order };
  }).sort((a, b) => a.submitted - b.submitted || a.order - b.order);

  let cursor = 0;
  let time = arrivals[0]?.submitted ?? 0;
  let running = [];
  const waiting = [];
  const dispatches = [];
  while (dispatches.length < arrivals.length) {
    running = running.filter(job => job.finished > time);
    while (cursor < arrivals.length && arrivals[cursor].submitted <= time) {
      waiting.push(arrivals[cursor++]);
    }
    let reserved = running.reduce((sum, job) => sum + job.memoryMiB, 0);
    while (waiting.length && running.length < capacity.slots) {
      const fits = job => job.memoryMiB <= capacity.memoryMiB - reserved;
      const available = policy === 'fifo' ? waiting.slice(0, 1).filter(fits) : waiting.filter(fits);
      const next = available.sort(
        (a, b) => comparators[policy](a, b) || a.submitted - b.submitted || a.order - b.order
      )[0];
      if (!next) break;

      waiting.splice(waiting.indexOf(next), 1);
      const { order, ...job } = next;
      reserved += job.memoryMiB;
      const dispatch = {
        ...job,
        started: time,
        finished: time + job.duration,
        reservedAfterStartMiB: reserved,
        activeAfterStart: running.length + 1,
      };
      running.push(dispatch);
      dispatches.push(dispatch);
    }
    time = Math.min(arrivals[cursor]?.submitted ?? Infinity, ...running.map(job => job.finished));
  }
  return { dispatches, summary: summarize(dispatches) };
}
