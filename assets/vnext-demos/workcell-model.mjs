export const workshop = { width: 4.8, height: 3.4, clearance: 0.18, pickupDwell: 0.45, dropDwell: 0.55 };

export const robots = {
  compact: { radius: 1.16, maxKg: 2, speed: 0.65 },
  standard: { radius: 1.47, maxKg: 5, speed: 0.80 },
  extended: { radius: 1.79, maxKg: 7, speed: 0.70 },
};

const obstacle = { x: 2.32, y: 1.48, width: 0.44, height: 0.60 };
export const layouts = {
  direct: { base: [1.98, 1.86], path: [[1.02, 1.81], [3.39, 1.78]], obstacle },
  bypass: { base: [2.02, 1.88], path: [[1.02, 1.81], [2.06, 1.04], [2.99, 1.04], [3.39, 1.78]], obstacle },
  compact: { base: [1.99, 1.61], path: [[1.10, 0.98], [2.87, 0.98]], obstacle },
};

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Clip a segment to the inclusive coordinate interval of a rectangle on both axes.
export function touchesRectangle(start, end, rect) {
  let enter = 0;
  let leave = 1;
  for (const [axis, minimum, maximum] of [[0, rect.x, rect.x + rect.width], [1, rect.y, rect.y + rect.height]]) {
    const move = end[axis] - start[axis];
    if (move === 0) {
      if (start[axis] < minimum || start[axis] > maximum) return false;
      continue;
    }
    const at = (minimum - start[axis]) / move;
    const to = (maximum - start[axis]) / move;
    enter = Math.max(enter, Math.min(at, to));
    leave = Math.min(leave, Math.max(at, to));
    if (enter > leave) return false;
  }
  return true;
}

function evaluate(robot, layout, payloadKg) {
  const { base, path, obstacle: box } = layout;
  const { clearance, pickupDwell, dropDwell } = workshop;
  const guarded = { x: box.x - clearance, y: box.y - clearance,
    width: box.width + 2 * clearance, height: box.height + 2 * clearance };
  const points = path.slice(1).map((end, index) => [path[index], end]);
  const collisions = points.map(([from, to]) => touchesRectangle(from, to, guarded));
  const furthest = Math.max(...path.map(point => distance(base, point)));
  const reachable = furthest <= robot.radius;
  const length = points.reduce((sum, [from, to]) => sum + distance(from, to), 0);
  const collisionFree = !collisions.includes(true);
  const payloadOK = payloadKg <= robot.maxKg;
  const feasible = reachable && collisionFree && payloadOK;
  return {
    guarded, collisions, reachable, furthest, length, collisionFree, payloadOK, feasible,
    cycleSeconds: feasible ? 2 * length / robot.speed + pickupDwell + dropDwell : null,
  };
}

export function compareWorkcells(robotId, payloadKg) {
  const robot = Object.hasOwn(robots, robotId) && robots[robotId];
  if (!robot || !Number.isFinite(payloadKg) || payloadKg <= 0) throw new RangeError('Invalid workcell inputs');
  const results = Object.fromEntries(Object.entries(layouts).map(([id, layout]) => [id, evaluate(robot, layout, payloadKg)]));
  const best = Object.keys(results).filter(id => results[id].feasible)
    .sort((a, b) => results[a].cycleSeconds - results[b].cycleSeconds)[0] ?? null;
  return { robot, results, best };
}

export function workcellDxf(robotId, layoutId) {
  const robot = Object.hasOwn(robots, robotId) && robots[robotId];
  const layout = Object.hasOwn(layouts, layoutId) && layouts[layoutId];
  if (!robot || !layout) throw new RangeError('Invalid DXF model');
  const value = distance => Math.round(distance * 1_000);
  const line = (layer, [x, y], [a, b]) => [0, 'LINE', 8, layer, 10, value(x), 20, value(y), 30, 0, 11, value(a), 21, value(b), 31, 0];
  const circle = (layer, [x, y], radius) => [0, 'CIRCLE', 8, layer, 10, value(x), 20, value(y), 30, 0, 40, value(radius)];
  const rectangle = (layer, x, y, w, h) => {
    const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    return corners.flatMap((point, index) => line(layer, point, corners[(index + 1) % corners.length]));
  };
  const { clearance, width, height } = workshop;
  const { x, y, width: w, height: h } = layout.obstacle;
  return [999, 'CONCEPT PLAN - geometry in millimetres; not for fabrication',
    0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1009', 0, 'ENDSEC',
    0, 'SECTION', 2, 'ENTITIES',
    ...rectangle('FLOOR', 0, 0, width, height), ...rectangle('OBSTACLE', x, y, w, h),
    ...rectangle('CLEARANCE', x - clearance, y - clearance, w + 2 * clearance, h + 2 * clearance),
    ...circle('BASE', layout.base, 0.11), ...circle('REACH', layout.base, robot.radius),
    ...circle('PICKUP', layout.path[0], 0.06), ...circle('DROP', layout.path.at(-1), 0.06),
    ...layout.path.slice(1).flatMap((point, index) => line('ROUTE', layout.path[index], point)),
    0, 'ENDSEC', 0, 'EOF', '',
  ].join('\n');
}
