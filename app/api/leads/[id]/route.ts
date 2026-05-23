import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leads, executives, organisations, leadContacts, leadCommercialDetails } from "@/src/db/schema";
import {
  ok,
  noContent,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

type Params = { params: { id: string } | Promise<{ id: string }> };

// GET /api/leads/[id]
export async function GET(_req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const [row] = await db
      .select({
        lead: leads,
        executive: {
          id: executives.id,
          name: executives.name,
          email: executives.email,
          phone: executives.phone,
        },
        organisation: {
          id: organisations.id,
          orgName: organisations.orgName,
          orgSegment: organisations.orgSegment,
          orgArea: organisations.orgArea,
          orgPincode: organisations.orgPincode,
        },
      })
      .from(leads)
      .leftJoin(executives, eq(leads.executiveId, executives.id))
      .leftJoin(organisations, eq(leads.organisationId, organisations.id))
      .where(eq(leads.id, params.id));

    if (!row) return notFound("Lead");

    // Fetch contacts
    const contacts = await db
      .select()
      .from(leadContacts)
      .where(eq(leadContacts.leadId, row.lead.id));

    (row.lead as any).contacts = contacts;

    // Fetch commercial details
    const commercialDetails = await db
      .select()
      .from(leadCommercialDetails)
      .where(eq(leadCommercialDetails.leadId, row.lead.id));

    (row.lead as any).commercialDetails = commercialDetails;

    return ok(row);
  } catch (e) {
    return serverError(e);
  }
}

// PATCH /api/leads/[id]
export async function PATCH(req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const body = await req.json();

    // Strip undefined fields — only update what's provided
    const updateData: Record<string, unknown> = {};
    const allowed = [
      "visitDate",
      "callType",
      "locationLat",
      "locationLng",
      "callTemperature",
      "nextFollowUpDate",
      "finalRemarks",
      "executiveId",
      "organisationId",
    ] as const;

    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Provide at least one field to update");
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(leads)
      .set(updateData)
      .where(eq(leads.id, params.id))
      .returning();

    if (!updated) return notFound("Lead");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// DELETE /api/leads/[id]
export async function DELETE(_req: NextRequest, props: Params) {
  try {
    const params = await props.params;
    const [deleted] = await db
      .delete(leads)
      .where(eq(leads.id, params.id))
      .returning();

    if (!deleted) return notFound("Lead");
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
