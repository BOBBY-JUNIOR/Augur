// ── JSON file persistence ───────────────────────────────────────────────────
// data/trades.json and data/weights.json are committed to the repo and serve as
// the public, verifiable trading log + weight-evolution record.

import { promises as fs } from "node:fs";
import path from "node:path";
import { SKILLS, type SkillId, type TradeRecord, type Weights } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");
const WEIGHTS_FILE = path.join(DATA_DIR, "weights.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function freshWeights(): Weights {
  const equal = 1 / SKILLS.length; // 0.2 each
  const weights = Object.fromEntries(
    SKILLS.map((s) => [s, equal])
  ) as Record<SkillId, number>;
  return {
    weights,
    updates: 0,
    updatedAt: new Date(0).toISOString(),
    history: [],
  };
}

export async function readTrades(): Promise<TradeRecord[]> {
  try {
    const raw = await fs.readFile(TRADES_FILE, "utf8");
    return JSON.parse(raw) as TradeRecord[];
  } catch {
    return [];
  }
}

export async function writeTrades(trades: TradeRecord[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(TRADES_FILE, JSON.stringify(trades, null, 2) + "\n", "utf8");
}

export async function readWeights(): Promise<Weights> {
  try {
    const raw = await fs.readFile(WEIGHTS_FILE, "utf8");
    const w = JSON.parse(raw) as Weights;
    if (!w.weights || Object.keys(w.weights).length !== SKILLS.length) {
      return freshWeights();
    }
    return w;
  } catch {
    return freshWeights();
  }
}

export async function writeWeights(w: Weights): Promise<void> {
  await ensureDir();
  await fs.writeFile(WEIGHTS_FILE, JSON.stringify(w, null, 2) + "\n", "utf8");
}
