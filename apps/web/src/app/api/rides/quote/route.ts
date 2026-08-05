import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildRideQuotes } from "@/lib/rides";

export async function POST(req: Request) {
  let body: { pickup?: string; destination?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pickup = (body.pickup ?? "Westlands").trim() || "Westlands";
  const destination = (body.destination ?? "").trim();
  if (!destination) {
    return NextResponse.json({ error: "Destination is required" }, { status: 400 });
  }

  const result = await buildRideQuotes(pickup, destination);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authHeader = req.headers.get("authorization");
  if (url && anon && authHeader?.startsWith("Bearer ")) {
    try {
      const supabase = createClient(url, anon, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ride_quotes").insert({
          user_id: user.id,
          pickup_label: result.pickup,
          dest_label: result.destination,
          pickup_lat: result.pickupLat,
          pickup_lng: result.pickupLng,
          dest_lat: result.destLat,
          dest_lng: result.destLng,
          results: result.quotes,
          recommended_partner: result.quotes[0]?.partner ?? null,
        });
      }
    } catch {
      // best-effort persist
    }
  }

  return NextResponse.json(result);
}
