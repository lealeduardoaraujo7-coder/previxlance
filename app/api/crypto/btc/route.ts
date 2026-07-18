import { NextResponse } from "next/server"

export const revalidate = 30 // cache 30s no servidor

export async function GET() {
  try {
    const [priceRes, chartRes] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true",
        { next: { revalidate: 30 } }
      ),
      fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly",
        { next: { revalidate: 300 } }
      ),
    ])

    const priceData = await priceRes.json()
    const chartData = await chartRes.json()

    const price: number = priceData.bitcoin?.usd ?? 0
    const change24h: number = priceData.bitcoin?.usd_24h_change ?? 0
    const marketCap: number = priceData.bitcoin?.usd_market_cap ?? 0
    const vol24h: number = priceData.bitcoin?.usd_24h_vol ?? 0
    // chartData.prices = [[timestamp, price], ...]
    const prices: number[] = (chartData.prices ?? []).map(([, p]: [number, number]) => p)

    return NextResponse.json({ price, change24h, marketCap, vol24h, prices })
  } catch {
    return NextResponse.json({ price: 0, change24h: 0, marketCap: 0, vol24h: 0, prices: [] })
  }
}
