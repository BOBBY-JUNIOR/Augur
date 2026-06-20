import { NextResponse } from "next/server";
import { readWeights } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Serve current skill weights + their evolution history (for the chart). */
export async function GET() {
  const weights = await readWeights();
  return NextResponse.json(weights);
}
