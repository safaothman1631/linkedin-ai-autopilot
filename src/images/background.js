// background.js — generate an AI background image with Gemini (the "hybrid"
// half: AI art behind, precise text rendered on top in card.js).
// Returns a PNG/JPEG Buffer, or null so the caller falls back to a gradient.
// Cost-safe: tries free image models and gives up quietly on failure.

const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
];

const STYLE_SUFFIX =
  "Abstract, premium, modern. Dark navy/charcoal base with subtle accent glow. " +
  "Soft depth of field, fine grain, cinematic lighting. " +
  "NO text, NO words, NO letters, NO logos, NO charts, NO UI, NO watermark. " +
  "Leave the composition calm and uncluttered so overlaid text stays readable.";

export async function makeBackground({ apiKey, prompt, mode = "hybrid" }) {
  if (!apiKey || mode === "gradient") return null;

  const fullPrompt = `${prompt}. ${STYLE_SUFFIX}`;
  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ["IMAGE"], temperature: 0.9 },
  };

  for (const model of IMAGE_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        console.warn(`bg model ${model} -> ${r.status}`);
        continue;
      }
      const data = await r.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const img = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
      const b64 = img?.inlineData?.data || img?.inline_data?.data;
      if (b64) {
        console.log("background model:", model);
        return Buffer.from(b64, "base64");
      }
    } catch (e) {
      console.warn(`bg model ${model} error: ${e.message}`);
    }
  }
  console.warn("AI background unavailable — using gradient fallback.");
  return null;
}
