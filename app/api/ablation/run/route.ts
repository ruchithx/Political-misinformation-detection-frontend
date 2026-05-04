import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🚀 ~ POST ~ body:', body);

    const upstream = await fetch(`${API_BASE}/ablation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(65_000), // might take longer on CPU
    });
    console.log('🚀 ~ POST ~ upstream:', upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    console.log('🚀 ~ POST ~ data:', data);

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Backend unavailable. Using mock ablation data.' },
      { status: 503 },
    );
  }
}
