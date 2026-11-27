const currentPolicy = { id: 'PUR-03', limit: 50_000 };
const oldPolicy = { id: 'PUR-02', limit: 75_000 };
const gold = {
  routine: { total: 32_000, action: 'release', citation: 'PUR-03', reviewRecorded: false, supplierApproved: true },
  stale: { total: 64_000, action: 'hold', citation: 'PUR-03', reviewRecorded: false, supplierApproved: true },
  authorization: { total: 33_000, action: 'hold', citation: 'PUR-03', reviewRecorded: true, supplierApproved: false },
  unavailable: { total: 24_000, action: 'escalate', citation: null, reviewRecorded: false, supplierApproved: true },
};

export const reliabilityCases = {
  routine: { quantity: 4, unitCents: 8_000, supplierApproved: true, reviewRequired: false,
    supervisorApproved: false, policy: currentPolicy, retrievedPolicy: currentPolicy },
  stale: { quantity: 8, unitCents: 8_000, supplierApproved: true, reviewRequired: false,
    supervisorApproved: false, policy: currentPolicy, retrievedPolicy: oldPolicy },
  authorization: { quantity: 3, unitCents: 11_000, supplierApproved: false, reviewRequired: true,
    supervisorApproved: false, policy: currentPolicy, retrievedPolicy: currentPolicy },
  unavailable: { quantity: 2, unitCents: 12_000, supplierApproved: true, reviewRequired: false,
    supervisorApproved: false, policy: null, retrievedPolicy: oldPolicy },
};

export const reliabilityCostPerMillion = 2.5;

// Fixed synthetic accounting units for each simulated stage. No model calls run here.
const stageBudget = {
  draft: { tokens: 160, latencyMs: 320 },
  verify: { tokens: 48, latencyMs: 110 },
  repair: { tokens: 72, latencyMs: 165 },
  report: { tokens: 36, latencyMs: 80 },
};

function proposedOutput(fixture) {
  const total = fixture.quantity * fixture.unitCents;
  return {
    total,
    action: total <= fixture.retrievedPolicy.limit ? 'release' : 'hold',
    citation: fixture.retrievedPolicy.id,
    reviewRecorded: false,
    supplierApproved: fixture.supplierApproved,
  };
}

function validatedOutput(fixture, total) {
  const holds = fixture.policy && (
    total > fixture.policy.limit || !fixture.supplierApproved
    || (fixture.reviewRequired && !fixture.supervisorApproved)
  );
  return {
    total,
    action: !fixture.policy ? 'escalate' : holds ? 'hold' : 'release',
    citation: fixture.policy?.id ?? null,
    reviewRecorded: fixture.reviewRequired,
    supplierApproved: fixture.supplierApproved,
  };
}

function constraints(output, expected) {
  return {
    amount: output.total === expected.total,
    decision: output.action === expected.action,
    evidence: output.citation === expected.citation,
    review: output.reviewRecorded === expected.reviewRecorded,
    supplier: output.supplierApproved === expected.supplierApproved,
  };
}

function summarize(output, checks, stages, verifiedChecks) {
  const tokens = stages.reduce((sum, stage) => sum + stageBudget[stage].tokens, 0);
  const latencyMs = stages.reduce((sum, stage) => sum + stageBudget[stage].latencyMs, 0);
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    output, checks, stages, verifiedChecks, tokens, latencyMs,
    success: Object.values(checks).every(Boolean),
    passed, checkCount: Object.keys(checks).length,
    estimatedUsd: tokens * reliabilityCostPerMillion / 1_000_000,
  };
}

export function runReliability(scenario) {
  const fixture = Object.hasOwn(reliabilityCases, scenario) && reliabilityCases[scenario];
  if (!fixture) throw new RangeError('Unknown reliability scenario');
  const expected = gold[scenario];
  const draft = proposedOutput(fixture);
  const baseline = summarize(draft, constraints(draft, expected), ['draft'], 0);
  const verifiedPolicy = validatedOutput(fixture, fixture.quantity * fixture.unitCents);
  const recovered = Object.values(constraints(draft, verifiedPolicy)).some(pass => !pass);
  const output = recovered ? verifiedPolicy : draft;
  const workflow = summarize(output, constraints(output, expected),
    recovered ? ['draft', 'verify', 'repair', 'verify', 'report'] : ['draft', 'verify', 'report'],
    baseline.checkCount);
  return { fixture, expected, baseline, workflow, recovered };
}

export function summarizeReliability() {
  const runs = Object.keys(reliabilityCases).map(runReliability);
  return Object.fromEntries(['baseline', 'workflow'].map(name => {
    const outcomes = runs.map(run => run[name]);
    const sum = key => outcomes.reduce((total, result) => total + result[key], 0);
    return [name, {
      successes: outcomes.filter(result => result.success).length,
      tasks: outcomes.length, passed: sum('passed'), checkCount: sum('checkCount'),
      verifiedChecks: sum('verifiedChecks'), tokens: sum('tokens'),
      latencyMs: sum('latencyMs') / outcomes.length, estimatedUsd: sum('estimatedUsd'),
    }];
  }));
}
