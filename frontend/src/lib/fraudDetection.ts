// Lightweight fraud / liveness signals derived from facial landmarks across frames.
// Detects: (a) eye-blink presence, (b) head movement variation, (c) static-image attacks.

export interface LivenessSnapshot {
  blinkScore: number;        // 0..1 - higher = blinks observed
  movementScore: number;     // 0..1 - higher = natural head movement
  varianceScore: number;     // 0..1 - higher = non-static
  overall: number;           // 0..1 - composite liveness score
  isLive: boolean;
}

export function computeLiveness(history: { ear: number; nosePos: [number, number] }[]): LivenessSnapshot {
  if (history.length < 8) {
    return { blinkScore: 0, movementScore: 0, varianceScore: 0, overall: 0, isLive: false };
  }
  // Blink detection: EAR (eye aspect ratio) dropping below threshold momentarily
  const ears = history.map(h => h.ear);
  const minEar = Math.min(...ears);
  const meanEar = ears.reduce((a, b) => a + b, 0) / ears.length;
  const blink = meanEar - minEar > 0.045 ? 1 : 0.4;

  // Head movement: variance of nose position across frames
  const xs = history.map(h => h.nosePos[0]);
  const ys = history.map(h => h.nosePos[1]);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const varX = xs.reduce((a, b) => a + (b - mx) ** 2, 0) / xs.length;
  const varY = ys.reduce((a, b) => a + (b - my) ** 2, 0) / ys.length;
  const movement = Math.min(1, Math.sqrt(varX + varY) / 2);

  // Variance score: any pixel deviation at all
  const variance = Math.min(1, (varX + varY) / 1.5);

  const overall = blink * 0.45 + movement * 0.35 + variance * 0.20;
  return {
    blinkScore: blink,
    movementScore: movement,
    varianceScore: variance,
    overall,
    isLive: overall > 0.5,
  };
}
