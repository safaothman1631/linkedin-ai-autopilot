// content.js — generate the day's English post + structured card data with Gemini.
// One generator, three pillar-specific prompts. Returns an object whose fields
// feed BOTH the LinkedIn caption (post/hashtags) and the rendered card.

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

const monthYear = () =>
  new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

// Shared rules so every pillar reads like a senior engineer wrote it.
const BASE = `You are a senior AI/software engineer writing a single LinkedIn post (English only).
Audience: technical practitioners, founders, and engineering managers. Be advanced, specific and accurate.
Hard rules:
- NO hype, NO clichés ("game-changer", "revolutionary"), NO emojis inside the card fields.
- Every line must carry concrete, correct information. If you are unsure of a number, do NOT invent it — use "—".
- The written post is 110-180 words: a strong first-line hook, 3-4 substantive lines, then one question as CTA.
- Return STRICT JSON only (no markdown fences, no commentary).`;

function claudePrompt(skill) {
  return `${BASE}

TOPIC: A deep, advanced explainer of the Claude / Claude Code capability: "${skill.title}".
GROUNDING (accurate, expand on it — do not contradict it): ${skill.brief}

Return JSON with EXACTLY these keys:
{
  "headline": "${skill.title}",
  "subhead": "a 4-8 word precise descriptor of what it is",
  "capabilities": [ {"label":"2-4 words","detail":"a concrete 5-9 word specific"} , ...exactly 4 ],
  "flow": ["3-4 short steps of how it actually works, 2-4 words each"],
  "useCase": "one concrete engineering use case, max 12 words",
  "post": "the full LinkedIn post, 110-180 words, English, hook + insight + CTA question",
  "hashtags": ["#Claude","#AI","#...","#...","#..."],
  "altText": "one factual sentence describing the image for accessibility",
  "imagePrompt": "a vivid art-direction prompt for an abstract, premium, dark tech BACKGROUND image (no text, no UI, no charts) that thematically matches this capability"
}`;
}

function modelsPrompt(trio) {
  return `${BASE}

TOPIC: A balanced head-to-head comparison of three models in the category "${trio.category}".
CONTENDERS (use these exact display names): ${trio.models.map((m) => `"${m}"`).join(", ")}.
COMPARE ON THESE AXES (one table row each, in this order): ${trio.axes.map((a) => `"${a}"`).join(", ")}.
Accuracy rules for the table: put a SHORT cell (1-3 words or a number) for each model on each axis.
Only state figures that are publicly documented and you are confident about; otherwise use "—".
This is as of ${monthYear()}; do not fabricate benchmark scores.

Return JSON with EXACTLY these keys:
{
  "headline": "${trio.category}",
  "subhead": "a 4-8 word framing of the comparison",
  "models": ["${trio.models[0]}","${trio.models[1]}","${trio.models[2]}"],
  "table": [ {"axis":"${trio.axes[0]}","cells":["m1","m2","m3"]}, ... one row per axis, same order ],
  "verdict": "a balanced one-line takeaway: who wins for what, max 16 words",
  "post": "the full LinkedIn post, 110-180 words, English, hook + the real trade-offs + CTA question",
  "hashtags": ["#AI","#LLM","#...","#...","#..."],
  "altText": "one factual sentence describing the comparison image for accessibility",
  "imagePrompt": "a vivid art-direction prompt for an abstract, premium, dark tech BACKGROUND image (no text, no logos, no charts) evoking a three-way comparison"
}`;
}

function erpPrompt(topic) {
  return `${BASE}

TOPIC: A deep, advanced spotlight on ONE module of a real production ERP called "ERPIQ" (an Iraq-first SMB ERP).
MODULE: "${topic.title}".
GROUNDING (factual — expand, never contradict): ${topic.brief}
Write as the engineer who built it: explain what it does, why the design choices matter, and the hard problem it solves.
Keep it product-credible and Iraq/SMB-aware. Do not invent features beyond the grounding; deepen what's given.

Return JSON with EXACTLY these keys:
{
  "headline": "${topic.title}",
  "subhead": "a 4-8 word precise descriptor",
  "features": [ {"label":"2-4 words","detail":"a concrete 5-9 word specific"} , ...exactly 4 ],
  "stackChips": ["3-5 short tech/standard tags, e.g. FastAPI, Firestore, RBAC"],
  "metric": "one credible impact line, max 12 words (no fake numbers)",
  "post": "the full LinkedIn post, 110-180 words, English, hook + engineering depth + CTA question",
  "hashtags": ["#ERP","#FastAPI","#...","#...","#..."],
  "altText": "one factual sentence describing the image for accessibility",
  "imagePrompt": "a vivid art-direction prompt for an abstract, premium, dark tech BACKGROUND image (no text, no UI screenshots, no charts) evoking enterprise software and data flow"
}`;
}

const PROMPTS = { claude: claudePrompt, models: modelsPrompt, erp: erpPrompt };

export async function generatePostContent({ pillar, topic, apiKey }) {
  const build = PROMPTS[pillar];
  if (!build) throw new Error(`unknown pillar: ${pillar}`);
  const prompt = build(topic);

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      // a touch cooler for "models" so it stays conservative on facts
      temperature: pillar === "models" ? 0.5 : 0.75,
      responseMimeType: "application/json",
    },
  };

  let raw = null, lastErr = "";
  for (const model of MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const data = await r.json();
        raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("content model:", model);
        break;
      }
      lastErr = `${model} -> ${r.status}`;
    } catch (e) {
      lastErr = `${model} -> ${e.message}`;
    }
  }
  if (!raw) throw new Error(`All Gemini text models failed. Last: ${lastErr}`);

  let obj;
  try {
    obj = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("content model did not return valid JSON:\n" + raw.slice(0, 400));
  }

  // safety defaults so the renderer never crashes on a missing field
  obj.headline ||= topic.title || topic.category || "Update";
  obj.subhead ||= "";
  obj.hashtags = Array.isArray(obj.hashtags) ? obj.hashtags.slice(0, 6) : ["#AI"];
  obj.post ||= obj.subhead || obj.headline;
  obj.altText ||= obj.subhead || obj.headline;
  obj.imagePrompt ||= "abstract premium dark technology background, soft gradients, depth of field";
  if (pillar === "claude") {
    obj.capabilities = ensureItems(obj.capabilities, 4);
    obj.flow = Array.isArray(obj.flow) ? obj.flow.slice(0, 4) : [];
  } else if (pillar === "models") {
    obj.models = Array.isArray(obj.models) && obj.models.length === 3 ? obj.models : topic.models;
    obj.table = Array.isArray(obj.table) ? obj.table.filter((r) => r && r.axis).slice(0, 6) : [];
    obj.table = obj.table.map((r) => ({ axis: r.axis, cells: padCells(r.cells) }));
  } else if (pillar === "erp") {
    obj.features = ensureItems(obj.features, 4);
    obj.stackChips = Array.isArray(obj.stackChips) ? obj.stackChips.slice(0, 5) : [];
  }
  return obj;
}

function ensureItems(arr, n) {
  const out = Array.isArray(arr) ? arr.filter((x) => x && (x.label || x.detail)) : [];
  while (out.length < n) out.push({ label: "", detail: "" });
  return out.slice(0, n);
}
function padCells(cells) {
  const out = Array.isArray(cells) ? cells.slice(0, 3) : [];
  while (out.length < 3) out.push("—");
  return out.map((c) => (c == null || c === "" ? "—" : String(c)));
}
