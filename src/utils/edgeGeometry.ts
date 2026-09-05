export interface NodePoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface EdgeData {
  id: string;
  from: string;
  to: string;
  symbols: string[];
}

export interface EdgeGeometryResult {
  pathD: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  labelX: number;
  labelY: number;
  type: 'straight' | 'curved' | 'selfloop-top';
}

export const NODE_RADIUS = 24.0;

export function calculateEdgeGeometry(
  edge: EdgeData,
  sourceNode: NodePoint | undefined,
  targetNode: NodePoint | undefined,
  allEdges: EdgeData[],
  allNodes: NodePoint[]
): EdgeGeometryResult | null {
  if (!sourceNode || !targetNode) {
    console.error("[INVALID CONVERSION EDGE] Source or Target node does not exist!", { edge, sourceNode, targetNode });
    return null;
  }

  const isSelfLoop = edge.from === edge.to;
  const R = NODE_RADIUS;

  if (isSelfLoop) {
    const { x, y } = sourceNode;
    const selfLoopEdges = allEdges.filter((e) => e.from === edge.from && e.to === edge.to);
    const selfLoopIdx = Math.max(0, selfLoopEdges.findIndex((e) => e.id === edge.id));

    // Leaving from upper-left boundary (-135°) and returning to upper-right boundary (-45°)
    const startAngle = -3 * Math.PI / 4; // -135 deg
    const endAngle = -Math.PI / 4;      // -45 deg
    const startX = x + R * Math.cos(startAngle);
    const startY = y + R * Math.sin(startAngle);
    const endX = x + R * Math.cos(endAngle);
    const endY = y + R * Math.sin(endAngle);

    // Dynamic height and width scaling for multiple stacked self-loops above node
    const h = 55.0 + selfLoopIdx * 22.0;
    const w = 35.0 + selfLoopIdx * 10.0;

    const cx1 = x - w;
    const cy1 = y - h;
    const cx2 = x + w;
    const cy2 = y - h;

    const pathD = `M ${startX.toFixed(2)} ${startY.toFixed(2)} C ${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
    return {
      pathD,
      startX,
      startY,
      endX,
      endY,
      labelX: x,
      labelY: y - h - 4,
      type: 'selfloop-top'
    };
  }

  // Non-self-loop edges
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const dist = Math.hypot(dx, dy);

  if (dist === 0) {
    console.error("[INVALID CONVERSION EDGE] Source and Target nodes have identical coordinates!", { edge, sourceNode, targetNode });
    return null;
  }

  const ux = dx / dist;
  const uy = dy / dist;
  // Perpendicular unit vector pointing to the "left" of the directed line S -> T
  const px = -uy;
  const py = ux;

  // Check for reverse edge (bidirectional transition pair A -> B and B -> A)
  const hasReverse = allEdges.some((e) => e.from === edge.to && e.to === edge.from);

  // Check for multiple parallel edges in the same direction
  const sameDirEdges = allEdges.filter((e) => e.from === edge.from && e.to === edge.to);
  const sameDirIndex = sameDirEdges.findIndex((e) => e.id === edge.id);

  // Node Obstacle Avoidance Calculation
  // Safe clearance threshold around obstacle node center: NODE_RADIUS + 14px margin = 38px
  const CLEARANCE_THRESHOLD = 38.0;

  interface ObstacleInfo {
    node: NodePoint;
    tProj: number;
    dPerp: number; // Signed perpendicular distance
    tau: number;   // Ratio tProj / dist
  }

  const obstacles: ObstacleInfo[] = [];

  for (const node of allNodes) {
    if (node.id === sourceNode.id || node.id === targetNode.id) continue;

    // Vector from source to obstacle node candidate
    const vox = node.x - sourceNode.x;
    const voy = node.y - sourceNode.y;

    // Projection along directed line segment
    const tProj = vox * ux + voy * uy;

    // Signed perpendicular distance (positive = left side of S->T, negative = right side)
    const dPerp = vox * px + voy * py;

    // Node must lie along the segment corridor between source and target node boundaries
    if (tProj > R && tProj < dist - R && Math.abs(dPerp) < CLEARANCE_THRESHOLD) {
      obstacles.push({
        node,
        tProj,
        dPerp,
        tau: tProj / dist
      });
    }
  }

  const isObstructed = obstacles.length > 0;
  const isMultipleParallel = sameDirEdges.length > 1;

  // If no obstruction, no reverse edge, and no multiple parallel edges in same direction -> draw straight edge
  if (!isObstructed && !hasReverse && !isMultipleParallel) {
    const startX = sourceNode.x + ux * R;
    const startY = sourceNode.y + uy * R;
    const endX = targetNode.x - ux * R;
    const endY = targetNode.y - uy * R;

    const pathD = `M ${startX.toFixed(2)} ${startY.toFixed(2)} L ${endX.toFixed(2)} ${endY.toFixed(2)}`;

    return {
      pathD,
      startX,
      startY,
      endX,
      endY,
      labelX: (startX + endX) / 2,
      labelY: (startY + endY) / 2 - 8,
      type: 'straight'
    };
  }

  // Calculate curve direction and control point offset
  let curveDir = -1; // Default to negative perpendicular direction (curves upwards/right relative to edge)

  if (isObstructed) {
    // Determine curve direction to bow away from obstructing nodes
    const sumDPerp = obstacles.reduce((sum, obs) => sum + obs.dPerp, 0);
    // If obstacles are mostly on positive side (left), curve towards negative side (-1).
    // If obstacles are mostly on negative side (right), curve towards positive side (+1).
    curveDir = sumDPerp >= 0 ? -1 : 1;
  }

  let requiredOffset = 0;

  if (isObstructed) {
    // Compute peak control point offset needed to clear all obstacles cleanly
    for (const obs of obstacles) {
      // Clamp tau for stability (avoid extreme values near endpoints)
      const tau = Math.max(0.15, Math.min(0.85, obs.tau));
      const denom = 4 * tau * (1 - tau); // Parabolic factor along curve (1.0 at tau=0.5)

      // To clear obstacle, the curve displacement at tau plus the obstacle's distance away from center line
      // must equal CLEARANCE_THRESHOLD (38px).
      // Curve peak displacement = h / 2. At parameter tau, displacement = h * (4 * tau * (1 - tau)) / 2.
      // So required h = 2 * (CLEARANCE_THRESHOLD - curveDir * dPerp) / denom.
      const distToClear = CLEARANCE_THRESHOLD - (curveDir * obs.dPerp);
      const hForObs = (2 * Math.max(20, distToClear)) / (denom || 0.5);

      if (hForObs > requiredOffset) {
        requiredOffset = hForObs;
      }
    }
  }

  if (hasReverse && !isObstructed) {
    requiredOffset = Math.max(requiredOffset, 45);
  } else if (hasReverse && isObstructed) {
    requiredOffset = Math.max(requiredOffset, 50);
  }

  if (isMultipleParallel) {
    const parallelShift = (sameDirIndex > -1 ? sameDirIndex : 0) * 35;
    requiredOffset += parallelShift;
  }

  // Ensure minimum offset for curved type if needed, and clamp maximum offset to stay readable
  const hOffset = Math.min(160, Math.max(35, requiredOffset)) * curveDir;

  const mx = (sourceNode.x + targetNode.x) / 2;
  const my = (sourceNode.y + targetNode.y) / 2;

  // Quadratic control point C
  const cx = mx + px * hOffset;
  const cy = my + py * hOffset;

  // Start point on source node circle boundary in direction of control point C
  const vx1 = cx - sourceNode.x;
  const vy1 = cy - sourceNode.y;
  const len1 = Math.hypot(vx1, vy1) || 1;
  const startX = sourceNode.x + (vx1 / len1) * R;
  const startY = sourceNode.y + (vy1 / len1) * R;

  // End point on target node circle boundary in direction of control point C
  const vx2 = cx - targetNode.x;
  const vy2 = cy - targetNode.y;
  const len2 = Math.hypot(vx2, vy2) || 1;
  const endX = targetNode.x + (vx2 / len2) * R;
  const endY = targetNode.y + (vy2 / len2) * R;

  const pathD = `M ${startX.toFixed(2)} ${startY.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`;

  // Midpoint of quadratic Bezier curve B(0.5) for label position
  const curveMidX = 0.25 * startX + 0.5 * cx + 0.25 * endX;
  const curveMidY = 0.25 * startY + 0.5 * cy + 0.25 * endY;

  // Offset label slightly away from line in the curve direction
  const labelX = curveMidX + px * (curveDir * 6);
  const labelY = curveMidY + py * (curveDir * 6) - 4;

  return {
    pathD,
    startX,
    startY,
    endX,
    endY,
    labelX,
    labelY,
    type: 'curved'
  };
}

