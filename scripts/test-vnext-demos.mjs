import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runReliability, summarizeReliability } from '../assets/vnext-demos/reliability-model.mjs';
import { runKnowledge } from '../assets/vnext-demos/knowledge-model.mjs';
import { compareWorkcells, touchesRectangle, workcellDxf } from '../assets/vnext-demos/workcell-model.mjs';
import { studioDemos, studioDemoRoutes } from '../data/studio-demos.mjs';

test('all three demos have stable localized route metadata and rendered defaults', async () => {
  assert.equal(new Set(studioDemoRoutes).size, 3);
  for (const demo of studioDemos) {
    assert.equal(demo.route, `/labs/demos/${demo.id}/`);
    const view = await import(`../assets/vnext-demos/${demo.id}-view.mjs`);
    for (const locale of ['zh', 'en']) {
      assert.ok(demo[locale].limits);
      assert.match(view.controls(locale), /<label for="demo-[-\w]+"/);
      assert.match(view.render(locale, view.defaults), /<table>/);
      assert.doesNotMatch(view.render(locale, view.defaults), /undefined|\bNaN\b/);
    }
  }
});

test('the same four procurement fixtures exercise correct decisions, repairs and escalation', () => {
  const expected = {
    routine: ['release', 'release', false], stale: ['release', 'hold', true],
    authorization: ['release', 'hold', true], unavailable: ['release', 'escalate', true],
  };
  for (const [scenario, [baseline, workflow, recovered]] of Object.entries(expected)) {
    const result = runReliability(scenario);
    assert.equal(result.baseline.output.action, baseline);
    assert.equal(result.workflow.output.action, workflow);
    assert.equal(result.recovered, recovered);
    assert.deepEqual(result.workflow.output, result.expected);
    assert.equal(result.workflow.verifiedChecks, result.workflow.checkCount);
    assert.equal(result.baseline.verifiedChecks, 0);
    assert.equal(result.workflow.stages.filter(stage => stage === 'verify').length, recovered ? 2 : 1);
  }
  assert.equal(runReliability('unavailable').workflow.output.citation, null);
  assert.throws(() => runReliability('__proto__'), /Unknown reliability scenario/);
  const metrics = summarizeReliability();
  assert.deepEqual([metrics.baseline.successes, metrics.workflow.successes], [1, 4]);
  assert.deepEqual([metrics.baseline.tokens, metrics.workflow.tokens], [640, 1336]);
  assert.deepEqual([metrics.baseline.estimatedUsd, metrics.workflow.estimatedUsd], [0.0016, 0.00334]);
});

test('arbitration checks current version, authority and applicability separately', () => {
  const standard = runKnowledge('standard');
  assert.deepEqual(standard.baseline, { kPa: 640, citation: 'M1 §4.2' });
  assert.deepEqual(standard.baselineCheck, { exact: true, applicable: true, current: false });
  assert.deepEqual(standard.arbitrated, { kPa: 550, citation: 'M2 §4.2' });
  assert.deepEqual(standard.arbitratedCheck, { exact: true, applicable: true, current: true });
  assert.equal(standard.reason, 'resolved');
  const highHeat = runKnowledge('highHeat');
  assert.deepEqual(highHeat.baseline, { kPa: 460, citation: 'E1 §2' });
  assert.deepEqual(highHeat.arbitrated, { kPa: 420, citation: 'M2 §4.3' });
  assert.equal(highHeat.conflicting, true);
  const unsupported = runKnowledge('unsupported');
  assert.equal(unsupported.arbitrated, null);
  assert.equal(unsupported.reason, 'uncovered');
  assert.equal(unsupported.baselineCheck.exact, true);
  assert.equal(unsupported.baselineCheck.applicable, false);
  assert.throws(() => runKnowledge('unlisted'), /Unknown knowledge query/);
});

test('rectangle boundary, contained, missed and degenerate segments are deterministic', () => {
  const box = { x: 1, y: 1, width: 1, height: 1 };
  assert.equal(touchesRectangle([0, 1], [2, 1], box), true);
  assert.equal(touchesRectangle([0, 1.5], [.9, 1.5], box), false);
  assert.equal(touchesRectangle([1.2, 1.2], [1.5, 1.5], box), true);
  assert.equal(touchesRectangle([3, 3], [3, 3], box), false);
  assert.equal(touchesRectangle([1.5, 1.5], [1.5, 1.5], box), true);
  assert.equal(touchesRectangle([2, 3], [2, 2], box), true);
});

test('workcell compares reach, payload, clearance and round trip timing before choosing a layout', () => {
  const standard = compareWorkcells('standard', 1);
  assert.equal(standard.results.direct.reachable, true);
  assert.equal(standard.results.direct.collisionFree, false);
  assert.equal(standard.results.direct.cycleSeconds, null);
  assert.equal(standard.results.bypass.feasible, true);
  assert.equal(standard.best, 'compact');
  assert.ok(Math.abs(standard.results.compact.cycleSeconds - 5.425) < 1e-9);
  const light = compareWorkcells('compact', 1);
  assert.equal(light.results.bypass.reachable, false);
  assert.equal(light.results.bypass.collisionFree, true);
  assert.equal(compareWorkcells('compact', 4).best, null);
  assert.equal(compareWorkcells('extended', 6).best, 'compact');
  assert.throws(() => compareWorkcells('extended', -1), /Invalid workcell inputs/);
  const report = workcellDxf('standard', 'bypass');
  assert.equal(report, workcellDxf('standard', 'bypass'));
  assert.match(report, /\$ACADVER\n1\nAC1009/);
  assert.match(report, /\nCIRCLE\n8\nREACH\n/);
  assert.equal((report.match(/\nLINE\n8\nROUTE\n/g) ?? []).length, 3);
  assert.match(report, /0\nENDSEC\n0\nEOF\n$/);
});
