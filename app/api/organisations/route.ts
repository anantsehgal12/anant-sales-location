import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/src/db/schema";
import { ok, created, badRequest, serverError } from "@/lib/api-helpers";
import { ilike } from "drizzle-orm";

// GET /api/organisations?search=xyz
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const rows = await db
      .select()
      .from(organisations)
      .where(search ? ilike(organisations.orgName, `%${search}%`) : undefined)
      .orderBy(organisations.orgName);

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

// POST /api/organisations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgName, orgSegment, orgArea, orgPincode } = body;

    if (!orgName) return badRequest("orgName is required");

    const [row] = await db
      .insert(organisations)
      .values({ orgName, orgSegment, orgArea, orgPincode })
      .returning();

    return created(row);
  } catch (e) {
    return serverError(e);
  }
}
