import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { 
  leads, 
  executives, 
  organisations,
  leadContacts,
  leadCommercialDetails
} from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeftIcon, 
  MapPinIcon,
  BuildingIcon,
  PhoneCallIcon,
  StickyNoteIcon,
  ImageIcon,
  UsersIcon,
  WifiIcon,
  ThermometerIcon
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Reusable Layout Components ───────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  subtitle,
  index,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 backdrop-blur-sm animate-section"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-amber-400 to-amber-600 opacity-70" />
      <div className="mb-5 flex items-center gap-3 pl-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <Icon className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/70">{subtitle}</p>
          <h3 className="font-display text-base font-semibold text-white/90">{title}</h3>
        </div>
      </div>
      <div className="pl-4">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">
      {children}
    </Label>
  );
}

export default async function LeadDetailsPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const leadId = params?.id;

  // Guard against undefined IDs to prevent Drizzle crashes
  if (!leadId) {
    return notFound();
  }

  const row = await db
    .select({
      lead: leads,
      executive: {
        name: executives.name,
      },
      organisation: {
        orgName: organisations.orgName,
      },
    })
    .from(leads)
    .leftJoin(executives, eq(leads.executiveId, executives.id))
    .leftJoin(organisations, eq(leads.organisationId, organisations.id))
    .where(eq(leads.id, leadId))
    .then((res) => res[0]);

  const contacts = await db
    .select()
    .from(leadContacts)
    .where(eq(leadContacts.leadId, leadId));

  const commercials = await db
    .select()
    .from(leadCommercialDetails)
    .where(eq(leadCommercialDetails.leadId, leadId));

  if (!row) return notFound();

  const { lead, executive, organisation } = row;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        * { box-sizing: border-box; }
        body { background: #0a0c10; }
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }

        @keyframes section-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.65); }
        }
        .animate-section  { animation: section-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .pulse-dot        { animation: pulse-dot 1.4s ease-in-out infinite; }

        .dark-input {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #e2e8f0 !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dark-input:focus {
          border-color: rgba(251,191,36,0.5) !important;
          box-shadow: 0 0 0 3px rgba(251,191,36,0.08) !important;
          outline: none !important;
        }
        .dark-input[readonly] { opacity: 0.8; cursor: default; }
      `}</style>

      <div className="font-body min-h-screen bg-[#0a0c10] pb-28 text-slate-200">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/[0.03] blur-[100px]" />
        </div>

        <div className="relative w-full  mx-auto px-3 sm:px-6 lg:px-10 xl:px-16 pt-10">
          {/* Header */}
          <div className="mb-8 animate-section" style={{ animationDelay: "0ms" }}>
            <Button asChild variant="ghost" className="mb-6 -ml-4 text-slate-400 hover:text-white">
              <Link href="/admin/leads">
                <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to Leads
              </Link>
            </Button>
            <div className="mb-2 flex items-center gap-2">
              <span className="pulse-dot h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">Submission Data</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-white">Lead #{lead.id}</h1>
          </div>

          <div className="space-y-4">
            {/* ── 1. Executive & Organisation ── */}
            <Section icon={BuildingIcon} title="Executive & Organisation" subtitle="Section 01" index={1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Organisation</FieldLabel>
                  <Input className="dark-input" value={organisation?.orgName || "Unknown"} readOnly />
                </div>
                <div>
                  <FieldLabel>Executive</FieldLabel>
                  <Input className="dark-input" value={executive?.name || "Unknown"} readOnly />
                </div>
              </div>
            </Section>

            {/* ── 2. Visit Details ── */}
            <Section icon={PhoneCallIcon} title="Visit Details" subtitle="Section 02" index={2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><FieldLabel>Visit Date</FieldLabel><Input className="dark-input" value={lead.visitDate ? format(new Date(lead.visitDate), "PPP") : "N/A"} readOnly /></div>
                <div><FieldLabel>Call Type</FieldLabel><Input className="dark-input" value={lead.callType || "N/A"} readOnly /></div>
                <div><FieldLabel>Created At</FieldLabel><Input className="dark-input" value={lead.createdAt ? format(new Date(lead.createdAt), "PPP p") : "N/A"} readOnly /></div>
              </div>
            </Section>

            {/* ── 3. Contacts & Discussions ── */}
            <Section icon={UsersIcon} title="Contacts & Discussions" subtitle="Section 03" index={3}>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-4">
                  {contacts.map((contact, i) => (
                    <div key={i} className="relative rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Name</FieldLabel>
                          <Input className="dark-input" value={contact.contactPersonName || "N/A"} readOnly />
                        </div>
                        <div>
                          <FieldLabel>Discussion For</FieldLabel>
                          <Input className="dark-input" value={contact.discussionFor || "N/A"} readOnly />
                        </div>
                        <div>
                          <FieldLabel>Designation / Dept.</FieldLabel>
                          <Input className="dark-input" value={contact.contactPersonDesignationDept || "N/A"} readOnly />
                        </div>
                        <div>
                          <FieldLabel>Phone Number</FieldLabel>
                          <Input className="dark-input" value={contact.contactPersonPhone || "N/A"} readOnly />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No contacts provided for this lead.</p>
              )}
            </Section>

            {/* ── 4. Commercial Details ── */}
            <Section icon={WifiIcon} title="Commercial Details" subtitle="Section 04" index={4}>
              {commercials && commercials.length > 0 ? (
                <div className="space-y-4">
                  {commercials.map((detail, i) => (
                    <div key={i} className="relative rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><FieldLabel>Service Type</FieldLabel><Input className="dark-input" value={detail.serviceType || "N/A"} readOnly /></div>
                        <div><FieldLabel>Current Provider</FieldLabel><Input className="dark-input" value={detail.currentProvider || "N/A"} readOnly /></div>
                        <div><FieldLabel>No. of Connections</FieldLabel><Input className="dark-input" value={detail.noOfConnections || "N/A"} readOnly /></div>
                        <div><FieldLabel>Current Plan</FieldLabel><Input className="dark-input" value={detail.currentRentalPlan || "N/A"} readOnly /></div>
                        <div><FieldLabel>Monthly Spend (₹)</FieldLabel><Input className="dark-input" value={detail.totalMonthlyExpenses || "N/A"} readOnly /></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No commercial details provided for this lead.</p>
              )}
            </Section>

            {/* ── 5. Call Outcome ── */}
            <Section icon={ThermometerIcon} title="Call Outcome" subtitle="Section 05" index={5}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><FieldLabel>Call Temperature</FieldLabel><Input className="dark-input" value={lead.callTemperature || "N/A"} readOnly /></div>
                <div><FieldLabel>Next Follow-up Date</FieldLabel><Input className="dark-input" value={lead.nextFollowUpDate ? format(new Date(lead.nextFollowUpDate), "PPP") : "None"} readOnly /></div>
                <div><FieldLabel>Updated At</FieldLabel><Input className="dark-input" value={lead.updatedAt ? format(new Date(lead.updatedAt), "PPP p") : "N/A"} readOnly /></div>
              </div>
            </Section>

            {/* ── 6. Location ── */}
            <Section icon={MapPinIcon} title="Location Details" subtitle="Section 06" index={6}>
              {lead.locationLat && lead.locationLng ? (
                <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="flex-1">
                    <FieldLabel>Coordinates (Lat, Lng)</FieldLabel>
                    <Input className="dark-input font-mono text-sm" value={`${lead.locationLat}, ${lead.locationLng}`} readOnly />
                  </div>
                  <Button variant="outline" asChild className="dark-input h-10 shrink-0 hover:bg-white/[0.04]">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${lead.locationLat},${lead.locationLng}`} target="_blank" rel="noreferrer" title="View on Google Maps">
                      <MapPinIcon className="h-4 w-4 mr-2" /> View on Maps
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No GPS coordinates captured for this lead.</p>
              )}
            </Section>

            {/* ── 7. Remarks ── */}
            <Section icon={StickyNoteIcon} title="Final Remarks" subtitle="Section 07" index={7}>
              <div>
                <FieldLabel>Notes & Observations</FieldLabel>
                <Textarea className="dark-input min-h-[100px] resize-none" value={lead.finalRemarks || "No remarks provided."} readOnly />
              </div>
            </Section>

            {/* ── 8. Photos ── */}
            {lead.photoUrls && Array.isArray(lead.photoUrls) && lead.photoUrls.length > 0 && (
              <Section icon={ImageIcon} title="Location Photos" subtitle="Section 08" index={8}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(lead.photoUrls as string[]).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                      <img src={url} alt={`Lead photo ${i + 1}`} className="object-cover w-full h-full hover:opacity-80 transition-opacity duration-300" />
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
