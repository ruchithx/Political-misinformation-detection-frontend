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
  if (postUrl) {
    try {
      const parsed   = new URL(postUrl);
      isHttps        = parsed.protocol === 'https:' ? 1 : 0;
      domainLength   = parsed.hostname.replace(/^www\./, '').length;
      isUrlShortened = URL_SHORTENERS.some(
        (s) => parsed.hostname === s || parsed.hostname.endsWith('.' + s),
      ) ? 1 : 0;
    } catch { /* invalid URL — leave defaults */ }
  }

  const hour = new Date().getHours();
  const timeOfDayGroup =
    hour < 6  ? 'night'     :
    hour < 12 ? 'morning'   :
    hour < 18 ? 'afternoon' : 'evening';

  return {
    domain_credibility_score:       0.5,
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
    title_text_length_ratio:        0,
    platform,
    domain_credibility_label:       'unknown',
    og_type:                        'unknown',
    twitter_card_type:              'unknown',
    time_of_day_group:              timeOfDayGroup,
  };
}
