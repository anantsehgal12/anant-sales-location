import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { executives } from "@/src/db/schema";
import {
  ok,
  noContent,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

type Params = { params: { id: string } };

// GET /api/executives/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const [row] = await db
      .select()
      .from(executives)
      .where(eq(executives.id, params.id));

    if (!row) return notFound("Executive");
    return ok(row);
  } catch (e) {
    return serverError(e);
  }
}

// PATCH /api/executives/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const { name, email, phone } = body;

    if (!name && !email && !phone) {
      return badRequest("Provide at least one field to update");
    }

    const [updated] = await db
      .update(executives)
      .set({ ...(name && { name }), ...(email && { email }), ...(phone && { phone }), updatedAt: new Date() })
      .where(eq(executives.id, params.id))
      .returning();

    if (!updated) return notFound("Executive");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// DELETE /api/executives/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const [deleted] = await db
      .delete(executives)
      .where(eq(executives.id, params.id))
      .returning();

    if (!deleted) return notFound("Executive");
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
