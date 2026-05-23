"use server";

import { db } from "@/lib/db";
import {
  leads,
  executives,
  organisations,
  leadContacts,
  leadCommercialDetails,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function getLeadsForExport() {
  const allLeads = await db
    .select({
      lead: leads,
      executive: executives,
      organisation: organisations,
    })
    .from(leads)
    .leftJoin(executives, eq(leads.executiveId, executives.id))
    .leftJoin(organisations, eq(leads.organisationId, organisations.id));

  const allContacts = await db.select().from(leadContacts);
  const allCommercials = await db.select().from(leadCommercialDetails);

  return allLeads.map((row) => ({
    ...row,
    contacts: allContacts.filter((c) => c.leadId === row.lead.id),
    commercials: allCommercials.filter((c) => c.leadId === row.lead.id),
  }));
}