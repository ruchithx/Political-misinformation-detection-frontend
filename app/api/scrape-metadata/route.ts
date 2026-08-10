// Server-side Open Graph / Twitter Card metadata scraper.
// Browsers can't fetch arbitrary cross-origin pages directly (CORS), so this
// route does it server-side and returns parsed real feature values for the
// media-context feature vector — never fabricated placeholders.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const FETCH_TIMEOUT_MS = 6_000;
const MAX_HTML_BYTES = 2_000_000;

const META_TAG_RE = /<meta\b[^>]*>/gi;
const ATTR_RE = /([\w:-]+)\s*=\s*"([^"]*)"|([\w:-]+)\s*=\s*'([^']*)'/g;

function parseMetaTags(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const metaTags = html.match(META_TAG_RE) ?? [];

  for (const tag of metaTags) {
    const attrs: Record<string, string> = {};
    ATTR_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ATTR_RE.exec(tag))) {
      const name = (match[1] ?? match[3])?.toLowerCase();
      const value = match[2] ?? match[4];
      if (name) attrs[name] = value;
    }
    const key = (attrs.property || attrs.name)?.toLowerCase();
    if (key && attrs.content !== undefined) {
      result[key] = attrs.content;
    }
  }
  return result;
}

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let common = 0;
  for (const w of wordsA) if (wordsB.has(w)) common++;
  return common / Math.max(wordsA.size, wordsB.size);
}

export async function POST(req: NextRequest) {
  let body: { url?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, text = '' } = body;
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let targetHostname: string;
  try {
    targetHostname = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  let html: string;
  try {
    const upstream = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MisinfoDetectionBot/1.0; +frontend-demo)',
        Accept: 'text/html',
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream fetch failed: ${upstream.status}` }, { status: 502 });
    }
    const contentType = upstream.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: `Not an HTML page (${contentType})` }, { status: 415 });
    }

    html = await upstream.text();
    if (html.length > MAX_HTML_BYTES) html = html.slice(0, MAX_HTML_BYTES);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 502 });
  }

  const meta = parseMetaTags(html);
  const pageTitle = extractTitle(html);
  const ogTitle = meta['og:title'] ?? '';
  const ogDescription = meta['og:description'] ?? '';

  const hasOgTags = Object.keys(meta).some((k) => k.startsWith('og:')) ? 1 : 0;
  const hasTwitterCard = meta['twitter:card'] ? 1 : 0;
  const hasFbAppId = meta['fb:app_id'] ? 1 : 0;
  const hasAuthor = meta['author'] || meta['article:author'] ? 1 : 0;
  const hasPublisher = meta['og:site_name'] || meta['article:publisher'] ? 1 : 0;
  const hasVideo = meta['og:video'] || meta['og:video:url'] || /<video[\s>]/i.test(html) ? 1 : 0;

  const ogImageWidth = Number(meta['og:image:width']) || 0;
  const ogImageHeight = Number(meta['og:image:height']) || 0;

  const ogTitleOverlap = ogTitle && pageTitle ? wordOverlap(ogTitle, pageTitle) : 0;
  const ogDescriptionOverlap = ogDescription && text ? wordOverlap(ogDescription, text) : 0;

  const completenessFields = [
    hasOgTags,
    hasTwitterCard,
    hasAuthor,
    hasPublisher,
    meta['og:image'] ? 1 : 0,
    meta['og:type'] ? 1 : 0,
  ];
  const metadataCompleteness =
    completenessFields.reduce((sum, v) => sum + v, 0) / completenessFields.length;

  const mediaRichnessScore =
    ((meta['og:image'] ? 1 : 0) + hasVideo + (ogImageWidth > 0 ? 1 : 0)) / 3;

  const canonicalUrl = meta['og:url'];
  let urlDomainCanonicalMismatch = 0;
  if (canonicalUrl) {
    try {
      const canonicalHost = new URL(canonicalUrl).hostname.replace(/^www\./, '');
      const targetHost = targetHostname.replace(/^www\./, '');
      urlDomainCanonicalMismatch = canonicalHost === targetHost ? 0 : 1;
    } catch {
      urlDomainCanonicalMismatch = 0;
    }
  }

  return NextResponse.json({
    has_og_tags: hasOgTags,
    has_twitter_card: hasTwitterCard,
    has_fb_appid: hasFbAppId,
    has_author: hasAuthor,
    has_publisher: hasPublisher,
    has_video: hasVideo,
    og_image_width: ogImageWidth,
    og_image_height: ogImageHeight,
    media_richness_score: mediaRichnessScore,
    og_title_article_title_overlap: ogTitleOverlap,
    og_description_text_overlap: ogDescriptionOverlap,
    metadata_completeness: metadataCompleteness,
    og_type: meta['og:type'] || 'unknown',
    twitter_card_type: meta['twitter:card'] || 'unknown',
    url_domain_canonical_mismatch: urlDomainCanonicalMismatch,
  });
}
