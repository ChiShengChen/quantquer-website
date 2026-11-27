import { knowledgeDocuments, knowledgeRequests, runKnowledge } from './knowledge-model.mjs';
import { escape, facts, flag, select, table, tr } from './view-utils.mjs';

export const defaults = { query: 'standard' };
const queryTitles = {
  standard: ['標準型 · 20 °C', 'Standard configuration · 20 °C'],
  highHeat: ['耐熱型 · 75 °C', 'High-heat configuration · 75 °C'],
  unsupported: ['耐熱型 · 95 °C', 'High-heat configuration · 95 °C'],
};
const configurations = { standard: ['標準型', 'Standard'], highHeat: ['耐熱型', 'High-heat'] };
const authority = { manual: ['原廠手冊', 'Manufacturer manual'], note: ['工程師補充', 'Engineering note'] };

export function controls(locale) {
  return select('query', tr(locale, '詢問合成泵浦的壓力上限', 'Ask for the synthetic pump pressure limit'),
    Object.fromEntries(Object.keys(knowledgeRequests).map(id => [id, tr(locale, ...queryTitles[id])])), defaults.query);
}

function answerCard(locale, name, output, checks) {
  const remark = output ? `${output.kPa} kPa` : tr(locale, '文件未涵蓋', 'Unsupported by documents');
  return `<section class="engineering-demo-result"><h3>${escape(name)}</h3>
    <p class="engineering-demo-outcome">${escape(remark)}</p>
    ${output ? facts([
    [tr(locale, '引用片段', 'Cited passage'), output.citation],
    [tr(locale, '數值與原文相符', 'Exact figure in source'), flag(locale, checks.exact)],
    [tr(locale, '適用目前條件', 'Applies to this case'), flag(locale, checks.applicable)],
    [tr(locale, '版本有效', 'Version active'), flag(locale, checks.current)],
  ]) : ''}</section>`;
}

function quote(locale, claim) {
  const model = tr(locale, ...configurations[claim.configuration]);
  return tr(locale,
    `${model}設備於 ${claim.min} 至 ${claim.max} °C 的壓力上限為 ${claim.kPa} kPa。`,
    `The pressure limit for the ${model.toLowerCase()} configuration from ${claim.min} to ${claim.max} °C is ${claim.kPa} kPa.`);
}

export function render(locale, { query }) {
  const result = runKnowledge(query);
  const localized = (zh, en) => tr(locale, zh, en);
  const question = localized(
    `${tr(locale, ...configurations[result.request.configuration])}設備在 ${result.request.celsius} °C 時的壓力上限是多少？`,
    `What is the pressure limit for the ${tr(locale, ...configurations[result.request.configuration]).toLowerCase()} configuration at ${result.request.celsius} °C?`);
  const rationale = {
    unresolved: ['適用而同等權威的有效來源互相矛盾，應轉人工確認。', 'Applicable active sources of equal authority disagree. Escalate for review.'],
    uncovered: ['目前沒有有效文件涵蓋所選配置與溫度，仲裁流程保留未定。', 'No active document covers the selected configuration and temperature. Arbitration leaves the answer open.'],
    resolved: ['來源對同一條件列出不同上限，仲裁採適用且有效的最高權威來源。', 'Sources disagree on the same condition. Arbitration uses the highest-authority active source that applies.'],
    supported: ['適用且有效的來源支持一個上限。', 'An applicable active source supports one pressure limit.'],
  }[result.reason];

  return `<section class="engineering-demo-input"><h3>${escape(question)}</h3>
    <ol class="engineering-demo-flow">${[
    ['問題', 'Question'], ['檢索', 'Retrieval'], ['讀取標記規格', 'Read annotated claims'], ['檢查衝突', 'Conflict detection'],
    ['版本與權威', 'Version and authority'], ['選擇證據', 'Evidence selection'], ['產生答案', 'Answer'], ['核對引用', 'Verify citation'],
  ].map(pair => `<li>${escape(tr(locale, ...pair))}</li>`).join('')}</ol></section>
    <div class="engineering-demo-grid">
      ${answerCard(locale, localized('關鍵詞 RAG 基準', 'Keyword RAG baseline'), result.baseline, result.baselineCheck)}
      ${answerCard(locale, localized('文件仲裁', 'Knowledge arbitration'), result.arbitrated, result.arbitratedCheck)}
    </div>
    <p class="engineering-demo-summary">${escape(tr(locale, ...rationale))}</p>
    ${table(localized('檢索到的合成規格，依關鍵詞分數排列', 'Retrieved synthetic claims in keyword-score order'), [
    localized('引用片段', 'Passage'), localized('版本與權威', 'Version and authority'), localized('適用條件', 'Scope'), localized('選擇結果', 'Selection'),
  ], result.candidates.map(({ claim, document, applicable }) => [
    `${claim.id} · ${claim.kPa} kPa`,
    `${document.version} · ${tr(locale, ...authority[document.authority])} · ${document.active ? localized('有效', 'Active') : localized('已停用', 'Retired')}`,
    `${tr(locale, ...configurations[claim.configuration])}, ${claim.min}–${claim.max} °C`,
    result.chosen?.claim.id === claim.id ? localized('已採用', 'Selected') : !applicable ? localized('條件不符', 'Outside scope')
      : !document.active ? localized('版本已停用', 'Retired version') : localized('未優先採用', 'Lower precedence'),
  ]))}
    <details><summary>${escape(localized('查看三份合成文件的原文片段', 'Read the three synthetic source documents'))}</summary>
      <ul class="engineering-demo-documents">${knowledgeDocuments.map(document => `<li><strong>${escape(`${document.id} · ${tr(locale, ...authority[document.authority])} · v${document.version}`)}</strong>
        ${document.claims.map(claim => `<p>${escape(`${claim.id} — ${quote(locale, claim)}`)}</p>`).join('')}</li>`).join('')}</ul>
    </details>
    <p class="engineering-demo-meta">${escape(localized('基準選第一份詞彙相符且包含該配置的來源。仲裁先核對配置、溫度與有效版本，再依權威排序。原廠有效手冊優先於工程師補充。',
    'The baseline picks the first lexical match that names the configuration. Arbitration checks configuration, temperature and active version before ranking authority. An active manufacturer manual takes precedence over an engineering note.'))}</p>`;
}
