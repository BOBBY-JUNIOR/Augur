import { NextResponse } from "next/server";
import { readTrades } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Serve the raw paper-trading log (the verifiable submission artifact). */
export async function GET() {
  const trades = await readTrades();
  const closed = trades.filter((t) => t.status === "closed" && t.pnlPct != null);
  const cumPnl = closed.reduce((a, t) => a + (t.pnlPct ?? 0), 0);
  const wins = closed.filter((t) => (t.pnlPct ?? 0) > 0).length;
  return NextResponse.json({
    count: trades.length,
    summary: {
      closed: closed.length,
      open: trades.filter((t) => t.status === "open").length,
      flat: trades.filter((t) => t.status === "flat").length,
      cumulativePnlPct: cumPnl,
      winRate: closed.length ? wins / closed.length : 0,
    },
    trades,
  });
}
