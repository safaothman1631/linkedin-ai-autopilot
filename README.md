# 🤖 LinkedIn AI Autopilot — ١٠٠٪ بەخۆڕایی

سیستەمێک کە **هەموو ڕۆژێک خۆکارانە** پۆستێکی LinkedIn + ڤیدیۆیەکی مۆشن گرافیک (HyperFrames) + دەنگ (Kokoro) + کاپشن دروست دەکات و بڵاودەکاتەوە — دەربارەی مۆدێل و فرەیمۆرکەکانی AI.

لەسەر **GitHub Actions** کاردەکات: بێ سێرڤەر، بێ کۆمپیوتەری داگیرساو، **خەرجی $0**.

---

## 🧠 چۆن کاردەکات

```
هەموو ڕۆژێک ٩:٠٠ (UTC)
   ↓
RSS (هەواڵی AI)  →  Gemini (دەق + سکریپت)  →  HyperFrames (ڤیدیۆ + دەنگ + کاپشن)
   ↓
Telegram (وەرگرتنی ڤیدیۆ)  →  LinkedIn (بڵاوکردنەوە)
```

---

## 🖼️ پایپلاینی وێنە (نوێ — ئێستا چالاکە)

دووەم ئۆتۆمەیشن: هەموو ڕۆژێک **٣ پۆستی وێنە + دیسکریپشن** بڵاودەکاتەوە (بە ئینگلیزی، Hybrid: پاشبنەمای AI + دەقی ڕاست لەسەری). هەر ستوونێک کاتی خۆی هەیە بۆ reachی باشتر:

```
٠٨:٠٠ UTC →  Claude Skill   (هەموو ڕۆژێ سکیڵێکی نوێ، بە قووڵی)
١٢:٠٠ UTC →  Model Face-off (بەراوردی ٣ مۆدێل، چەرخینەوەی لیست)
١٦:٠٠ UTC →  ERPIQ Deep-dive(هەموو ڕۆژێ مۆدیوڵێکی ERPـەکەت)
        ↓
Gemini (دەق + داتای کارت)  →  AI background  →  کارتی ١٢٠٠×١٢٠٠
        ↓
Telegram (پێشبینین)  →  LinkedIn (وێنە + دیسکریپشن)
```

- **بابەتەکان** لە `src/images/topics.js` (٢٠ Claude skill · ١٠ بەراوردی مۆدێل · ٢٨ مۆدیوڵی ERPIQ). چەرخینەوە خۆکارە — هەر ڕۆژێ یەک بەرەو پێش.
- **ووۆرکفلۆ:** `.github/workflows/daily-images.yml` (٣ cron). بۆ تاقیکردنەوەی دەستی: تابی Actions → *Daily LinkedIn Image Posts* → Run workflow → `pillar` هەڵبژێرە (`claude`/`models`/`erp`/`all`).
- **ڤیدیۆکە پشووی پێدراوە:** `daily.yml`ـی scheduleـی لێ داخراوە؛ هێشتا بە دەستی دەکرێت Run بکرێت. بۆ گەڕاندنەوەی، cronـەکەی دووبارە بکەرەوە.
- **هیچ کلیلی نوێ پێویست نییە** — هەمان GEMINI / LinkedIn / Telegram secrets بەکاردێن.

---

## ✅ پێش دەستپێکردن — ٤ کلیل پێویستە

| کلیل | لەکوێ بیهێنیت |
|------|--------------|
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | @BotFather (تۆکن) + @userinfobot (chat id) |
| `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` | بە سکریپتی خوارەوە دروست دەکرێن |
| (LinkedIn) `CLIENT_ID` + `CLIENT_SECRET` | لە ئەپی LinkedIn Developer-ـت |

---

## 🚀 هەنگاوەکانی دامەزراندن

### هەنگاو ١ — ڕیپۆ دروست بکە
1. بچۆ بۆ **github.com** ← هەژمارێک دروست بکە (ئەگەر نییە).
2. ڕیپۆیەکی نوێ دروست بکە (**Private**) ← ناوی `linkedin-ai-autopilot`.
3. هەموو فایلەکانی ئەم فۆڵدەرە بار بکە (دوگمەی **Add file → Upload files**)، یان بە git پاڵی بنێ.

### هەنگاو ٢ — تۆکنی LinkedIn بهێنە (یەکجار)
1. لە ئەپی LinkedIn ← تابی **Auth** ← لە **Authorized redirect URLs** ئەمە زیاد بکە:
   ```
   http://localhost:8000/callback
   ```
2. لەسەر کۆمپیوتەرەکەت (پێویستی بە **Node 22** هەیە)، لەناو فۆڵدەرەکە:
   ```bash
   npm install
   node tools/get-linkedin-token.js <CLIENT_ID> <CLIENT_SECRET>
   ```
3. لینکەکە بکەرەوە ← پەسەند بکە ← سکریپتەکە **ACCESS_TOKEN** و **PERSON_URN**ـت پێدەدات. کۆپیان بکە.

### هەنگاو ٣ — Secrets زیاد بکە
لە ڕیپۆکە: **Settings → Secrets and variables → Actions → New repository secret**. ئەمانە زیاد بکە:

```
GEMINI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
LINKEDIN_ACCESS_TOKEN
LINKEDIN_PERSON_URN
```
ئارەزوومەندانە (بۆ نوێکردنەوەی خۆکاری تۆکن): `LINKEDIN_REFRESH_TOKEN`، `LINKEDIN_CLIENT_ID`، `LINKEDIN_CLIENT_SECRET`.

### هەنگاو ٤ — تاقی بکەرەوە و چالاکی بکە
1. تابی **Actions** ← ئەگەر پرسیاری کرد، Actions چالاک بکە.
2. **Daily LinkedIn AI Post** هەڵبژێرە ← **Run workflow** (دەستی).
3. چاوەڕێ بکە (~٣–٦ خولەک) ← دەبێت ڤیدیۆکە لە Telegram بۆت بێت، و پۆست لە LinkedIn دەرچێت.
4. ئەگەر باش بوو، هیچ مەکە — هەموو ڕۆژێک خۆکارانە کاردەکات. ✅

---

## ⚙️ ڕێکخستن (Variables — ئارەزوومەندانە)

لە **Settings → Secrets and variables → Actions → Variables**:

| ناو | بەها | کارەکەی |
|-----|------|---------|
| `POST_MODE` | `auto` / `approve` / `off` | (ڤیدیۆ) `approve` = تەنها بۆ Telegram بنێرە |
| `TTS_VOICE` | `af_heart`, `am_adam`, `bf_emma`… | دەنگی ڤیدیۆ |
| `BRAND_HANDLE` | `@yourname` | لە ژێری ڤیدیۆ/وێنە پیشان دەدرێت |
| `IMAGES_POST_MODE` | `auto` / `approve` / `off` | (وێنە) `approve` = تەنها بۆ Telegram |
| `IMAGE_BG_MODE` | `hybrid` / `gradient` / `ai` | `hybrid` = پاشبنەمای AI + دەقی ڕاست · `gradient` = بەبێ AI |
| `BRAND_TAGLINE` | `AI · Engineering · ERPIQ` | دێڕی بچووکی ژێری کارت |

**کاتی پۆست بگۆڕە:** لە `.github/workflows/daily.yml` هێڵی `cron: "0 9 * * *"` بگۆڕە (بە UTC).

**ستایلی ڤیدیۆ بگۆڕە:** لە `src/video.js` ڕەنگەکان (`BG_A`, `ACCENT`…) و فۆنت/قەبارە بگۆڕە.

**سەرچاوەی هەواڵ بگۆڕە:** لە `src/run.js` ئەرەیی `FEEDS` دەستکاری بکە.

---

## 🔐 ئاگاداری — سەلامەتی

- ئەو کلیلانەی پێشتر لە سکرینشۆت نیشانت دا، باشترە **دووبارە دروستیان بکەیتەوە** (Gemini, Telegram, LinkedIn secret) و تەنها لێرە لە Secrets دایان بنێ.
- هەرگیز فایلی `.env` یان کلیلەکان **مەخە ناو ڕیپۆ گشتی**. (`.gitignore` پاراستووە.)

## 🩺 چارەسەری کێشە

- **LinkedIn نەیپۆست کرد؟** لەوانەیە پێویست بە وەشانی نوێتری API بێت — لە Variables، `LINKEDIN_VERSION` دابنێ بۆ بەروارێکی نوێتر وەک `202507`. هەروەها دڵنیابە ئەپەکەت پرۆدەکتی «Share on LinkedIn»ـی هەیە.
- **تۆکنی LinkedIn بەسەرچوو (~٦٠ ڕۆژ)؟** سکریپتی هەنگاو ٢ دووبارە بکەرەوە و `LINKEDIN_ACCESS_TOKEN` نوێ بکەرەوە. (یان REFRESH_TOKEN دابنێ بۆ نوێکردنەوەی خۆکار.)
- **Telegram هیچ نەنارد؟** دڵنیابە یەکجار نامەیەکت بۆ بۆتەکەت ناردووە، و `TELEGRAM_CHAT_ID` ڕاستە.
- **ڕێندەر شکست هێنا؟** Actions خۆی Chrome + FFmpeg دادەمەزرێنێت؛ جارێکی تر Run بکە (هەندێک جار یەکەم جار کاتی داگرتنی مۆدێلەکان زیاترە).

---

## 📁 پێکهاتەی فایلەکان

```
linkedin-ai-autopilot/
├── .github/workflows/
│   ├── daily.yml         # ڤیدیۆ (پشوودراو — schedule داخراوە)
│   └── daily-images.yml  # وێنە: ٣ پۆست/ڕۆژ (چالاک)
├── src/
│   ├── run.js          # ئۆرکێستراتەری ڤیدیۆ
│   ├── gemini.js       # نووسینی ناوەڕۆکی ڤیدیۆ
│   ├── video.js        # HyperFrames: دەنگ + ڤیدیۆ + کاپشن
│   ├── linkedin.js     # بڵاوکردنەوەی ڤیدیۆ + وێنە (REST API)
│   ├── telegram.js     # ئاگادارکردنەوە + sendPhoto
│   └── images/
│       ├── run-images.js   # ئۆرکێستراتەری وێنە (٣ ستوون)
│       ├── topics.js       # چەرخینەوەی بابەتەکان (Claude/Models/ERPIQ)
│       ├── content.js      # ناوەڕۆکی Gemini بۆ هەر ستوونێک
│       ├── background.js   # پاشبنەمای AI (Gemini image)
│       └── card.js         # ڕێندەری کارت ١٢٠٠×١٢٠٠ (napi-rs/canvas)
├── tools/get-linkedin-token.js   # هێنانی تۆکن (یەکجار)
├── package.json
├── .env.example
└── README.md
```

خەرجی: **$0/مانگ** · ڤیدیۆ بە HyperFrames (Apache 2.0) · دەنگ Kokoro · کاپشن Whisper.
