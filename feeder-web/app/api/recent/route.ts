import { NextResponse } from "next/server";
import { ECLOUD_URL } from "@/app/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await fetch(`${ECLOUD_URL}/recent`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ recent: [] }, { status: 200 });
  }
}
