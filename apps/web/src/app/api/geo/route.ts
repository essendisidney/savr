import { countryFromVercelHeader } from "@/lib/geo-country";

export async function GET(req: Request) {
  const header = req.headers.get("x-vercel-ip-country");
  const country = countryFromVercelHeader(header);
  return Response.json({
    country,
    header: header || null,
    defaulted: !header,
  });
}
