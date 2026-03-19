export function fmt(v) {
  return v != null ? Number(v).toFixed(4) : "\u2014";
}

export function round(v) {
  return v != null ? Math.round(v * 10000) / 10000 : 0;
}
