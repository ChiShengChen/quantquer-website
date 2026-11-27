// Four modes, alternating disjoint nearest-neighbor cells. All phases are degrees.
export const meshStages = [
  [{ id: '1-12', ports: [0, 1], phase: 55 }, { id: '1-34', ports: [2, 3], phase: 120 }],
  [{ id: '2-23', ports: [1, 2], phase: 85 }],
  [{ id: '3-12', ports: [0, 1], phase: 35 }, { id: '3-34', ports: [2, 3], phase: 145 }],
  [{ id: '4-23', ports: [1, 2], phase: 70 }],
];

const modes = {
  '1': [0],
  '2': [1],
  '3': [2],
  '4': [3],
  coherent: [0, 3],
};
const rad = Math.PI / 180;
const splitScale = Math.SQRT1_2;

function within(value, minimum, maximum, name) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(name + ' is outside the model domain');
  }
}

function rotate([real, imaginary], phase, gain) {
  const cosine = Math.cos(phase * rad) * gain;
  const sine = Math.sin(phase * rad) * gain;
  return [real * cosine - imaginary * sine, real * sine + imaginary * cosine];
}

export function makeInput(mode, powerPercent, phaseDegrees = 0) {
  const ports = modes[mode];
  if (!Array.isArray(ports)) throw new RangeError('Unknown input mode');
  within(powerPercent, 0, 100, 'Input power');
  within(phaseDegrees, -180, 180, 'Relative input phase');
  const state = Array.from({ length: 4 }, () => [0, 0]);
  const amplitude = Math.sqrt(powerPercent / 100 / ports.length);
  state[ports[0]] = [amplitude, 0];
  if (ports.length > 1) state[ports[1]] = rotate([amplitude, 0], phaseDegrees, 1);
  return state;
}

// B = (1/sqrt(2)) [[1, i], [i, 1]].
function couple([ar, ai], [br, bi]) {
  return [
    [(ar - bi) * splitScale, (ai + br) * splitScale],
    [(br - ai) * splitScale, (bi + ar) * splitScale],
  ];
}

const intensities = state => state.map(([real, imaginary]) => real ** 2 + imaginary ** 2);
const sum = values => values.reduce((total, value) => total + value, 0);

function propagate(input, fault) {
  let state = input;
  const history = [intensities(state)];
  for (const cells of meshStages) {
    const next = state.slice();
    for (const cell of cells) {
      const [first, second] = cell.ports;
      const [upper, lower] = couple(state[first], state[second]);
      const localFault = fault?.cell === cell.id ? fault : null;
      const phase = cell.phase + (localFault?.phaseDelta ?? 0);
      const gain = Math.sqrt(1 - (localFault?.powerLoss ?? 0) / 100);
      [next[first], next[second]] = couple(rotate(upper, phase, gain), lower);
    }
    state = next;
    history.push(intensities(state));
  }
  return { state, history };
}

export function simulateMesh(input, fault = null) {
  if (!Array.isArray(input) || input.length !== 4 || input.some(mode =>
    !Array.isArray(mode) || mode.length !== 2 || !mode.every(Number.isFinite)
  )) throw new RangeError('Expected four finite complex amplitudes');
  const inputPower = sum(intensities(input));
  within(inputPower, 0, 1 + 8 * Number.EPSILON, 'Normalized input power');

  if (fault) {
    if (!meshStages.flat().some(cell => cell.id === fault.cell)) throw new RangeError('Unknown fault cell');
    within(fault.phaseDelta, -180, 180, 'Fault phase');
    within(fault.powerLoss, 0, 100, 'Fault power loss');
  }

  const ideal = propagate(input, null);
  const current = fault ? propagate(input, fault) : ideal;
  const reference = ideal.history.at(-1);
  const output = current.history.at(-1);
  const idealNorm = Math.hypot(...reference);
  const difference = output.map((power, port) => power - reference[port]);
  const outputPower = sum(output);

  return {
    ideal,
    current,
    inputPower,
    outputPower,
    relativeError: idealNorm ? Math.hypot(...difference) / idealNorm : null,
    powerLoss: inputPower ? Math.max(0, (inputPower - outputPower) / inputPower) : null,
  };
}
