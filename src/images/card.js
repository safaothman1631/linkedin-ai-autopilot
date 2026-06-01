// card.js — render the precise overlay on top of the (AI or gradient) background.
// This is the half that guarantees the image EXACTLY matches the post: every
// headline, bullet, table cell and tag is drawn from the same content object
// used for the caption. Output: a 1200x1200 PNG (LinkedIn square).
import fs from "node:fs";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

const W = 1200, H = 1200, PAD = 80;

// ---- fonts: register a real family if we can find one, else system default ---
let FAMILY = "sans-serif";
(() => {
  const candidates = [
    ["/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf", "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"],
    ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
    ["/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"],
    ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/segoeui.ttf"],
    ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf"],
  ];
  for (const [bold, reg] of candidates) {
    try {
      if (fs.existsSync(bold) && fs.existsSync(reg)) {
        GlobalFonts.registerFromPath(reg, "Brand");
        GlobalFonts.registerFromPath(bold, "Brand"); // weight resolved via "bold" keyword
        FAMILY = "Brand";
        break;
      }
    } catch { /* keep trying */ }
  }
})();

const COLORS = {
  bg0: "#0B1020", bg1: "#161E36",
  text: "#F8FAFC", muted: "#9AA7BD", line: "rgba(255,255,255,0.10)",
  panel: "rgba(255,255,255,0.05)", panelStrong: "rgba(255,255,255,0.08)",
};
const ACCENT = {
  claude: { a: "#8B7CF6", soft: "rgba(139,124,246,0.18)", label: "CLAUDE SKILL" },
  models: { a: "#22D3EE", soft: "rgba(34,211,238,0.16)", label: "MODEL FACE-OFF" },
  erp: { a: "#34D399", soft: "rgba(52,211,153,0.16)", label: "ERPIQ DEEP-DIVE" },
};

const font = (px, weight = "") => `${weight} ${px}px ${FAMILY}`.trim();

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrap(ctx, text, maxW) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// shrink font until the text fits in <= maxLines
function fitLines(ctx, text, maxW, startPx, minPx, maxLines, weight = "bold") {
  let px = startPx;
  while (px > minPx) {
    ctx.font = font(px, weight);
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines) return { lines, px };
    px -= 3;
  }
  ctx.font = font(minPx, weight);
  return { lines: wrap(ctx, text, maxW).slice(0, maxLines), px: minPx };
}

function ellipsize(ctx, text, maxW) {
  let t = String(text || "");
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function drawBackground(ctx, bgImg, accent) {
  // base gradient (also the fallback when no AI image)
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, COLORS.bg0); g.addColorStop(1, COLORS.bg1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  if (bgImg) {
    const s = Math.max(W / bgImg.width, H / bgImg.height);
    const dw = bgImg.width * s, dh = bgImg.height * s;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    // darken so overlaid text stays readable
    const sc = ctx.createLinearGradient(0, 0, 0, H);
    sc.addColorStop(0, "rgba(8,11,22,0.62)");
    sc.addColorStop(0.55, "rgba(8,11,22,0.72)");
    sc.addColorStop(1, "rgba(8,11,22,0.90)");
    ctx.fillStyle = sc; ctx.fillRect(0, 0, W, H);
  } else {
    // procedural accent glow for the gradient-only path
    const rg = ctx.createRadialGradient(W * 0.82, H * 0.12, 40, W * 0.82, H * 0.12, 720);
    rg.addColorStop(0, accent.soft); rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  // thin accent rule top
  ctx.fillStyle = accent.a; ctx.fillRect(0, 0, W, 8);
}

function drawHeader(ctx, accent, brand) {
  const y = PAD, h = 46;
  // pillar pill
  ctx.font = font(22, "bold");
  const label = accent.label;
  const tw = ctx.measureText(label).width;
  const pw = tw + 56;
  ctx.fillStyle = accent.soft; roundRect(ctx, PAD, y, pw, h, 23); ctx.fill();
  ctx.fillStyle = accent.a; ctx.beginPath(); ctx.arc(PAD + 26, y + h / 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.text; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillText(label, PAD + 42, y + h / 2 + 1);
  // date right
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  ctx.font = font(22, ""); ctx.fillStyle = COLORS.muted; ctx.textAlign = "right";
  ctx.fillText(date, W - PAD, y + h / 2 + 1);
  ctx.textAlign = "left";
  return y + h;
}

function drawTitle(ctx, content, accent, topY) {
  let y = topY + 56;
  ctx.fillStyle = COLORS.text; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  const { lines, px } = fitLines(ctx, content.headline, W - 2 * PAD, 78, 46, 2, "bold");
  ctx.font = font(px, "bold");
  for (const ln of lines) { y += px; ctx.fillText(ln, PAD, y); y += 12; }
  if (content.subhead) {
    y += 34; ctx.font = font(30, "bold"); ctx.fillStyle = accent.a;
    ctx.fillText(ellipsize(ctx, content.subhead, W - 2 * PAD), PAD, y);
    y += 6;
  }
  // divider
  y += 26; ctx.strokeStyle = COLORS.line; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  return y;
}

function drawFooter(ctx, accent, note, brand) {
  const y = H - 64;
  ctx.strokeStyle = COLORS.line; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, y - 26); ctx.lineTo(W - PAD, y - 26); ctx.stroke();
  ctx.textBaseline = "middle";
  const handle = (brand && brand.handle) || "";
  ctx.font = font(24, "bold"); ctx.fillStyle = COLORS.text; ctx.textAlign = "left";
  if (handle) ctx.fillText(handle, PAD, y);
  ctx.font = font(22, ""); ctx.fillStyle = COLORS.muted; ctx.textAlign = "right";
  if (note) ctx.fillText(note, W - PAD, y);
  ctx.textAlign = "left";
}

// ---- pillar bodies ----------------------------------------------------------
function bodyClaude(ctx, c, accent, topY) {
  let y = topY + 40;
  const items = (c.capabilities || []).slice(0, 4);
  const rowH = 118, x = PAD;
  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const ry = y + i * rowH;
    ctx.fillStyle = COLORS.panel; roundRect(ctx, x, ry, W - 2 * PAD, rowH - 16, 18); ctx.fill();
    // index chip
    ctx.fillStyle = accent.soft; roundRect(ctx, x + 18, ry + 22, 56, 56, 14); ctx.fill();
    ctx.fillStyle = accent.a; ctx.font = font(30, "bold"); ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillText(String(i + 1), x + 18 + 28, ry + 22 + 29);
    ctx.textAlign = "left";
    const tx = x + 100, tw = W - 2 * PAD - 120;
    ctx.fillStyle = COLORS.text; ctx.font = font(30, "bold");
    ctx.fillText(ellipsize(ctx, it.label || "", tw), tx, ry + 42);
    ctx.fillStyle = COLORS.muted; ctx.font = font(24, "");
    ctx.fillText(ellipsize(ctx, it.detail || "", tw), tx, ry + 78);
  }
  y += items.length * rowH + 6;
  // flow chips
  drawChipRow(ctx, "HOW IT WORKS", c.flow || [], accent, y, "→");
}

function bodyErp(ctx, c, accent, topY) {
  let y = topY + 40;
  const items = (c.features || []).slice(0, 4);
  const rowH = 112, x = PAD;
  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const ry = y + i * rowH;
    ctx.fillStyle = COLORS.panel; roundRect(ctx, x, ry, W - 2 * PAD, rowH - 16, 18); ctx.fill();
    // accent tick
    ctx.fillStyle = accent.a; roundRect(ctx, x + 18, ry + 24, 8, rowH - 64, 4); ctx.fill();
    const tx = x + 50, tw = W - 2 * PAD - 70;
    ctx.fillStyle = COLORS.text; ctx.font = font(30, "bold"); ctx.textBaseline = "alphabetic";
    ctx.fillText(ellipsize(ctx, it.label || "", tw), tx, ry + 44);
    ctx.fillStyle = COLORS.muted; ctx.font = font(24, "");
    ctx.fillText(ellipsize(ctx, it.detail || "", tw), tx, ry + 78);
  }
  y += items.length * rowH + 6;
  drawChipRow(ctx, "STACK", c.stackChips || [], accent, y, null);
  if (c.metric) {
    ctx.font = font(24, "bold"); ctx.fillStyle = accent.a; ctx.textBaseline = "alphabetic";
    ctx.fillText(ellipsize(ctx, c.metric, W - 2 * PAD), PAD, y + 92);
  }
}

function bodyModels(ctx, c, accent, topY) {
  const x = PAD, fullW = W - 2 * PAD;
  const axisW = 300, colW = (fullW - axisW) / 3;
  const rows = (c.table || []).slice(0, 5);
  const headH = 78;
  const bottomLimit = H - 150; // leave room for verdict + footer
  let y = topY + 28;
  const rowH = Math.max(58, Math.min(86, (bottomLimit - y - headH) / Math.max(rows.length, 1)));

  // header: model names
  for (let j = 0; j < 3; j++) {
    const cx = x + axisW + j * colW;
    ctx.fillStyle = accent.soft; roundRect(ctx, cx + 6, y, colW - 12, headH - 10, 14); ctx.fill();
    ctx.fillStyle = COLORS.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const name = (c.models || [])[j] || "—";
    const { lines, px } = fitLines(ctx, name, colW - 28, 25, 17, 2, "bold");
    ctx.font = font(px, "bold");
    const startY = y + (headH - 10) / 2 - ((lines.length - 1) * (px + 2)) / 2;
    lines.forEach((ln, k) => ctx.fillText(ln, cx + colW / 2, startY + k * (px + 2)));
  }
  ctx.textAlign = "left";
  let ry = y + headH;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i % 2 === 0) { ctx.fillStyle = COLORS.panel; roundRect(ctx, x, ry, fullW, rowH - 8, 12); ctx.fill(); }
    // axis label
    ctx.fillStyle = COLORS.muted; ctx.font = font(23, "bold"); ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(ellipsize(ctx, row.axis, axisW - 24), x + 18, ry + (rowH - 8) / 2);
    // cells
    ctx.textAlign = "center";
    for (let j = 0; j < 3; j++) {
      const cx = x + axisW + j * colW;
      ctx.fillStyle = COLORS.text; ctx.font = font(24, "");
      ctx.fillText(ellipsize(ctx, (row.cells || [])[j] ?? "—", colW - 20), cx + colW / 2, ry + (rowH - 8) / 2);
    }
    ctx.textAlign = "left";
    ry += rowH;
  }
  // verdict band
  if (c.verdict) {
    const vy = ry + 14;
    ctx.fillStyle = accent.soft; roundRect(ctx, x, vy, fullW, 70, 16); ctx.fill();
    ctx.fillStyle = accent.a; ctx.font = font(22, "bold"); ctx.textBaseline = "middle";
    ctx.fillText("VERDICT", x + 22, vy + 35);
    ctx.fillStyle = COLORS.text; ctx.font = font(24, "bold");
    const vx = x + 22 + ctx.measureText("VERDICT").width + 24;
    ctx.fillText(ellipsize(ctx, c.verdict, fullW - (vx - x) - 22), vx, vy + 35);
  }
}

function drawChipRow(ctx, label, items, accent, y, sep) {
  if (!items || !items.length) return;
  ctx.font = font(20, "bold"); ctx.fillStyle = COLORS.muted; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillText(label, PAD, y + 18);
  let cx = PAD, cy = y + 36;
  ctx.font = font(22, "bold");
  items.slice(0, 5).forEach((raw, i) => {
    const t = String(raw || "").trim(); if (!t) return;
    const tw = ctx.measureText(t).width, cw = tw + 34;
    if (cx + cw > W - PAD) return; // keep to one row
    ctx.fillStyle = accent.soft; roundRect(ctx, cx, cy, cw, 44, 22); ctx.fill();
    ctx.fillStyle = COLORS.text; ctx.fillText(t, cx + 17, cy + 29);
    cx += cw + 14;
    if (sep && i < items.length - 1 && cx + 24 < W - PAD) {
      ctx.fillStyle = accent.a; ctx.fillText(sep, cx - 2, cy + 29); cx += 24;
    }
  });
}

const BODIES = { claude: bodyClaude, models: bodyModels, erp: bodyErp };

export async function renderCard({ pillar, content, bg, brand, file }) {
  const accent = ACCENT[pillar] || ACCENT.claude;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  let bgImg = null;
  if (bg) { try { bgImg = await loadImage(bg); } catch { bgImg = null; } }

  drawBackground(ctx, bgImg, accent);
  const afterHeader = drawHeader(ctx, accent, brand);
  const afterTitle = drawTitle(ctx, content, accent, afterHeader);
  (BODIES[pillar] || bodyClaude)(ctx, content, accent, afterTitle);
  const note = pillar === "models"
    ? "As of " + new Date().toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) + " · verify specifics"
    : (brand && brand.tagline) || "";
  drawFooter(ctx, accent, note, brand);

  const out = canvas.toBuffer("image/png");
  fs.writeFileSync(file, out);
  return file;
}
