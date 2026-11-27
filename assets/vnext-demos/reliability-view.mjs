import { reliabilityCases, reliabilityCostPerMillion, runReliability, summarizeReliability } from './reliability-model.mjs';
import { escape, facts, flag, select, table, tr } from './view-utils.mjs';

export const defaults = { scenario: 'stale' };
const caseNames = {
  routine: ['一般採購', 'Routine purchase'],
  stale: ['過期採購上限', 'Outdated spending limit'],
  authorization: ['供應商與複核', 'Supplier approval and review'],
  unavailable: ['有效政策無法取得', 'Unavailable policy'],
};

const decisions = {
  release: ['核准', 'Release'], hold: ['保留待審', 'Hold'], escalate: ['轉人工處理', 'Escalate'],
};
const stages = {
  draft: ['擬定草案', 'Draft'], verify: ['驗證限制', 'Verify'], repair: ['修正或轉人工', 'Repair or escalate'], report: ['產生報告', 'Report'],
};
const checks = {
  amount: ['金額計算', 'Amount'], decision: ['處置符合政策', 'Policy decision'],
  evidence: ['引用當前政策', 'Current citation'], review: ['複核需求紀錄', 'Review requirement'],
  supplier: ['供應商核准狀態', 'Supplier approval'],
};

const money = cents => `$${(cents / 100).toFixed(2)}`;
const ratio = (a, b) => `${a}/${b} (${(a / b * 100).toFixed(0)}%)`;

export function controls(locale) {
  return select('scenario', tr(locale, '同一組測試情境', 'Shared test scenario'),
    Object.fromEntries(Object.keys(reliabilityCases).map(id => [id, tr(locale, ...caseNames[id])])), defaults.scenario);
}

function report(locale, result, name) {
  const { output } = result;
  return `<section class="engineering-demo-result"><h3>${escape(name)}</h3>
    <p class="engineering-demo-outcome">${escape(tr(locale, ...decisions[output.action]))}</p>
    ${facts([
      [tr(locale, '送審金額', 'Request amount'), money(output.total)],
      [tr(locale, '引用來源', 'Citation'), output.citation ?? tr(locale, '無', 'None')],
      [tr(locale, '複核需求已記錄', 'Review requirement recorded'), output.reviewRecorded ? tr(locale, '是', 'Yes') : tr(locale, '否', 'No')],
    ])}
    <ol class="engineering-demo-flow">${result.stages.map(stage => `<li>${escape(tr(locale, ...stages[stage]))}</li>`).join('')}</ol>
  </section>`;
}

export function render(locale, { scenario }) {
  const { fixture, expected, baseline, workflow, recovered } = runReliability(scenario);
  const aggregate = summarizeReliability();
  const baseName = tr(locale, '單代理基準', 'Single-agent baseline');
  const flowName = tr(locale, '多階段流程', 'Multi-stage workflow');
  const verdict = result => result.success ? tr(locale, '成功', 'Success') : tr(locale, '失敗', 'Failed');
  const yes = answer => answer ? tr(locale, '是', 'Yes') : tr(locale, '否', 'No');
  const results = [aggregate.baseline, aggregate.workflow];

  return `<section class="engineering-demo-input"><h3>${escape(tr(locale, '採購條件', 'Purchase requirements'))}</h3>
    ${facts([
      [tr(locale, '數量 × 單價', 'Quantity × unit price'), `${fixture.quantity} × ${money(fixture.unitCents)}`],
      [tr(locale, '有效上限與來源', 'Active limit and source'), fixture.policy ? `${money(fixture.policy.limit)} · ${fixture.policy.id}` : tr(locale, '無法取得', 'Unavailable')],
      [tr(locale, '基準取得的政策', 'Baseline retrieval'), `${fixture.retrievedPolicy.id} · ${money(fixture.retrievedPolicy.limit)}`],
      [tr(locale, '核准供應商', 'Approved supplier'), yes(fixture.supplierApproved)],
      [tr(locale, '需主管複核', 'Supervisor review required'), yes(fixture.reviewRequired)],
      [tr(locale, '主管已核准', 'Supervisor approval recorded'), yes(fixture.supervisorApproved)],
      [tr(locale, '預期處置', 'Expected decision'), tr(locale, ...decisions[expected.action])],
    ])}</section>
    <div class="engineering-demo-grid">${report(locale, baseline, baseName)}${report(locale, workflow, flowName)}</div>
    <p class="engineering-demo-summary">${escape(expected.action === 'escalate'
    ? tr(locale, '沒有有效政策可驗證，流程保留紀錄並轉人工。', 'The active policy is unavailable. The workflow preserves the record and escalates.')
    : recovered ? tr(locale, '驗證發現草案違反條件，修正後重新檢查。', 'Verification found failed constraints. The workflow repairs the draft and checks it again.')
      : tr(locale, '草案已符合條件，驗證後直接出具報告。', 'The draft meets the requirements and proceeds to the report after verification.'))}</p>
    ${table(tr(locale, '這筆任務的逐項驗收', 'Checks for this task'), [tr(locale, '項目', 'Check'), baseName, flowName], [
    [tr(locale, '任務結果', 'Task result'), verdict(baseline), verdict(workflow)],
    ...Object.entries(checks).map(([id, name]) => [tr(locale, ...name), flag(locale, baseline.checks[id]), flag(locale, workflow.checks[id])]),
  ])}
    ${table(tr(locale, '四個合成案例的固定測試集', 'Fixed set of four synthetic cases'), [tr(locale, '指標', 'Metric'), baseName, flowName], [
    [tr(locale, '任務成功率', 'Task success rate'), ...results.map(r => ratio(r.successes, r.tasks))],
    [tr(locale, '限制符合率', 'Constraint satisfaction'), ...results.map(r => ratio(r.passed, r.checkCount))],
    [tr(locale, '流程內驗證覆蓋率', 'In-workflow verification coverage'), ...results.map(r => ratio(r.verifiedChecks, r.checkCount))],
    [tr(locale, '模擬 Token 用量合計', 'Modeled token units'), ...results.map(r => r.tokens)],
    [tr(locale, '估算總成本（USD）', 'Estimated total cost (USD)'), ...results.map(r => `$${r.estimatedUsd.toFixed(5)}`)],
    [tr(locale, '模擬每題平均延遲', 'Modeled mean latency per task'), ...results.map(r => `${r.latencyMs.toFixed(2)} ms`)],
  ])}
    <p class="engineering-demo-meta">${escape(tr(locale,
    `計價示意採每百萬模擬 Token US$${reliabilityCostPerMillion}。各階段使用固定計數與延遲。驗收依獨立的預期輸出逐項比對，覆蓋率只計流程內執行的檢查。`,
    `Accounting uses US$${reliabilityCostPerMillion} per million modeled token units. Stages have fixed counts and delays. Evaluation compares results with separate expected outputs, and coverage counts checks performed inside the workflow.`))}</p>`;
}
