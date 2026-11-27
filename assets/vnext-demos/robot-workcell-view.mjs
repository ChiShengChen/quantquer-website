import { compareWorkcells, layouts, robots, workshop, workcellDxf } from './workcell-model.mjs';
import { escape, facts, select, table, tr } from './view-utils.mjs';

export const defaults = { robot: 'standard', layout: 'direct', payload: '1' };
const layoutsCopy = {
  direct: ['方案 A · 直行', 'Layout A · Direct'], bypass: ['方案 B · 繞行', 'Layout B · Detour'], compact: ['方案 C · 工位移位', 'Layout C · Repositioned stations'],
};
const robotsCopy = {
  compact: ['小型臂', 'Compact arm'], standard: ['標準臂', 'Standard arm'], extended: ['長臂', 'Extended arm'],
};

export function controls(locale) {
  const robotLabels = Object.fromEntries(Object.entries(robots).map(([id, robot]) => [id, `${tr(locale, ...robotsCopy[id])} · ${robot.radius.toFixed(2)} m · ${robot.maxKg} kg`]));
  const layoutLabels = Object.fromEntries(Object.entries(layoutsCopy).map(([id, names]) => [id, tr(locale, ...names)]));
  return select('robot', tr(locale, '候選機器人', 'Robot candidate'), robotLabels, defaults.robot)
    + select('layout', tr(locale, '查看工作站方案', 'Workcell layout'), layoutLabels, defaults.layout)
    + select('payload', tr(locale, '示例有效負載', 'Example payload'), { 1: '1 kg', 4: '4 kg', 6: '6 kg' }, defaults.payload);
}

function drawing(locale, layout, robot, evaluation) {
  const at = ([x, y]) => [x * 100, (workshop.height - y) * 100];
  const [baseX, baseY] = at(layout.base);
  const [pickX, pickY] = at(layout.path[0]);
  const [dropX, dropY] = at(layout.path.at(-1));
  const box = (rectangle, className) => `<rect x="${rectangle.x * 100}" y="${(workshop.height - rectangle.y - rectangle.height) * 100}" width="${rectangle.width * 100}" height="${rectangle.height * 100}" class="${className}"/>`;
  const points = layout.path.map(at);
  return `<svg class="engineering-demo-plan" viewBox="0 0 480 340" width="480" height="340" role="img" aria-labelledby="engineering-demo-plan-title">
    <title id="engineering-demo-plan-title">${escape(tr(locale, '合成工作站平面圖，標示取放點、運動路徑、可達半徑及障礙物。', 'Synthetic workcell plan with pickup and drop-off points, route, reach radius and obstruction.'))}</title>
    <defs><pattern id="engineering-demo-plan-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 0 40 V 0 H 40" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs>
    <rect width="480" height="340" fill="url(#engineering-demo-plan-grid)" class="engineering-demo-plan-grid"/>
    <circle cx="${baseX}" cy="${baseY}" r="${robot.radius * 100}" class="engineering-demo-reach"/>
    ${box(evaluation.guarded, 'engineering-demo-guard')}
    ${box(layout.obstacle, 'engineering-demo-obstacle')}
    ${points.slice(1).map(([x, y], index) => `<path d="M ${points[index].join(' ')} L ${x} ${y}" class="engineering-demo-route${evaluation.collisions[index] ? ' is-collision' : ''}"/>`).join('')}
    ${points.slice(1, -1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" class="engineering-demo-waypoint"/>`).join('')}
    <circle cx="${baseX}" cy="${baseY}" r="9" class="engineering-demo-base"/>
    <circle cx="${pickX}" cy="${pickY}" r="7" class="engineering-demo-station"/>
    <circle cx="${dropX}" cy="${dropY}" r="7" class="engineering-demo-station"/>
    <text x="${baseX - 7}" y="${baseY - 13}" text-anchor="end">${escape(tr(locale, '機座', 'Base'))}</text>
    <text x="${pickX - 9}" y="${pickY + 4}" text-anchor="end">${escape(tr(locale, '取件', 'Pick'))}</text>
    <text x="${dropX + 10}" y="${dropY + 4}">${escape(tr(locale, '放件', 'Drop'))}</text>
  </svg>`;
}

export function exportFile(values) {
  return { name: `quantquer-workcell-${values.layout}.dxf`, value: workcellDxf(values.robot, values.layout) };
}

export function render(locale, { robot: selectedRobot, layout: selectedLayout, payload }) {
  const { robot, results, best } = compareWorkcells(selectedRobot, Number(payload));
  const evaluation = results[selectedLayout];
  const layout = layouts[selectedLayout];
  if (!evaluation || !layout) throw new RangeError('Unknown layout');
  const localized = (zh, en) => tr(locale, zh, en);
  const mark = state => state ? localized('通過', 'Pass') : localized('不通過', 'Fail');
  const cycle = item => item.cycleSeconds === null ? '—' : `${item.cycleSeconds.toFixed(2)} s`;
  return `<section class="engineering-demo-grid workcell-grid" aria-labelledby="engineering-demo-workcell-selected">
    <figure class="engineering-demo-workcell">${drawing(locale, layout, robot, evaluation)}
      <figcaption>${escape(localized('4.8 × 3.4 m 合成廠區。虛線標出可達半徑與障礙淨距，橘色路段進入障礙淨距。',
    'Synthetic 4.8 × 3.4 m floor. Dashed outlines show reach and obstacle clearance. An amber route segment violates clearance.'))}</figcaption></figure>
    <div class="engineering-demo-result"><h3 id="engineering-demo-workcell-selected">${escape(tr(locale, ...layoutsCopy[selectedLayout]))}</h3>
      <p class="engineering-demo-outcome">${escape(evaluation.feasible ? localized('通過概念檢查', 'Passes concept checks') : localized('未通過概念檢查', 'Fails concept checks'))}</p>
      ${facts([
    [localized('最遠路點／可達半徑', 'Furthest waypoint / reach radius'), `${evaluation.furthest.toFixed(2)} / ${robot.radius.toFixed(2)} m`],
    [localized('障礙淨距', 'Obstacle clearance'), `${workshop.clearance} m · ${mark(evaluation.collisionFree)}`],
    [localized('負載／展示額定值', 'Payload / example rating'), `${payload} / ${robot.maxKg} kg · ${mark(evaluation.payloadOK)}`],
    [localized('單程路徑長度', 'One-way route length'), `${evaluation.length.toFixed(2)} m`],
    [localized('假設等速', 'Assumed constant speed'), `${robot.speed.toFixed(2)} m/s`],
    [localized('估計循環', 'Estimated cycle'), cycle(evaluation)],
  ])}</div></section>
    ${table(localized('同一候選機器人的方案比較', 'Layout comparison for the same robot candidate'), [
    localized('方案', 'Layout'), localized('可達', 'Reach'), localized('避障', 'Obstacle'), localized('負載', 'Payload'), localized('估計循環', 'Est. cycle'),
  ], Object.entries(results).map(([id, item]) => [tr(locale, ...layoutsCopy[id]), mark(item.reachable), mark(item.collisionFree), mark(item.payloadOK), cycle(item)]))}
    <p class="engineering-demo-summary">${escape(best
    ? localized(`在三個固定候選方案中，最快的可行方案是${tr(locale, ...layoutsCopy[best])}（${cycle(results[best])}）。`, `The quickest feasible layout among the three candidates is ${tr(locale, ...layoutsCopy[best])} (${cycle(results[best])}).`)
    : localized('三個候選方案均未滿足目前限制。', 'None of the three layouts meets the current constraints.'))}</p>
    ${table(localized('目前方案的概念物料表', 'Concept BOM for the selected layout'), [
    localized('項目', 'Item'), localized('數量', 'Quantity'), localized('用途', 'Function'),
  ], [
    [tr(locale, ...robotsCopy[selectedRobot]), 1, localized('搬運單元', 'Handling unit')],
    [localized('機座安裝板', 'Base mounting plate'), 1, localized('示意機座座標', 'Base position')],
    [localized('取件治具', 'Pickup fixture'), 1, localized('固定進料位', 'Infeed position')],
    [localized('放件盤', 'Drop-off tray'), 1, localized('固定出料位', 'Outfeed position')],
  ])}
    <p class="engineering-demo-meta">${escape(localized('估計循環 = 2 × 單程路徑長度 ÷ 假設等速 + 取件停留 0.45 秒 + 放件停留 0.55 秒。簡化避障只檢查輸送點路線及擴張障礙矩形，不包含關節姿態、工具體積、加速度及安全驗證。概念 DXF 採毫米座標。',
    'Estimated cycle = twice the one-way route length divided by assumed constant speed, plus 0.45 s pickup and 0.55 s drop-off. Clearance checks cover only the point route and expanded rectangular obstacle. Joint poses, tool volume, acceleration and safety validation are outside the model. Concept DXF coordinates use millimetres.'))}</p>`;
}
