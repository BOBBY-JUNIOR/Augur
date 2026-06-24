import Link from "next/link";
import { Reveal, RevealOnScroll } from "@/components/Reveal";
import { Logo } from "@/components/Logo";

const SKILLS = [
  ["@macro-analyst", "Slow regime & risk backdrop"],
  ["@sentiment-analyst", "Crowd positioning & momentum"],
  ["@technical-analysis", "Trend strength, volatility, structure"],
  ["@market-intel", "Order flow & volume confirmation"],
  ["@news-briefing", "Catalysts & headline reversals"],
];

const THESIS = [
  {
    tag: "01 — Problem",
    title: "One lens, one blind spot",
    body: "A momentum rule bleeds in chop. A fade system gets run over in a breakout. Markets change regime underneath a fixed strategy, and no single signal is right across all of them.",
  },
  {
    tag: "02 — Approach",
    title: "Read the regime, then vote",
    body: "Five skills score each asset from −1 to +1. Augur classifies the regime first — trending, ranging, or unclear — then takes a confidence-weighted vote. Trend-follow when trending. Mean-revert when ranging. Flat when unclear.",
  },
  {
    tag: "03 — Why an agent",
    title: "Judgment, not a formula",
    body: "Synthesizing five live signals, re-reading the regime, re-weighting the vote, and writing the reasoning — every cycle, across three assets — is continuous judgment. It cannot be hard-coded into one rule.",
  },
  {
    tag: "04 — What's novel",
    title: "It grades its own sources",
    body: "After every trade closes, each skill's call is checked against the move and its weight is nudged up or down. The committee that votes tomorrow is shaped by who was right yesterday.",
  },
];

const CYCLE = [
  ["Perceive", "Pull five skill scores for BTC, ETH, and the meme coin."],
  ["Classify", "Read ADX trend strength and volatility into a regime label."],
  ["Vote", "Weight each score by the skill's learned weight and confidence."],
  ["Decide", "Trend-follow, mean-revert, or stay flat past a conservative bar."],
  ["Explain", "Write a natural-language rationale via Groq."],
  ["Learn", "Log it; on close, re-weight every skill by its accuracy."],
];

export default function Home() {
  return (
    <main className="bg-warroom">
      {/* ── Hero ── */}
      <section className="bg-rule border-b border-line">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16">
          <Reveal>
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <span className="font-display text-xl text-cream">Augur</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="display mt-12 max-w-4xl text-5xl leading-[1.05] sm:text-7xl">
              Five signals. One <em>vote</em>. No emotion.
            </h1>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-mute">
              Augur reads five Bitget Skill Hub signals, weights each one by how
              right it has been, switches strategy with the market regime, and
              writes the reasoning behind every call. BTC, ETH, and a meme coin —
              paper-traded, fully logged, verifiable.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="btn btn-primary">
                Open the war room
              </Link>
              <Link href="/logs" className="btn">
                Read the trade log
              </Link>
            </div>
          </Reveal>

          {/* Stat strip */}
          <Reveal delay={0.25}>
            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-px overflow-hidden border border-line bg-line">
              {[
                ["5", "Skills voting"],
                ["3", "Assets watched"],
                ["100%", "Decisions logged"],
              ].map(([n, l]) => (
                <div key={l} className="bg-oxblood px-5 py-6">
                  <div className="stat-num text-4xl text-amber">{n}</div>
                  <div className="eyebrow mt-2">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Skill roster ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <RevealOnScroll>
          <p className="eyebrow">The committee</p>
          <h2 className="display mt-3 text-3xl">Five skills, one ballot</h2>
        </RevealOnScroll>
        <div className="mt-8 border-t border-line">
          {SKILLS.map(([handle, role], i) => (
            <RevealOnScroll key={handle} delay={i * 0.04}>
              <div className="flex flex-col gap-1 border-b border-line py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <span className="mono w-64 shrink-0 text-sm text-amber">
                  {handle}
                </span>
                <span className="text-mute">{role}</span>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ── Old way / Augur way comparison ── */}
      <section className="border-y border-line bg-oxblood-2">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <RevealOnScroll>
            <p className="eyebrow">The difference</p>
          </RevealOnScroll>
          <div className="mt-8 grid gap-px sm:grid-cols-2">
            <RevealOnScroll>
              <div className="h-full pr-0 sm:border-r sm:border-line sm:pr-12">
                <h3 className="font-display text-2xl italic text-faint">
                  The old way
                </h3>
                <ul className="mt-6 space-y-4 text-mute">
                  {[
                    "Single strategy, fixed assumptions.",
                    "Same logic in every market.",
                    "One opinion, never re-checked.",
                    "Silent when it's wrong.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mono text-faint">—</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.08}>
              <div className="h-full pt-10 sm:pl-12 sm:pt-0">
                <h3 className="font-display text-2xl italic text-amber">
                  The Augur way
                </h3>
                <ul className="mt-6 space-y-4 text-cream">
                  {[
                    "Five signals, weighted by track record.",
                    "Strategy switches with the regime.",
                    "Sources graded after every close.",
                    "Every call logged with its reasoning.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mono text-amber">+</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── Thesis ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <RevealOnScroll>
          <p className="eyebrow">The thesis</p>
        </RevealOnScroll>
        <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2">
          {THESIS.map((t, i) => (
            <RevealOnScroll key={t.tag} delay={i * 0.05}>
              <article className="h-full bg-oxblood p-8">
                <p className="eyebrow text-amber">{t.tag}</p>
                <h3 className="display mt-4 text-2xl">{t.title}</h3>
                <p className="mt-3 leading-relaxed text-mute">{t.body}</p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ── One cycle ── */}
      <section className="border-t border-line bg-oxblood-2">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <RevealOnScroll>
            <p className="eyebrow">One cycle</p>
            <h2 className="display mt-3 text-3xl">
              Perceive, decide, log, <em>learn</em>
            </h2>
          </RevealOnScroll>
          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {CYCLE.map(([h, b], i) => (
              <RevealOnScroll key={h} delay={i * 0.04}>
                <div className="h-full bg-oxblood p-6">
                  <span className="mono text-xs text-amber">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mt-3 font-display text-lg text-cream">{h}</div>
                  <div className="mt-1 text-sm leading-snug text-mute">{b}</div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-sm text-faint">
            Built on Bitget Skill Hub · rationale by Groq · paper-traded, no live
            execution. Every decision logged to{" "}
            <span className="mono text-mute">data/trades.json</span>.
          </p>
        </div>
      </footer>
    </main>
  );
}
