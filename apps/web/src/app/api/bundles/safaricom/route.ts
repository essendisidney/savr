import { NextResponse } from "next/server";
import { loadSafaricomBundles } from "@/lib/safaricom-bundles";

export const revalidate = 3600;

export async function GET() {
  const board = await loadSafaricomBundles();
  return NextResponse.json(board);
}
