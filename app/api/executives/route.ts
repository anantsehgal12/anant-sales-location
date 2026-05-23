import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { executives } from "@/src/db/schema";
import { ok, created, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// GET /api/executives
export async function GET() {
  try {
    const rows = await db.select().from(executives).orderBy(executives.name);
    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

// DELETE /api/executives
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return unauthorized("You must be signed in to delete an executive.");
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return badRequest("id is required");
    }

    const [row] = await db
      .delete(executives)
      .where(eq(executives.id, id))
      .returning();

    return ok(row);
  } catch (e: any) {
    // Handle PostgreSQL foreign key constraint violation
    if (e?.code === "23503" || e?.cause?.code === "23503") {
      return badRequest(
        "Cannot delete this executive because they are assigned to one or more leads."
      );
    }
    return serverError(e);
  }
}

// POST /api/executives
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return unauthorized("You must be signed in to create an executive.");
    }

    const body = await req.json();
    let { clerkUserId, name, email, phone } = body;

    // If left blank by the admin, auto-generate a placeholder UUID to prevent conflicts
    if (!clerkUserId) {
      clerkUserId = crypto.randomUUID();
    }
    
    if (!name || !email) {
      return badRequest("name and email are required");
    }

    const [row] = await db
      .insert(executives)
      .values({ clerkUserId, name, email, phone })
      .onConflictDoUpdate({
        target: executives.clerkUserId,
        set: { name, email, phone, updatedAt: new Date() },
      })
      .returning();

    return created(row);
  } catch (e) {
    return serverError(e);
  }
}
