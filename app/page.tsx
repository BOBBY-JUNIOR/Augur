import Link from "next/link";
import { Reveal, RevealOnScroll } from "@/components/Reveal";

const SKILLS = [
  { name: "Macro Analyst", role: "Slow-moving regime & risk backdrop" },
  { name: "Sentiment Analyst", role: "Crowd positioning & reflexive momentum" },
  { name: "Technical Analysis", role: "Trend strength, volatility, structure" },
  { name: "Market Intel", role: "Order flow & volume confirmation" },
  { name: "News Briefing", role: "Catalysts & headline-driven reversals" },
];

const THESIS = [
  {
    tag: "Problem",
    title: "One model, one lens, one blind spot",
    body: "Most automated strategies commit to a single view of the market — a momentum rule, a mean-reversion band, one model's opinion. That works until the regime changes underneath it. A trend system bleeds in chop; a fade system gets run over in a breakout. The market is not one thing, and no single signal is right across all of them.",
  },
  {
    tag: "Approach",
    title: "Five signals, one weighted vote, switched by regime",
    body: "This agent consults five Bitget Skill Hub skills every cycle, each scoring an asset from -1 (bearish) to +1 (bullish). It first classifies the regime from technical structure — trending, ranging, or unclear — then runs a confidence-weighted consensus vote. Trend-follow when trending, mean-revert when ranging, stand flat when unclear. Direction only fires when conviction clears a deliberately conservative threshold.",
  },
  {
    tag: "Why an agent",
    title: "Continuous synthesis no static script can do",
    body: "Fusing five independent perception streams, re-classifying the regime, re-weighting the vote, writing a defensible rationale, and logging it — every cycle, across three assets — is a synthesis task, not a rule. It needs a system that perceives broadly and reasons over the combination in natural language. That is agent-shaped work, not a backtest formula.",
  },
  {
    tag: "What's novel",
    title: "It grades its own sources and re-weights them",
    body: "After every simulated trade closes, the agent checks each skill's call against what price actually did and nudges that skill's weight up or down — an exponential adjustment, clamped and renormalized. Skills that prove right earn more of the vote; skills that prove wrong lose it. The committee that decides tomorrow is shaped by who was right yesterday. Every decision, flat ones included, is logged to a public JSON file.",
  },
];

export default function Home() {
  return (
    <main className="bg-aurora">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 sm:pt-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 live-dot" />
              Bitget AI Hackathon S1 · Trading Agent Track
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
              An agent that takes a{" "}
              <span className="text-gradient">weighted vote</span> of five market
              minds — and re-grades them as it learns.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
              <span className="font-medium text-gray-200">Augur</span> reads the
              signs and explains the call. It fuses five Bitget Skill Hub signals
              into a single conviction score, switches strategy by market regime,
              writes a natural-language rationale for every decision, and
              self-corrects the weight it gives each skill based on who has been
              right. BTC, ETH, and a meme coin — paper-traded, fully logged,
              verifiable.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="glass-hover rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-200 hover:scale-[1.02]"
              >
                Open live dashboard →
              </Link>
              <Link
                href="/logs"
                className="glass glass-hover rounded-xl px-5 py-2.5 text-sm font-medium text-gray-200 hover:scale-[1.02]"
              >
                Inspect the trade log
              </Link>
            </div>
          </Reveal>

          {/* Skill row */}
          <Reveal delay={0.32}>
            <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SKILLS.map((s) => (
                <div
                  key={s.name}
                  className="glass glass-hover rounded-2xl p-4"
                >
                  <div className="text-sm font-semibold text-white">{s.name}</div>
                  <div className="mt-1 text-xs leading-snug text-gray-400">
                    {s.role}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Thesis */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <RevealOnScroll>
          <h2 className="text-sm font-medium uppercase tracking-widest text-gray-500">
            The thesis
          </h2>
        </RevealOnScroll>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {THESIS.map((t, i) => (
            <RevealOnScroll key={t.tag} delay={i * 0.06}>
              <article className="glass glass-hover h-full rounded-2xl p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  {t.tag}
                </span>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {t.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  {t.body}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* How a cycle runs */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <RevealOnScroll>
          <div className="glass rounded-2xl p-7">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              What happens in one cycle
            </h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Perceive", "Pull all five skill scores for BTC, ETH, and the meme coin from the Skill Hub."],
                ["Classify regime", "Read ADX-style trend strength + volatility bands to label trending / ranging / unclear."],
                ["Weighted vote", "Combine scores by each skill's learned weight and confidence into one conviction number."],
                ["Decide", "Trend-follow, mean-revert, or stay flat — only acting past a conservative threshold."],
                ["Explain", "Generate a natural-language rationale for the call via the MuleRun API."],
                ["Log & learn", "Write the decision to data/trades.json; on close, re-weight every skill by its accuracy."],
              ].map(([h, b], i) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-cyan-300">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white">{h}</div>
                    <div className="text-sm leading-snug text-gray-400">{b}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </RevealOnScroll>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-6xl px-5 text-sm text-gray-500">
          Built on Bitget Skill Hub · rationale by MuleRun · paper-traded, no live
          execution. Every decision logged to{" "}
          <code className="text-gray-400">data/trades.json</code>.
        </div>
      </footer>
    </main>
  );
}
