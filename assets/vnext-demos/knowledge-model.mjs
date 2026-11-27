export const knowledgeRequests = {
  standard: { configuration: 'standard', celsius: 20, terms: ['pressure', 'limit', 'standard', 'test'] },
  highHeat: { configuration: 'highHeat', celsius: 75, terms: ['pressure', 'limit', 'hot', 'field'] },
  unsupported: { configuration: 'highHeat', celsius: 95, terms: ['pressure', 'limit', 'hot', 'field'] },
};

export const knowledgeDocuments = [
  { id: 'M1', version: '1.3', authority: 'manual', active: false, rank: 2,
    terms: ['pressure', 'limit', 'standard', 'test'],
    claims: [{ id: 'M1 §4.2', configuration: 'standard', min: 0, max: 60, kPa: 640 }] },
  { id: 'M2', version: '2.1', authority: 'manual', active: true, rank: 2,
    terms: ['pressure', 'limit', 'standard', 'hot'],
    claims: [{ id: 'M2 §4.2', configuration: 'standard', min: 0, max: 60, kPa: 550 },
      { id: 'M2 §4.3', configuration: 'highHeat', min: 60, max: 85, kPa: 420 }] },
  { id: 'E1', version: '1.0', authority: 'note', active: true, rank: 1,
    terms: ['pressure', 'limit', 'hot', 'field'],
    claims: [{ id: 'E1 §2', configuration: 'highHeat', min: 55, max: 85, kPa: 460 }] },
];

function applies(claim, request) {
  return claim.configuration === request.configuration
    && request.celsius >= claim.min && request.celsius <= claim.max;
}

function retrieve(request) {
  return knowledgeDocuments.map(document => ({
    document, score: request.terms.filter(term => document.terms.includes(term)).length,
  })).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score);
}

function extract(retrieved, request) {
  return retrieved.flatMap(({document}) => document.claims.map(claim => ({
    claim, document, applicable: applies(claim, request),
  })));
}

function makeAnswer(candidate) {
  return candidate ? { kPa: candidate.claim.kPa, citation: candidate.claim.id } : null;
}

function checkCitation(answer, candidates) {
  const match = answer && candidates.find(({claim}) => claim.id === answer.citation && claim.kPa === answer.kPa);
  if (!match) return { exact: false, applicable: false, current: false };
  return { exact: true, applicable: match.applicable, current: match.document.active };
}

export function runKnowledge(query) {
  const request = Object.hasOwn(knowledgeRequests, query) && knowledgeRequests[query];
  if (!request) throw new RangeError('Unknown knowledge query');
  const retrieved = retrieve(request);
  const candidates = extract(retrieved, request);
  const relevant = candidates.filter(({applicable}) => applicable);
  const conflicting = new Set(relevant.map(item => item.claim.kPa)).size > 1;
  const baselineClaim = candidates.find(({claim}) => claim.configuration === request.configuration);
  const eligible = relevant.filter(({document}) => document.active)
    .sort((a, b) => b.document.rank - a.document.rank);
  const first = eligible[0];
  const tiedConflict = first && eligible.some(item =>
    item.document.rank === first.document.rank && item.claim.kPa !== first.claim.kPa);
  const chosen = tiedConflict ? null : first;
  const baseline = makeAnswer(baselineClaim);
  const arbitrated = makeAnswer(chosen);
  return {
    request, retrieved, candidates, conflicting, chosen,
    reason: tiedConflict ? 'unresolved' : !first ? 'uncovered' : conflicting ? 'resolved' : 'supported',
    baseline, arbitrated,
    baselineCheck: checkCitation(baseline, candidates),
    arbitratedCheck: checkCitation(arbitrated, candidates),
  };
}
