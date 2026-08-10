import type { AnalyzeRequest, Platform } from '@/lib/types';

/** Convert a File to base64 string */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Build the POST body for the analysis endpoint */
export function buildAnalyzeRequest(
  text: string,
  platform: AnalyzeRequest['platform'],
  imageBase64?: string,
): AnalyzeRequest {
  return { text, platform, ...(imageBase64 ? { imageBase64 } : {}) };
}

/** Format a confidence number as a display string */
export function formatConfidence(value: number): string {
  return value.toFixed(1);
}

/** Map a 0–1 score to 0–100 for display */
export function toPercent(score: number): number {
  return Math.round(score * 100);
}

const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'dlvr.it'];

// Temporary deterministic domain heuristic for frontend demonstration.
// This mapping is not the research-grade source credibility estimation method
// and must not be used to generate or report research evaluation results.
//
// domain_credibility_label is constrained to the backend's documented 3-value
// vocabulary ("high" | "low" | "unknown" — see API-Reference.md). The "medium"
// tier below has no valid categorical bucket of its own, so it is labeled
// "unknown" while still carrying a distinct numeric score.
const HIGH_CREDIBILITY_DOMAINS: Record<string, number> = {
  'reuters.com': 0.90,
  'apnews.com': 0.89,
  'bbc.com': 0.88,
  'x.com': 0.88,  
  'bbc.co.uk': 0.88,
  'cnn.com': 0.86,
  'npr.org': 0.86,
  'nytimes.com': 0.85,
  'washingtonpost.com': 0.84,
  'aljazeera.com': 0.84,
  'pbs.org': 0.84,
  'theguardian.com': 0.83,
  'cbsnews.com': 0.82,
  'nbcnews.com': 0.82,
  'abcnews.go.com': 0.82,
};

const MEDIUM_CREDIBILITY_DOMAINS: Record<string, number> = {
  'politico.com': 0.72,
  'time.com': 0.72,
  'usatoday.com': 0.70,
  'forbes.com': 0.70,
  'newsweek.com': 0.68,
  'businessinsider.com': 0.65,
  'thehill.com': 0.65,
  'huffpost.com': 0.62,
  'nypost.com': 0.55,
  'dailymail.co.uk': 0.55,
};

// Synthetic .test domains only — never real news organizations, politicians,
// or governments. Used solely to demonstrate the low-credibility path in the demo.
const LOW_CREDIBILITY_DEMO_DOMAINS: Record<string, number> = {
  'fake-news-example.test': 0.20,
  'fabricated-news.test': 0.25,
  'misinformation-demo.test': 0.30,
  'unreliable-source-demo.test': 0.35,
};

/** Exact match or safe parent-domain match (never a raw substring match). */
function matchDomain(hostname: string, table: Record<string, number>): number | null {
  if (hostname in table) return table[hostname];
  for (const domain of Object.keys(table)) {
    if (hostname.endsWith('.' + domain)) return table[domain];
  }
  return null;
}

interface DomainCredibility {
  score: number;
  label: 'high' | 'low' | 'unknown';
}

/** Deterministic demo-only credibility lookup — see comment block above. */
function getDomainCredibility(hostname: string): DomainCredibility {
  const normalized = hostname.toLowerCase().replace(/^www\./, '');

  const high = matchDomain(normalized, HIGH_CREDIBILITY_DOMAINS);
  if (high !== null) return { score: high, label: 'high' };

  const medium = matchDomain(normalized, MEDIUM_CREDIBILITY_DOMAINS);
  if (medium !== null) return { score: medium, label: 'unknown' };

  const low = matchDomain(normalized, LOW_CREDIBILITY_DEMO_DOMAINS);
  if (low !== null) return { score: low, label: 'low' };

  return { score: 0.2, label: 'unknown' };
}

/**
 * Builds the media_data feature vector expected by FeatureAttentionMLP.
 * Features match NUMERICAL_FEATURES + CATEGORICAL_FEATURES in media_context_loader.py
 * (28 numerical + 5 categorical = 33 total).
 * Text/URL features get real values; HTML-scraped features default to 0/unknown.
 */
export function buildMediaFeatures(
  text: string,
  platform: Platform,
  postUrl?: string,
): Record<string, unknown> {
  const words = text.split(/\s+/).filter(Boolean);
  // No separate title field in the UI — use the first line as a title proxy.
  const titleProxy = text.split(/\n/)[0] ?? '';
  const titleTextLengthRatio = text.length > 0 ? Math.min(1, titleProxy.length / text.length) : 0;
  const exclamations = (text.match(/!/g) ?? []).length;
  const questions    = (text.match(/\?/g) ?? []).length;
  const capsWords    = words.filter(
    (w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w),
  ).length;
  const urlsInText   = (text.match(/https?:\/\/\S+/g) ?? []).length;
  const hashtags     = (text.match(/#\w+/g) ?? []).length;
  const mentions     = (text.match(/@\w+/g) ?? []).length;
  const emojiCount   = [...text].filter((c) => {
    const cp = c.codePointAt(0) ?? 0;
    return (
      (cp >= 0x1f600 && cp <= 0x1f64f) ||
      (cp >= 0x1f300 && cp <= 0x1f5ff) ||
      (cp >= 0x1f680 && cp <= 0x1f6ff) ||
      (cp >= 0x2600  && cp <= 0x26ff)  ||
      (cp >= 0x2700  && cp <= 0x27bf)
    );
  }).length;

  let isHttps        = 0;
  let domainLength   = 0;
  let isUrlShortened = 0;
  let domainCredibility: DomainCredibility = { score: 0.5, label: 'unknown' };
  if (postUrl) {
    try {
      const parsed   = new URL(postUrl);
      isHttps        = parsed.protocol === 'https:' ? 1 : 0;
      domainLength   = parsed.hostname.replace(/^www\./, '').length;
      isUrlShortened = URL_SHORTENERS.some(
        (s) => parsed.hostname === s || parsed.hostname.endsWith('.' + s),
      ) ? 1 : 0;
      domainCredibility = getDomainCredibility(parsed.hostname);
    } catch { /* invalid URL — leave defaults */ }
  }

  const hour = new Date().getHours();
  const timeOfDayGroup =
    hour < 6  ? 'night'     :
    hour < 12 ? 'morning'   :
    hour < 18 ? 'afternoon' : 'evening';

  return {
    domain_credibility_score:       domainCredibility.score,
    is_url_shortened:               isUrlShortened,
    url_domain_canonical_mismatch:  0,
    domain_length:                  domainLength,
    is_https:                       isHttps,
    has_og_tags:                    0,
    has_twitter_card:               0,
    has_fb_appid:                   0,
    metadata_completeness:          postUrl ? 0.2 : 0.0,
    has_author:                     0,
    has_publisher:                  0,
    has_video:                      0,
    og_image_width:                 0,
    og_image_height:                0,
    media_richness_score:           0,
    text_word_count:                words.length,
    title_exclamation_count:        exclamations,
    title_question_count:           questions,
    title_caps_word_count:          capsWords,
    text_exclamation_count:         exclamations,
    text_caps_word_count:           capsWords,
    url_count_in_text:              urlsInText,
    hashtag_count:                  hashtags,
    mention_count:                  mentions,
    emoji_count:                    emojiCount,
    og_title_article_title_overlap: 0,
    og_description_text_overlap:    0,
    title_text_length_ratio:        titleTextLengthRatio,
    platform,
    domain_credibility_label:       domainCredibility.label,
    og_type:                        'unknown',
    twitter_card_type:              'unknown',
    time_of_day_group:              timeOfDayGroup,
  };
}

export interface ScrapedUrlMetadata {
  has_og_tags: number;
  has_twitter_card: number;
  has_fb_appid: number;
  has_author: number;
  has_publisher: number;
  has_video: number;
  og_image_width: number;
  og_image_height: number;
  media_richness_score: number;
  og_title_article_title_overlap: number;
  og_description_text_overlap: number;
  metadata_completeness: number;
  og_type: string;
  twitter_card_type: string;
  url_domain_canonical_mismatch: number;
}

/**
 * Fetches real Open Graph / Twitter Card metadata for postUrl via a
 * server-side scrape (app/api/scrape-metadata) — browsers can't fetch
 * arbitrary cross-origin pages directly due to CORS. Returns null on any
 * failure (blocked, timeout, non-HTML, non-2xx) so callers can keep the
 * buildMediaFeatures() placeholder values instead.
 */
export async function fetchUrlMetadata(
  postUrl: string,
  text: string,
): Promise<ScrapedUrlMetadata | null> {
  try {
    const res = await fetch('/api/scrape-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: postUrl, text }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
