import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leads, executives, organisations, leadContacts, leadCommercialDetails } from "@/src/db/schema";
import { ok, created, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, desc } from "drizzle-orm";

// GET /api/leads?executiveId=xxx&orgId=xxx
// Returns leads joined with executive + organisation for convenience.
// Pass BOTH executiveId and orgId to get the lead history for that
// specific executive + organisation pair (used for the follow-up picker).
// Pass just one to filter more broadly by executive or by org alone.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const executiveId = searchParams.get("executiveId");
    const organisationId = searchParams.get("orgId");

    const conditions = [];
    if (executiveId) conditions.push(eq(leads.executiveId, executiveId));
    if (organisationId) conditions.push(eq(leads.organisationId, organisationId));

    const rows = await db
      .select({
        lead: leads,
        executive: {
          id: executives.id,
          name: executives.name,
          email: executives.email,
        },
        organisation: {
          id: organisations.id,
          orgName: organisations.orgName,
          orgArea: organisations.orgArea,
        },
      })
      .from(leads)
      .leftJoin(executives, eq(leads.executiveId, executives.id))
      .leftJoin(organisations, eq(leads.organisationId, organisations.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leads.visitDate));

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

// POST /api/leads
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      return unauthorized("You must be signed in to create a lead.");
    }

    const body = await req.json();

    const {
      executiveId,
      organisationId,
      followUpToLeadId,
      visitDate,
      callType,
      locationLat,
      locationLng,
      contacts,
      commercialDetails,
      callTemperature,
      nextFollowUpDate,
      finalRemarks,
      photoUrls,
    } = body;

    // 2. Check required fields from the frontend
    if (!executiveId || !organisationId || !visitDate || !callType || !Array.isArray(contacts) || contacts.length === 0) {
      return badRequest(
        "executiveId, organisationId, visitDate, callType, and at least one contact are required"
      );
    }

    // A "Follow-Up" call should reference the earlier call it follows up on
    if (callType === "Follow-Up" && !followUpToLeadId) {
      return badRequest("Please select which previous call this follow-up relates to");
    }

    const [row] = await db
      .insert(leads)
      .values({
        executiveId,
        organisationId,
        followUpToLeadId: callType === "Follow-Up" ? followUpToLeadId : null,
        visitDate,
        callType,
        locationLat,
        locationLng,
        callTemperature,
        nextFollowUpDate,
        finalRemarks,
        photoUrls: photoUrls || [],
      })
      .returning();

    // 3. Insert contacts
    if (row && contacts.length > 0) {
      await db.insert(leadContacts).values(
        contacts.map((c: any) => ({
          leadId: row.id,
          contactPersonName: c.contactPersonName,
          contactPersonDesignationDept: c.contactPersonDesignationDept,
          contactPersonPhone: c.contactPersonPhone,
          discussionFor: c.discussionFor,
        }))
      );
    }

    // 4. Insert commercial details
    if (row && commercialDetails && commercialDetails.length > 0) {
      await db.insert(leadCommercialDetails).values(
        commercialDetails.map((cd: any) => ({
          leadId: row.id,
          serviceType: cd.serviceType,
          currentProvider: cd.currentProvider || null,
          noOfConnections: cd.noOfConnections ? parseInt(cd.noOfConnections) : null,
          currentRentalPlan: cd.currentRentalPlan || null,
          totalMonthlyExpenses: cd.totalMonthlyExpenses || null,
        }))
      );
    }

    return created(row);
  } catch (e) {
    return serverError(e);
  }
}