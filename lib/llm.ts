// ── Rationale generation (provider-swappable LLM) ───────────────────────────
// Primary provider is Groq (OpenAI-compatible chat completions). The provider is
// selected by the LLM_PROVIDER env var, so MuleRun (or any OpenAI-compatible
// endpoint) can be swapped in later without touching the calling code.
//
//   LLM_PROVIDER=groq      → api.groq.com,    GROQ_API_KEY,    llama-3.3-70b-versatile
//   LLM_PROVIDER=mulerun   → api.mulerun.com, MULERUN_API_KEY, MULERUN_MODEL
//
// When the selected provider has no API key, a deterministic templated rationale
// is returned and flagged source:"simulated".

import type {
  AssetId,
  DataSource,
  Direction,
  Regime,
  SkillSignal,
  StrategyMode,
} from "./types";

export interface RationaleInput {
  asset: AssetId;
  regime: Regime;
  strategy: StrategyMode;
  direction: Direction;
  weightedScore: number;
  conviction: number;
  signals: SkillSignal[];
  weights: Record<string, number>;
}

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
}

function resolveProvider(): ProviderConfig {
  const provider = (process.env.LLM_PROVIDER ?? "groq").toLowerCase();
  if (provider === "mulerun") {
    return {
      name: "mulerun",
      baseUrl: process.env.MULERUN_BASE_URL ?? "https://api.mulerun.com/v1",
      apiKey: process.env.MULERUN_API_KEY,
      model: process.env.MULERUN_MODEL ?? "llama-3.3-70b-versatile",
    };
  }
  // Default: Groq.
  return {
    name: "groq",
    baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  };
}

const SYSTEM_PROMPT =
  "You are the reasoning layer of an automated crypto trading agent. " +
  "Given a market regime, a strategy mode, a final weighted consensus score, and " +
  "the individual skill signals that produced it, write a tight 2-3 sentence " +
  "rationale for the chosen action. Be concrete, reference the strongest agreeing " +
  "and dissenting skills, and never invent data not present in the inputs. No preamble.";

function buildUserPrompt(i: RationaleInput): string {
  const lines = i.signals
    .map(
      (s) =>
        `- ${s.skill}: score ${s.score.toFixed(2)} (conf ${s.confidence.toFixed(
          2
        )}, weight ${(i.weights[s.skill] ?? 0).toFixed(2)}) — ${s.note}`
    )
    .join("\n");
  return (
    `Asset: ${i.asset}\nRegime: ${i.regime}\nStrategy mode: ${i.strategy}\n` +
    `Decision: ${i.direction.toUpperCase()} | weighted score ${i.weightedScore.toFixed(
      2
    )} | conviction ${(i.conviction * 100).toFixed(0)}%\n\nSkill signals:\n${lines}\n\n` +
    `Explain why this is the right call for a ${i.regime} regime.`
  );
}

export async function generateRationale(
  input: RationaleInput
): Promise<{ text: string; source: DataSource }> {
  const cfg = resolveProvider();

  if (!cfg.apiKey) {
    console.warn(
      `[llm] no API key for provider "${cfg.name}" — falling back to template. ` +
        `Expected env var ${cfg.name === "mulerun" ? "MULERUN_API_KEY" : "GROQ_API_KEY"}.`
    );
  } else {
    try {
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.5,
          max_tokens: 220,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(input) },
          ],
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const j = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = j.choices?.[0]?.message?.content?.trim();
        if (text) return { text, source: "live" };
        console.warn(`[llm] ${cfg.name} ${cfg.model}: 200 OK but no content in response`);
      } else {
        const body = await res.text().catch(() => "");
        console.warn(
          `[llm] ${cfg.name} ${cfg.model} request failed: ${res.status} ${res.statusText} — ${body.slice(0, 300)}`
        );
      }
    } catch (err) {
      console.warn(
        `[llm] ${cfg.name} ${cfg.model} request threw: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { text: templateRationale(input), source: "simulated" };
}

/** Deterministic fallback so the agent always produces a readable rationale. */
function templateRationale(i: RationaleInput): string {
  const ranked = [...i.signals].sort(
    (a, b) =>
      Math.abs(b.score) * (i.weights[b.skill] ?? 0) -
      Math.abs(a.score) * (i.weights[a.skill] ?? 0)
  );
  const lead = ranked[0];
  const dissent = [...i.signals].sort((a, b) => a.score - b.score);
  const bear = dissent[0];
  const bull = dissent[dissent.length - 1];

  if (i.direction === "flat") {
    return (
      `Holding ${i.asset} flat: the ${i.regime} regime selects a ${i.strategy} posture, ` +
      `but the weighted consensus of ${i.weightedScore.toFixed(2)} (conviction ` +
      `${(i.conviction * 100).toFixed(0)}%) sits below the action threshold. ` +
      `${bull.skill} (${bull.score.toFixed(2)}) and ${bear.skill} (${bear.score.toFixed(
        2
      )}) disagree enough that standing aside is the higher-expectancy choice.`
    );
  }
  const dir = i.direction === "long" ? "long" : "short";
  return (
    `Going ${dir} on ${i.asset}. The ${i.regime} regime favors a ${i.strategy} approach, and ` +
    `${lead.skill} leads the consensus at ${lead.score.toFixed(2)} (${lead.note}). ` +
    `Net weighted score ${i.weightedScore.toFixed(2)} clears the conviction bar at ` +
    `${(i.conviction * 100).toFixed(0)}%, with ${
      i.direction === "long" ? bear.skill : bull.skill
    } the main dissent — sized accordingly.`
  );
}
