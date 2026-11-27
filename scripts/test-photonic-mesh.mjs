import test from 'node:test';
import assert from 'node:assert/strict';
import { makeInput, meshStages, simulateMesh } from '../assets/evidence/photonics/model.mjs';

const tolerance = 1e-12;
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < tolerance, actual + ' differs from ' + expected);
}
const total = intensities => intensities.reduce((sum, power) => sum + power, 0);
const idealInput = () => makeInput('1', 100);
const defaultFault = { cell: '2-23', phaseDelta: 35, powerLoss: 20 };

test('zero input propagates zero and omits the undefined relative metrics', () => {
  const result = simulateMesh(makeInput('coherent', 0, 180), defaultFault);
  assert.ok(result.current.history.every(powers => powers.every(power => power === 0)));
  assert.equal(result.relativeError, null);
  assert.equal(result.powerLoss, null);
});

test('first lossless cell agrees with the single-input analytic formula', () => {
  const result = simulateMesh(idealInput());
  const powers = result.current.history[1];
  close(powers[0], (1 - Math.cos(55 * Math.PI / 180)) / 2);
  close(powers[1], (1 + Math.cos(55 * Math.PI / 180)) / 2);
  close(powers[2], 0);
  close(powers[3], 0);
});

test('zero-magnitude faults reproduce the ideal values', () => {
  for (const { id } of meshStages.flat()) {
    const result = simulateMesh(idealInput(), { cell: id, phaseDelta: 0, powerLoss: 0 });
    assert.deepEqual(result.current.history, result.ideal.history);
    assert.equal(result.relativeError, 0);
    close(result.powerLoss, 0);
  }
});

test('phase fault changes propagation starting at the selected stage', () => {
  const result = simulateMesh(idealInput(), { ...defaultFault, powerLoss: 0 });
  assert.deepEqual(result.current.history.slice(0,2), result.ideal.history.slice(0,2));
  assert.notDeepEqual(result.current.history[2], result.ideal.history[2]);
  assert.ok(result.relativeError > 0);
  close(result.outputPower, 1);
  close(result.powerLoss, 0);
});

test('upper-arm attenuation removes the expected power at the fault', () => {
  for (const powerLoss of [0, 50, 100]) {
    const result = simulateMesh(idealInput(), { cell: '1-12', phaseDelta: 0, powerLoss });
    close(result.outputPower, 1 - powerLoss / 200);
    close(result.powerLoss, powerLoss / 200);
    result.current.history.slice(1).forEach(powers => close(total(powers), result.outputPower));
  }
});

test('lossless propagation conserves power for single and coherent input modes', () => {
  for (const mode of ['1','2','3','4','coherent']) {
    for (const power of [0.01, 7.5, 100]) {
      for (const phase of [-180, -90, 0, 42, 180]) {
        const result = simulateMesh(makeInput(mode, power, phase));
        result.current.history.forEach(powers => close(total(powers), power / 100));
      }
    }
  }
});

test('fault parameter extremes stay finite, non-negative and passive', () => {
  for (const { id } of meshStages.flat()) {
    for (const phaseDelta of [-180, 180]) {
      for (const powerLoss of [0, 100]) {
        const result = simulateMesh(makeInput('coherent', 100, phaseDelta), { cell: id, phaseDelta, powerLoss });
        result.current.history.forEach(powers => {
          assert.ok(powers.every(power => Number.isFinite(power) && power >= 0));
          assert.ok(total(powers) <= 1 + tolerance);
        });
        assert.ok(Number.isFinite(result.relativeError));
      }
    }
  }
});

test('coherent inputs respond to relative phase', () => {
  const first = simulateMesh(makeInput('coherent', 100, 0));
  const second = simulateMesh(makeInput('coherent', 100, 90));
  assert.ok(first.current.history.at(-1).some((power, port) =>
    Math.abs(power - second.current.history.at(-1)[port]) > 0.05
  ));
});

test('four-stage port powers match an independent complex-matrix regression fixture', () => {
  // Generated with built-in Python complex arithmetic and explicit B matrix dot products.
  const ideal = [0.23869095074860022, 0.05431810567580843, 0.668318356607256, 0.03867258696833421];
  const current = [0.33134992496607185, 0.031395394954066236, 0.5424692224624996, 0.016106635799808873];
  const result = simulateMesh(idealInput(), defaultFault);
  ideal.forEach((power, port) => close(result.ideal.history.at(-1)[port], power));
  current.forEach((power, port) => close(result.current.history.at(-1)[port], power));
});

test('invalid and out-of-domain inputs fail explicitly', () => {
  assert.throws(() => makeInput('invalid', 100), RangeError);
  assert.throws(() => makeInput('1', 110), RangeError);
  assert.throws(() => makeInput('1', 100, NaN), RangeError);
  assert.throws(() => simulateMesh([[100, 0], [0, 0], [0, 0], [0, 0]]), RangeError);
  assert.throws(() => simulateMesh(idealInput(), { ...defaultFault, cell: 'unknown' }), RangeError);
  assert.throws(() => simulateMesh(idealInput(), { ...defaultFault, powerLoss: -1 }), RangeError);
});
