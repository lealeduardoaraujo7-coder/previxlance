import { NextResponse } from "next/server"
import { getCategories } from "@/lib/categories"

// Public: forms and the nav bar read the category list from here.
export async function GET() {
  return NextResponse.json(await getCategories())
}
