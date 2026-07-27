export function validateTrack(layout) {
  const errors = [];

  if (layout.pieces.length < 4) {
    errors.push('Need at least 4 pieces');
  }

  if (!layout.pieces.some(p => p.isStation)) {
    errors.push('Must include a station');
  }

  const dzSum = layout.pieces.reduce((s, p) => s + p.dz, 0);
  if (dzSum !== 0) {
    errors.push(`Elevation imbalance: net ${dzSum > 0 ? '+' : ''}${dzSum} (slopes must cancel out)`);
  }

  if (!layout.canClose()) {
    errors.push('Track does not form a closed loop');
  }

  return { valid: errors.length === 0, errors };
}
