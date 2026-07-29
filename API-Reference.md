# ZynaptiQ — Frontend API Specification

**Base URL:** `http://localhost:8000`  
**Content-Type:** `application/json` (all requests and responses)

---

## Overview

Two primary endpoints power the frontend:

| Endpoint | Purpose |
|---|---|
| `POST /predict` | Run full multimodal detection and return a single verdict |
| `POST /ablation/run` | Compare all 6 modality combinations side-by-side |

Both endpoints accept the **same request body shape**, so a single form on the frontend sends to both.

---

## POST /predict

**The main detection endpoint.** Runs each available model (text, image, media context) and fuses their scores into a single verdict. Returns the fused result **plus a per-model breakdown** so you can display which modality drove the decision.

### Request Body

```json
{
  "text": "string (required, 5–2000 chars)",
  "image": "string | null",
  "caption": "string (default: \"\")",
  "ocr_text": "string (default: \"\")",
  "media_context": "object | null"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | ✅ Yes | The political claim / post text to analyse |
| `image` | string \| null | No | Base64-encoded image. Accepts `data:image/jpeg;base64,...` prefix or raw base64 |
| `caption` | string | No | Post caption or article title — used for PCCS semantic alignment |
| `ocr_text` | string | No | Text extracted from the image via OCR. Empty = model uses neutral score |
| `media_context` | object \| null | No | Social/URL metadata object (see Media Context Fields below) |

**Fusion rule:**  
- Text only → `fused = prob_fake_text`  
- Text + image → `fused = (text + image) / 2`  
- Text + media → `fused = (text + media) / 2`  
- All three → `fused = (text + image + media) / 3`

### Request Examples

**Text only (simplest):**
```json
{
  "text": "Scientists warn vaccines caused 50,000 deaths in 2023!!"
}
```

**Text + image:**
```json
{
  "text": "Breaking: Senator caught taking bribes",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "caption": "Breaking: Senator caught taking bribes",
  "ocr_text": ""
}
```

**Text + media context:**
```json
{
  "text": "Breaking: Senator caught taking bribes",
  "media_context": {
    "domain_credibility_score": 0.1,
    "is_https": 1.0,
    "hashtag_count": 12.0,
    "title_exclamation_count": 2.0,
    "title_caps_word_count": 4.0,
    "has_author": 0.0,
    "platform": "TWITTER15",
    "domain_credibility_label": "low"
  }
}
```

**All three modalities:**
```json
{
  "text": "Breaking: Senator caught taking bribes",
  "image": "data:image/jpeg;base64,/9j/...",
  "caption": "Breaking: Senator caught taking bribes",
  "ocr_text": "BREAKING NEWS",
  "media_context": {
    "domain_credibility_score": 0.1,
    "hashtag_count": 12.0,
    "platform": "TWITTER15"
  }
}
```

### Response Body

```json
{
  "verdict": "FAKE",
  "prob_fake": 0.7231,
  "prob_real": 0.2769,
  "confidence": 0.7231,
  "modalities_used": ["text", "image", "media"],
  "fusion_formula": "equal_average(text, image, media)",

  "text": {
    "prob_fake": 0.6812,
    "prob_real": 0.3188,
    "confidence": 0.6812,
    "uncertainty": 0.2341,
    "verdict": "FAKE",
    "top_tokens": [
      { "token": "breaking", "weight": 0.1823 },
      { "token": "bribes",   "weight": 0.1541 },
      { "token": "senator",  "weight": 0.0912 }
    ],
    "features": {
      "ner": {
        "has_person": 1.0,
        "has_org": 0.0,
        "has_gpe": 0.0,
        "adj_adv_ratio": 0.125
      },
      "numeric": {
        "num_count": 0.0,
        "num_max": 0.0,
        "num_extreme": 0.0,
        "num_high": 0.0,
        "num_has_pct": 0.0,
        "num_pct_impossible": 0.0,
        "num_negative": 0.0,
        "num_log_max": 0.0,
        "num_variety": 0.0
      },
      "emotion": {
        "fear_score": 0.0,
        "anger_score": 0.0,
        "urgency_score": 0.5,
        "sarcasm_score": 0.0,
        "caps_ratio": 0.0,
        "excl_count": 0.0
      },
      "claim_count": 1.0
    },
    "text_normalized": "breaking senator caught taking bribes",
    "mc_passes": 30
  },

  "image": {
    "prob_fake": 0.7845,
    "prob_real": 0.2155,
    "confidence": 0.7845,
    "verdict": "FAKE",
    "pccs_score": 0.3210,
    "variant": "full"
  },

  "media": {
    "prob_fake": 0.7036,
    "prob_real": 0.2964,
    "confidence": 0.7036,
    "verdict": "FAKE",
    "top_signals": [
      { "feature": "domain_credibility_score", "attention": 0.1823, "value": 0.1 },
      { "feature": "hashtag_count",            "attention": 0.1541, "value": 12.0 },
      { "feature": "title_caps_word_count",    "attention": 0.0912, "value": 4.0 },
      { "feature": "has_author",               "attention": 0.0701, "value": 0.0 },
      { "feature": "title_exclamation_count",  "attention": 0.0654, "value": 2.0 }
    ]
  },

  "latency_ms": 412.3
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `verdict` | `"FAKE"` \| `"REAL"` | Final fused verdict |
| `prob_fake` | float [0–1] | Fused probability of misinformation |
| `prob_real` | float [0–1] | `1 - prob_fake` |
| `confidence` | float [0–1] | `max(prob_fake, prob_real)` |
| `modalities_used` | string[] | Which models contributed (e.g. `["text", "image"]`) |
| `fusion_formula` | string | Human-readable fusion description |
| `text` | object | Full text model result (always present) |
| `text.prob_fake` | float | Text model's probability of misinformation |
| `text.uncertainty` | float [0–1] | Model uncertainty via MC Dropout (0 = certain) |
| `text.top_tokens` | array | Top 12 tokens by attention weight `[{token, weight}]` |
| `text.features.ner` | object | Named-entity features (person/org/gpe detected, adj/adv ratio) |
| `text.features.numeric` | object | Numeric plausibility features |
| `text.features.emotion` | object | Emotion/sensationalism features |
| `text.text_normalized` | string | Preprocessed text actually sent to RoBERTa |
| `text.mc_passes` | int | Number of MC Dropout passes used (30) |
| `image` | object \| null | Image model result, or `null` if no image provided |
| `image.pccs_score` | float \| null | PCCS: semantic alignment score [0–1] (1 = consistent, 0 = contradictory) |
| `media` | object \| null | Media context model result, or `null` if no media_context provided |
| `media.top_signals` | array | Top 5 features by attention weight `[{feature, attention, value}]` |
| `latency_ms` | float | Total server-side processing time in milliseconds |

### Error Responses

| Status | Condition |
|---|---|
| `503` | Models not yet loaded (server starting up) |
| `422` | Validation error (e.g. `text` too short) |
| `500` | Internal model error |

```json
{ "detail": "Error message here" }
```

---

## POST /ablation/run

**Ablation study endpoint.** Runs all 6 modality combination variants on the same input and returns a comparison table. Use this to populate the ablation study panel in the UI.

### Request Body

**Exactly the same shape as `/predict`.**

```json
{
  "text": "string (required)",
  "image": "string | null",
  "caption": "string (default: \"\")",
  "ocr_text": "string (default: \"\")",
  "media_context": "object | null"
}
```

Variants that need a modality whose data was not provided are silently skipped and not returned.

### Response Body

```json
{
  "variants": [
    {
      "variant": "text_only",
      "active": { "text": true, "image": false, "social": false },
      "prob_fake": 0.6812,
      "prob_real": 0.3188,
      "verdict": "FAKE"
    },
    {
      "variant": "image_only",
      "active": { "text": false, "image": true, "social": false },
      "prob_fake": 0.7845,
      "prob_real": 0.2155,
      "verdict": "FAKE"
    },
    {
      "variant": "social_only",
      "active": { "text": false, "image": false, "social": true },
      "prob_fake": 0.7036,
      "prob_real": 0.2964,
      "verdict": "FAKE"
    },
    {
      "variant": "text_image",
      "active": { "text": true, "image": true, "social": false },
      "prob_fake": 0.7329,
      "prob_real": 0.2671,
      "verdict": "FAKE"
    },
    {
      "variant": "text_social",
      "active": { "text": true, "image": false, "social": true },
      "prob_fake": 0.6924,
      "prob_real": 0.3076,
      "verdict": "FAKE"
    },
    {
      "variant": "full_multimodal",
      "active": { "text": true, "image": true, "social": true },
      "prob_fake": 0.7231,
      "prob_real": 0.2769,
      "verdict": "FAKE"
    }
  ],

  "individual_scores": {
    "text": 0.6812,
    "image": 0.7845,
    "social": 0.7036
  },

  "best_variant": "image_only",
  "text_normalized": "breaking senator caught taking bribes",
  "latency_ms": 1203.5
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `variants` | array | List of variant results (only variants with all needed data) |
| `variants[].variant` | string | Variant name (see table below) |
| `variants[].active` | object | Which modalities are active `{text, image, social}` |
| `variants[].prob_fake` | float [0–1] | Fused fake probability for this variant |
| `variants[].prob_real` | float [0–1] | `1 - prob_fake` |
| `variants[].verdict` | `"FAKE"` \| `"REAL"` | Verdict for this variant |
| `individual_scores` | object | Raw prob_fake from each model before fusion |
| `individual_scores.text` | float | Text model raw score |
| `individual_scores.image` | float \| undefined | Image model raw score (if image provided) |
| `individual_scores.social` | float \| undefined | Media model raw score (if media_context provided) |
| `best_variant` | string \| null | Variant with highest confidence score |
| `text_normalized` | string \| null | Preprocessed text sent to RoBERTa |
| `latency_ms` | float | Total processing time in milliseconds |

### Variant Names

| Variant | Modalities | Fusion Formula |
|---|---|---|
| `text_only` | Text | `prob_fake_text` |
| `image_only` | Image | `prob_fake_image` |
| `social_only` | Media Context | `prob_fake_social` |
| `text_image` | Text + Image | `(text + image) / 2` |
| `text_social` | Text + Media | `(text + social) / 2` |
| `full_multimodal` | Text + Image + Media | `(text + image + social) / 3` |

---

## Media Context Fields Reference

Pass any subset of these inside `media_context`. Unknown keys are silently ignored. All fields are optional and default to safe values.

### Numeric Fields (all `float`, default `0.0`)

| Field | Description | Typical Range |
|---|---|---|
| `domain_credibility_score` | Source domain credibility [0–1] | 0.0–1.0 |
| `is_url_shortened` | URL is a shortener (bit.ly, etc.) | 0 or 1 |
| `url_domain_canonical_mismatch` | Domain ≠ canonical URL domain | 0 or 1 |
| `domain_length` | Character length of domain | 1–50 |
| `is_https` | Uses HTTPS | 0 or 1 |
| `has_og_tags` | Has Open Graph meta tags | 0 or 1 |
| `has_twitter_card` | Has Twitter card meta | 0 or 1 |
| `has_fb_appid` | Has Facebook App ID | 0 or 1 |
| `metadata_completeness` | Fraction of metadata fields filled [0–1] | 0.0–1.0 |
| `has_author` | Article has a named author | 0 or 1 |
| `has_publisher` | Article has a named publisher | 0 or 1 |
| `has_top_image` | Article has a primary image | 0 or 1 |
| `image_count` | Number of images in the article | 0–50 |
| `has_video` | Article contains video | 0 or 1 |
| `og_image_width` | OG image width in pixels | 0–4000 |
| `og_image_height` | OG image height in pixels | 0–4000 |
| `media_richness_score` | Combined media richness score | 0.0–1.0 |
| `text_word_count` | Word count of article text | 0–5000 |
| `title_exclamation_count` | Exclamation marks in title | 0–10 |
| `title_question_count` | Question marks in title | 0–10 |
| `title_caps_word_count` | ALL-CAPS words in title | 0–20 |
| `text_exclamation_count` | Exclamation marks in body text | 0–50 |
| `text_caps_word_count` | ALL-CAPS words in body text | 0–100 |
| `url_count_in_text` | Number of URLs in text | 0–20 |
| `hashtag_count` | Number of hashtags in post | 0–30 |
| `mention_count` | Number of @mentions | 0–20 |
| `emoji_count` | Number of emoji | 0–30 |
| `og_title_article_title_overlap` | Word overlap: OG title vs article title [0–1] | 0.0–1.0 |
| `og_description_text_overlap` | Word overlap: OG desc vs article text [0–1] | 0.0–1.0 |
| `title_text_length_ratio` | Title length / text length | 0.0–1.0 |

### Categorical Fields (all `string`, default `"unknown"`)

| Field | Accepted Values |
|---|---|
| `platform` | `"TWITTER15"`, `"TWITTER16"`, `"PHEME"`, `"web"`, `"unknown"` |
| `domain_credibility_label` | `"high"`, `"low"`, `"unknown"` |
| `og_type` | `"article"`, `"website"`, `"video"`, `"unknown"` |
| `twitter_card_type` | `"summary"`, `"summary_large_image"`, `"app"`, `"player"`, `"unknown"` |
| `time_of_day_group` | `"morning"`, `"afternoon"`, `"evening"`, `"night"`, `"unknown"` |

---

## Other Useful Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Server status + model readiness check |
| `/image/predict` | POST | Image model only (body: `{image, caption, ocr_text}`) |
| `/image/health` | GET | Image model status |
| `/media/predict` | POST | Media context model only (body: all media fields directly) |
| `/media/health` | GET | Media model status + full feature list |
| `/analyze` | POST | Media model from URL (body: `{postUrl, text, title}`) |
| `/docs` | GET | Interactive Swagger UI |

---

## Implementation Notes for Frontend

### 1. Minimal call — text only

```typescript
const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: claimText }),
});
const data = await response.json();
// data.verdict === "FAKE" | "REAL"
// data.prob_fake, data.confidence, data.text.top_tokens, etc.
```

### 2. Full multimodal call

```typescript
const body: Record<string, unknown> = { text: claimText };

if (imageFile) {
  const base64 = await fileToBase64(imageFile); // your helper
  body.image = base64;
  body.caption = captionText;
}

if (hasMediaContext) {
  body.media_context = {
    domain_credibility_score: 0.2,
    hashtag_count: 7,
    platform: 'TWITTER15',
    // ... any fields you have
  };
}

const res = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
```

### 3. Ablation study call

```typescript
// Use the same body as /predict
const res = await fetch('http://localhost:8000/ablation/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),  // same body as /predict
});
const ablation = await res.json();
// ablation.variants — array of 2–6 variants to display in a table
// ablation.individual_scores — raw per-model scores
// ablation.best_variant — highlight this row
```

### 4. Null checks

`image` and `media` fields in the `/predict` response will be `null` if that modality was not provided or the model failed silently. Always null-check before accessing nested fields:

```typescript
if (data.image) {
  showPccsScore(data.image.pccs_score);
}
if (data.media) {
  showTopSignals(data.media.top_signals);
}
```

### 5. Ablation variant display order

Render variants in this order for the comparison table:

1. `text_only`
2. `image_only`
3. `social_only`
4. `text_image`
5. `text_social`
6. `full_multimodal` ← highlight as the "full system" row

---

## Health Check

Call `GET /health` on startup to confirm all models are loaded before enabling the UI:

```json
{
  "status": "ok",
  "text_model": "ready",
  "media_model": "ready",
  "image_model": "ready",
  "threshold": 0.5,
  "mc_passes": 30,
  "device": "mps"
}
```

If `status` is not `"ok"` or any model is `"unavailable"`, show a loading indicator.
