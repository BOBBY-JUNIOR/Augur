// ── Technical indicators + a deterministic candle synthesizer ───────────────
// The indicators (ADX, ATR, Bollinger) run identically on live Bitget candles
// and on the deterministic fallback series, so regime detection behaves the
// same in both modes.

export interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Deterministic PRNG (mulberry32) so simulated runs are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BASE_PRICE: Record<string, number> = {
  BTCUSDT: 64000,
  ETHUSDT: 3100,
  DOGEUSDT: 0.16,
};

/**
 * Synthesize a realistic OHLC series for an asset, seeded by asset+seedKey so a
 * given day produces a stable regime. Meme coins get higher vol; some seeds
 * produce a strong drift (trending), others a mean-reverting chop (ranging).
 */
export function synthCandles(
  asset: string,
  seedKey: string,
  n = 120
): Candle[] {
  const seed = hashSeed(`${asset}:${seedKey}`);
  const rnd = mulberry32(seed);
  const base = BASE_PRICE[asset] ?? 100;

  // Regime knobs derived from the seed.
  const driftBias = (rnd() - 0.5) * 2; // -1..1
  const trendiness = rnd(); // 0..1 — high => persistent drift
  const baseVol = (asset === "DOGEUSDT" ? 0.045 : 0.02) * (0.6 + rnd());
  const drift = driftBias * trendiness * baseVol * 0.9;

  const candles: Candle[] = [];
  let price = base;
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    // Mean-reverting component pulls toward a slowly moving anchor.
    const revert = ((base - price) / base) * (1 - trendiness) * 0.05;
    const shock = (rnd() - 0.5) * 2 * baseVol;
    const ret = drift + revert + shock;
    const open = price;
    const close = Math.max(open * (1 + ret), base * 0.05);
    const hi = Math.max(open, close) * (1 + rnd() * baseVol * 0.6);
    const lo = Math.min(open, close) * (1 - rnd() * baseVol * 0.6);
    const volume = base * (50 + rnd() * 100);
    candles.push({
      ts: now - (n - i) * 3600_000,
      open,
      high: hi,
      low: lo,
      close,
      volume,
    });
    price = close;
  }
  return candles;
}

/**
 * Continue an existing candle series forward by `steps` bars, starting from its
 * last close so price is *continuous* across cycles (entry and a later exit are
 * only a few bars apart — realistic moves, not independent draws). Seeded by
 * seedKey so each cycle still explores a fresh local drift/regime. Falls back to
 * a fresh synthesized window when there is no prior history.
 */
export function extendCandles(
  prev: Candle[] | undefined,
  asset: string,
  seedKey: string,
  steps = 3,
  window = 120
): Candle[] {
  const base = BASE_PRICE[asset] ?? 100;
  const candles: Candle[] =
    prev && prev.length >= 30 ? [...prev] : synthCandles(asset, seedKey, window);

  const rnd = mulberry32(hashSeed(`${asset}:${seedKey}:ext`));
  const baseVol = (asset === "DOGEUSDT" ? 0.045 : 0.02) * (0.6 + rnd());
  const driftBias = (rnd() - 0.5) * 2;
  const trendiness = rnd();
  const drift = driftBias * trendiness * baseVol * 0.6;

  let price = candles[candles.length - 1].close;
  const startTs = candles[candles.length - 1].ts;
  for (let i = 0; i < steps; i++) {
    const revert = ((base - price) / base) * (1 - trendiness) * 0.04;
    const shock = (rnd() - 0.5) * 2 * baseVol;
    const ret = drift + revert + shock;
    const open = price;
    const close = Math.max(open * (1 + ret), base * 0.05);
    const hi = Math.max(open, close) * (1 + rnd() * baseVol * 0.6);
    const lo = Math.min(open, close) * (1 - rnd() * baseVol * 0.6);
    candles.push({
      ts: startTs + (i + 1) * 3600_000,
      open,
      high: hi,
      low: lo,
      close,
      volume: base * (50 + rnd() * 100),
    });
    price = close;
  }
  return candles.slice(-window);
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/** Wilder-smoothed ADX (trend strength, 0..100). */
export function adx(candles: Candle[], period = 14): number {
  if (candles.length < period + 2) return 0;
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }
  const atr = ema(tr, period);
  const pdi = ema(plusDM, period).map((v, i) => (atr[i] ? (100 * v) / atr[i] : 0));
  const mdi = ema(minusDM, period).map((v, i) => (atr[i] ? (100 * v) / atr[i] : 0));
  const dx = pdi.map((p, i) => {
    const sum = p + mdi[i];
    return sum ? (100 * Math.abs(p - mdi[i])) / sum : 0;
  });
  const adxSeries = ema(dx, period);
  return clamp(adxSeries[adxSeries.length - 1] ?? 0, 0, 100);
}

/** ATR as a percentage of last price (volatility proxy). */
export function atrPct(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0;
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }
  const atr = ema(tr, period);
  const last = candles[candles.length - 1].close;
  return last ? (atr[atr.length - 1] / last) * 100 : 0;
}

/** Normalized Bollinger band width over `period` closes. */
export function bollingerWidth(candles: Candle[], period = 20): number {
  if (candles.length < period) return 0;
  const closes = candles.slice(-period).map((c) => c.close);
  const mean = closes.reduce((a, b) => a + b, 0) / period;
  const variance =
    closes.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return mean ? (4 * sd) / mean : 0; // (upper-lower)/mean = 4σ/mean
}

/** Short-vs-long momentum, mapped to [-1, 1]. */
export function momentum(candles: Candle[]): number {
  if (candles.length < 30) return 0;
  const closes = candles.map((c) => c.close);
  const fast = ema(closes, 9).at(-1)!;
  const slow = ema(closes, 26).at(-1)!;
  return clamp(((fast - slow) / slow) * 12, -1, 1);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
