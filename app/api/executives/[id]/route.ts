import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { executives, leads } from "@/src/db/schema";
import {
  ok,
  noContent,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

type Params = { params: { id: string } | Promise<{ id: string }> };

// GET /api/executives/[id]
export async function GET(_req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const rows = await db
      .select()
      .from(executives)
      .where(eq(executives.id, params.id));

    if (!rows.length) return notFound("Executive");
    return ok(rows[0]);
  } catch (e) {
    return serverError(e);
  }
}

// PATCH /api/executives/[id]
export async function PATCH(req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const body = await req.json();

    const { name, phone, email } = body;
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return badRequest("Provide at least one field to update");
    }

    const [updated] = await db
      .update(executives)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(executives.id, params.id))
      .returning();

    if (!updated) return notFound("Executive");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// DELETE /api/executives/[id]
export async function DELETE(_req: NextRequest, props: Params) {
  try {
    const params = await props.params;

    const [deleted] = await db
      .delete(executives)
      .where(eq(executives.id, params.id))
      .returning();

    if (!deleted) return notFound("Executive");
    return noContent();
  } catch (e: any) {
    if (e?.code === "23503" || e?.cause?.code === "23503") {
      return badRequest(
        "Cannot delete this executive because they are assigned to one or more leads."
      );
    }
    return serverError(e);
  }
}