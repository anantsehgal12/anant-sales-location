import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leads, executives, organisations } from "@/src/db/schema";
import { ok, created, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

// GET /api/leads?executiveId=xxx&orgId=xxx
// Returns leads joined with executive + organisation for convenience
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const executiveId = searchParams.get("executiveId");
    const organisationId = searchParams.get("orgId");

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
      .where(
        executiveId
          ? eq(leads.executiveId, executiveId)
          : organisationId
          ? eq(leads.organisationId, organisationId)
          : undefined
      )
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
      visitDate,
      callType,
      locationLat,
      locationLng,
      contactPersonName,
      contactPersonDesignationDept,
      discussionFor,
      currentProviderDth,
      currentProviderInternet,
      noOfConnections,
      currentRentalPlan,
      totalMonthlyExpenses,
      callTemperature,
      nextFollowUpDate,
      finalRemarks,
    } = body;

    // 2. Check required fields from the frontend
    if (!executiveId || !organisationId || !visitDate || !callType || !discussionFor) {
      return badRequest(
        "executiveId, organisationId, visitDate, callType, and discussionFor are required"
      );
    }

    const [row] = await db
      .insert(leads)
      .values({
        executiveId,
        organisationId,
        visitDate,
        callType,
        locationLat,
        locationLng,
        contactPersonName,
        contactPersonDesignationDept,
        discussionFor,
        currentProviderDth,
        currentProviderInternet,
        noOfConnections,
        currentRentalPlan,
        totalMonthlyExpenses,
        callTemperature,
        nextFollowUpDate,
        finalRemarks,
      })
      .returning();

    return created(row);
  } catch (e) {
    return serverError(e);
  }
}
