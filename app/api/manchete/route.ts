import { NextResponse } from "next/server"
import { getEnabledTickerItems } from "@/lib/ticker"

// Public: the home ticker reads its items from here.
export async function GET() {
  const items = await getEnabledTickerItems()
  return NextResponse.json(items)
}
