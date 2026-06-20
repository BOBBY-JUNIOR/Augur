import { NextResponse } from "next/server";
import { runCycle } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Trigger one perception → decision → log cycle. Callable by cron or manually. */
export async function POST() {
  try {
    const result = await runCycle();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// Convenience for demo / cron GET pings.
export const GET = POST;
