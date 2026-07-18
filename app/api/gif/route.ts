import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || ""
  const key = process.env.TENOR_API_KEY || "LIVDSRZULELA096357"

  const endpoint = q && q !== "trending"
    ? `https://api.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${key}&limit=20&media_filter=minimal`
    : `https://api.tenor.com/v1/trending?key=${key}&limit=20&media_filter=minimal`

  try {
    const res = await fetch(endpoint, { next: { revalidate: 60 } })
    if (!res.ok) return NextResponse.json({ results: [] })
    const data = await res.json()
    return NextResponse.json({ results: data.results ?? [] })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
