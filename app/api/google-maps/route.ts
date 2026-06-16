import { NextResponse } from "next/server"

export async function GET() {
  // Only use the server-side GOOGLE_MAPS_API_KEY
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key is not configured on the server" }, { status: 500 })
  }

  // Return the script URL with the API key
  return NextResponse.json({
    scriptUrl: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr`,
  })
}
