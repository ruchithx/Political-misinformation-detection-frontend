// src/app/api/proxy/route.ts
// Server-side proxy to FastAPI.
// Supports POST /predict and POST /ablation/run via x-target-endpoint header.
// Returns proper errors — no mock data fallbacks.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Which FastAPI endpoint to call — defaults to 'predict'
    const target = req.headers.get('x-target-endpoint') ?? 'predict';
    const allowedTargets = ['predict', 'ablation/run'];

    if (!allowedTargets.includes(target)) {
      return NextResponse.json(
        { error: `Unknown target endpoint: ${target}` },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${API_BASE}/${target}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(30_000),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? err.error ?? `Upstream error: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (
      msg.includes('ECONNREFUSED') ||
      msg.includes('fetch failed') ||
      msg.includes('timeout')
    ) {
      return NextResponse.json(
        {
          error:
            'FastAPI server is not running. Start it with:\n' +
            'uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: `Proxy error: ${msg}` },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const target = req.headers.get('x-target-endpoint') ?? 'ablation';

    const upstream = await fetch(`${API_BASE}/${target}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? `Upstream error: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Proxy error: ${msg}` }, { status: 503 });
  }
}
