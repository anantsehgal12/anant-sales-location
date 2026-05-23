import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/src/db/schema";
import {
  ok,
  noContent,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

type Params = { params: { id: string } | Promise<{ id: string }> };

// GET /api/organisations/[id]
export async function GET(_req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const [row] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, params.id));

    if (!row) return notFound("Organisation");
    return ok(row);
  } catch (e) {
    return serverError(e);
  }
}

// PATCH /api/organisations/[id]
export async function PATCH(req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { orgName, orgSegment, orgArea, orgPincode } = body;

    if (!orgName && !orgSegment && !orgArea && !orgPincode) {
      return badRequest("Provide at least one field to update");
    }

    const [updated] = await db
      .update(organisations)
      .set({ ...(orgName && { orgName }), ...(orgSegment && { orgSegment }), ...(orgArea && { orgArea }), ...(orgPincode && { orgPincode }), updatedAt: new Date() })
      .where(eq(organisations.id, params.id))
      .returning();

    if (!updated) return notFound("Organisation");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// DELETE /api/organisations/[id]
export async function DELETE(_req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const [deleted] = await db
      .delete(organisations)
      .where(eq(organisations.id, params.id))
      .returning();

    if (!deleted) return notFound("Organisation");
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}