// CLI entry to run one (or N) perception→decision→log cycles outside the server.
// Usage: npm run cycle [count]
import { runCycle } from "../lib/engine";

async function main() {
  const n = Math.max(1, Number(process.argv[2] ?? 1) || 1);
  for (let i = 0; i < n; i++) {
    const r = await runCycle();
    const live = r.decisions.every((d) => d.source === "live");
    console.log(
      `cycle ${i + 1}/${n} @ ${r.ranAt} — ${r.decisions.length} decisions, ` +
        `${r.closed.length} closed, source=${live ? "live" : "simulated"}`
    );
    for (const d of r.decisions) {
      console.log(
        `  ${d.asset.padEnd(8)} ${d.regime.padEnd(9)} ${d.strategy.padEnd(12)} ` +
          `${d.direction.toUpperCase().padEnd(5)} score=${d.weightedScore.toFixed(
            2
          )} conv=${(d.conviction * 100).toFixed(0)}%`
      );
    }
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
