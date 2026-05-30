import { NextRequest, NextResponse } from "next/server";
import { ECLOUD_URL } from "@/app/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${ECLOUD_URL}/feed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    cache: "no-store",
  });
  const data = await upstream.json().catch(() => ({ ok: false }));
  return NextResponse.json(data, { status: upstream.status });
}
