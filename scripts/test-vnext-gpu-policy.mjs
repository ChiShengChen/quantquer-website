import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateGpuPolicy, syntheticCapacity, syntheticJobs } from '../assets/evidence/gpu/policy-model.mjs';

const expected = {
  fifo: { starts: ['A:0', 'B:0', 'C:12', 'D:12', 'E:15', 'F:22', 'G:22'], makespan: 28, totalWait: 72 },
  priority: { starts: ['B:0', 'D:0', 'A:3', 'E:8', 'G:13', 'F:15', 'C:21'], makespan: 31, totalWait: 49 },
  memory: { starts: ['C:0', 'E:0', 'D:5', 'A:10', 'B:10', 'G:18', 'F:22'], makespan: 28, totalWait: 54 },
  shortest: { starts: ['D:0', 'E:0', 'B:3', 'F:5', 'G:11', 'A:11', 'C:23'], makespan: 33, totalWait: 42 },
  workload: { starts: ['E:0', 'A:0', 'B:5', 'F:12', 'D:13', 'G:16', 'C:20'], makespan: 30, totalWait: 55 },
};

for (const [policy, result] of Object.entries(expected)) {
  test(policy + ' reproduces fixture dispatches and checks resource limits', () => {
    const { dispatches, summary } = simulateGpuPolicy(policy);
    assert.deepEqual(dispatches.map(job => job.id + ':' + job.started), result.starts);
    assert.equal(summary.makespan, result.makespan);
    assert.equal(summary.meanWait, result.totalWait / syntheticJobs.length);
    assert.equal(summary.jobsPerMinute, syntheticJobs.length * 60 / result.makespan);
    assert.equal(summary.peakMemoryMiB, syntheticCapacity.memoryMiB);
    assert.equal(summary.peakSlots, syntheticCapacity.slots);

    const seen = [];
    for (const job of dispatches) {
      assert.ok(job.started >= job.submitted);
      assert.equal(job.finished - job.started, job.duration);
      const stillRunning = seen.filter(previous => previous.finished > job.started);
      const count = stillRunning.length + 1;
      const reserved = stillRunning.reduce((sum, active) => sum + active.memoryMiB, job.memoryMiB);
      assert.equal(job.activeAfterStart, count);
      assert.equal(job.reservedAfterStartMiB, reserved);
      assert.ok(count <= syntheticCapacity.slots);
      assert.ok(reserved <= syntheticCapacity.memoryMiB);
      seen.push(job);
    }
  });
}

const job = (id, submitted, duration, memoryMiB) => ({
  id, submitted, duration, memoryMiB, priority: 0, workload: 'batch',
});

test('FIFO retains a blocked queue head and releases resources at the finish instant', () => {
  const jobs = [job('A', 0, 5, 4), job('B', 1, 2, 5), job('C', 1, 1, 1)];
  const capacity = { memoryMiB: 5, slots: 2 };
  const fifo = simulateGpuPolicy('fifo', jobs, capacity).dispatches;
  const memory = simulateGpuPolicy('memory', jobs, capacity).dispatches;
  assert.deepEqual(fifo.map(job => [job.id, job.started]), [['A', 0], ['B', 5], ['C', 7]]);
  assert.deepEqual(memory.map(job => [job.id, job.started]), [['A', 0], ['C', 1], ['B', 5]]);
});

test('ties preserve arrival time and input order, and throughput excludes idle time before the workload', () => {
  const jobs = [job('C', 7, 1, 1), job('B', 6, 1, 1), job('A', 6, 1, 1)];
  const { dispatches, summary } = simulateGpuPolicy('priority', jobs, { memoryMiB: 1, slots: 1 });
  assert.deepEqual(dispatches.map(job => [job.id, job.started]), [['B', 6], ['A', 7], ['C', 8]]);
  assert.equal(summary.makespan, 3);
  assert.equal(summary.jobsPerMinute, 60);
});

test('empty and invalid synthetic workloads are handled explicitly', () => {
  assert.deepEqual(simulateGpuPolicy('fifo', []).dispatches, []);
  assert.throws(() => simulateGpuPolicy('random'), /Unknown scheduling policy/);
  assert.throws(() => simulateGpuPolicy('fifo', [], { memoryMiB: 1, slots: 0 }), /capacity and slots/);
  assert.throws(() => simulateGpuPolicy('fifo', [job('oversize', 0, 1, 9000)]), /Invalid fixture job/);
  assert.throws(() => simulateGpuPolicy('fifo', [job('zero', 0, 0, 1)]), /Invalid fixture job/);
  const duplicate = job('A', 0, 1, 1);
  assert.throws(() => simulateGpuPolicy('fifo', [duplicate, duplicate]), /unique/);
});
