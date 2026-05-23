"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  LocateFixedIcon,
  LoaderCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  BuildingIcon,
  PhoneCallIcon,
  WifiIcon,
  TvIcon,
  ThermometerIcon,
  UserIcon,
  StickyNoteIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  ChevronsUpDownIcon,
  CheckIcon,
  BriefcaseIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Navbar from "./_components/Navbar";
import {
  callTemperatureEnum,
  callTypeEnum,
  discussionForEnum,
  serviceProviderEnum,
  orgSegmentEnum,
} from "@/src/db/schema";


// ─── Types ───────────────────────────────────────────────────────────────────

type CallType = typeof callTypeEnum.enumValues[number];
type DiscussionFor = typeof discussionForEnum.enumValues[number];
type ServiceProvider = typeof serviceProviderEnum.enumValues[number];
type CallTemperature = typeof callTemperatureEnum.enumValues[number];
type OrgSegment = typeof orgSegmentEnum.enumValues[number];

interface Executive {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Organisation {
  id: string;
  orgName: string;
  orgSegment: OrgSegment | null;
  orgArea: string | null;
  orgPincode: string | null;
}

interface ContactForm {
  contactPersonName: string;
  contactPersonDesignationDept: string;
  contactPersonPhone: string;
  discussionFor: DiscussionFor | "";
}

interface CommercialDetailForm {
  serviceType: DiscussionFor | "";
  currentProvider: ServiceProvider | "";
  noOfConnections: string;
  currentRentalPlan: string;
  totalMonthlyExpenses: string;
}

interface LeadForm {
  executiveId: string;
  organisationId: string;
  visitDate: Date | undefined;
  callType: CallType | "";
  locationLat: number | null;
  locationLng: number | null;
  contacts: ContactForm[];
  commercialDetails: CommercialDetailForm[];
  callTemperature: CallTemperature | "";
  nextFollowUpDate: Date | undefined;
  finalRemarks: string;
}

interface NewExecForm {
  name: string;
  email: string;
  phone: string;
}

interface NewOrgForm {
  orgName: string;
  orgSegment: OrgSegment | "";
  orgArea: string;
  orgPincode: string;
}

const EMPTY_LEAD: LeadForm = {
  executiveId: "",
  organisationId: "",
  visitDate: new Date(),
  callType: "",
  locationLat: null,
  locationLng: null,
  contacts: [
    {
      contactPersonName: "",
      contactPersonDesignationDept: "",
      contactPersonPhone: "",
      discussionFor: "",
    },
  ],
  commercialDetails: [
    {
      serviceType: "",
      currentProvider: "",
      noOfConnections: "",
      currentRentalPlan: "",
      totalMonthlyExpenses: "",
    },
  ],
  callTemperature: "",
  nextFollowUpDate: undefined,
  finalRemarks: "",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">
      {children}
      {required && <span className="ml-1 text-amber-400">*</span>}
    </Label>
  );
}

// ─── Read-only org detail field ───────────────────────────────────────────────

function OrgDetailField({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
  return (
    <div>
      <FieldLabel>
        {Icon ? <span className="flex items-center gap-1.5"><Icon className="h-3 w-3 text-slate-600" />{label}</span> : label}
      </FieldLabel>
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-md border px-3 text-sm transition-all duration-300",
          value
            ? "border-white/[0.08] bg-white/[0.03] text-slate-300"
            : "border-dashed border-white/[0.04] bg-transparent text-slate-600 italic"
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewLeadPage() {
  const [form, setForm] = useState<LeadForm>(EMPTY_LEAD);

  // Executives
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [execsLoading, setExecsLoading] = useState(true);
  const [execComboOpen, setExecComboOpen] = useState(false);
  const selectedExec = executives.find((e) => e.id === form.executiveId) ?? null;
  const [execDialogOpen, setExecDialogOpen] = useState(false);
  const [newExec, setNewExec] = useState<NewExecForm>({ name: "", email: "", phone: "" });
  const [execSaving, setExecSaving] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgComboOpen, setOrgComboOpen] = useState(false);

  // Selected org object (derived)
  const selectedOrg = orgs.find((o) => o.id === form.organisationId) ?? null;

  // New org dialog
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState<NewOrgForm>({ orgName: "", orgSegment: "", orgArea: "", orgPincode: "" });
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Location
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch executives ────────────────────────────────────────────────────
  const fetchExecs = useCallback(async () => {
    setExecsLoading(true);
    try {
      const res = await fetch("/api/executives");
      const json = await res.json();
      if (json.success) setExecutives(json.data);
    } catch {
      // silently fail
    } finally {
      setExecsLoading(false);
    }
  }, []);

  useEffect(() => { fetchExecs(); }, [fetchExecs]);

  // ── Fetch organisations ─────────────────────────────────────────────────
  const fetchOrgs = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const res = await fetch("/api/organisations");
      const json = await res.json();
      if (json.success) setOrgs(json.data);
    } catch {
      // silently fail
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const set = <K extends keyof LeadForm>(key: K, value: LeadForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setExec = <K extends keyof NewExecForm>(key: K, value: NewExecForm[K]) =>
    setNewExec((prev) => ({ ...prev, [key]: value }));

  const setOrg = <K extends keyof NewOrgForm>(key: K, value: NewOrgForm[K]) =>
    setNewOrg((prev) => ({ ...prev, [key]: value }));

  // ── Create Executive ────────────────────────────────────────────────────
  const handleCreateExec = async () => {
    if (!newExec.name.trim()) { setExecError("Executive name is required."); return; }
    setExecSaving(true);
    setExecError(null);
    try {
      const res = await fetch("/api/executives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExec.name.trim(),
          email: newExec.email.trim() || undefined,
          phone: newExec.phone.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const created: Executive = json.data;
      setExecutives((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      set("executiveId", created.id);
      setExecDialogOpen(false);
      setNewExec({ name: "", email: "", phone: "" });
    } catch (e: any) {
      setExecError(e.message ?? "Failed to create executive.");
    } finally {
      setExecSaving(false);
    }
  };

  // ── Create Organisation ─────────────────────────────────────────────────
  const handleCreateOrg = async () => {
    if (!newOrg.orgName.trim()) { setOrgError("Organisation name is required."); return; }
    setOrgSaving(true);
    setOrgError(null);
    try {
      const res = await fetch("/api/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: newOrg.orgName.trim(),
          orgSegment: newOrg.orgSegment || undefined,
          orgArea: newOrg.orgArea.trim() || undefined,
          orgPincode: newOrg.orgPincode.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const created: Organisation = json.data;
      setOrgs((prev) => [...prev, created].sort((a, b) => a.orgName.localeCompare(b.orgName)));
      set("organisationId", created.id);
      setOrgDialogOpen(false);
      setNewOrg({ orgName: "", orgSegment: "", orgArea: "", orgPincode: "" });
    } catch (e: any) {
      setOrgError(e.message ?? "Failed to create organisation.");
    } finally {
      setOrgSaving(false);
    }
  };

  // ── Geolocation ─────────────────────────────────────────────────────────
  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("locationLat", pos.coords.latitude);
        set("locationLng", pos.coords.longitude);
        setLocating(false);
      },
      () => { setLocError("Permission denied or location unavailable."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Submit Lead ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.executiveId || !form.organisationId || !form.visitDate || !form.callType) {
      setSubmitError("Please fill in all required fields before submitting.");
      return;
    }

    const hasInvalidContact = form.contacts.some(c => !c.contactPersonName.trim() || !c.discussionFor);
    if (hasInvalidContact) {
      setSubmitError("Please provide a name and discussion topic for all contacts.");
      return;
    }

    const hasInvalidCommercial = form.commercialDetails.some(cd => !cd.serviceType);
    if (hasInvalidCommercial) {
      setSubmitError("Please select a Service Type for all commercial details.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          visitDate: form.visitDate ? format(form.visitDate, "yyyy-MM-dd") : undefined,
          nextFollowUpDate: form.nextFollowUpDate ? format(form.nextFollowUpDate, "yyyy-MM-dd") : undefined,
          callTemperature: form.callTemperature || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const mapSrc =
    form.locationLat && form.locationLng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${form.locationLng - 0.005},${form.locationLat - 0.005},${form.locationLng + 0.005},${form.locationLat + 0.005}&layer=mapnik&marker=${form.locationLat},${form.locationLng}`
      : null;

  if (!mounted) return null;

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0c10] px-4">
        <div className="text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30">
            <CheckCircle2Icon className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white">Lead Captured</h2>
          <p className="mt-2 text-slate-400">The visit has been logged successfully.</p>
          <Button
            onClick={() => { setSubmitted(false); setForm(EMPTY_LEAD); }}
            className="mt-8 bg-amber-500 text-black hover:bg-amber-400"
          >
            Log Another Visit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
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
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.65); }
        }
        .animate-section  { animation: section-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-fade-in  { animation: fade-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.22,1,0.36,1) both; }
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
        .dark-input::placeholder { color: #475569 !important; }

        /* Command palette dark override */
        [cmdk-root] { background: #0f1420 !important; }
        [cmdk-input] { background: transparent !important; color: #e2e8f0 !important; border-color: rgba(255,255,255,0.08) !important; }
        [cmdk-input]::placeholder { color: #475569 !important; }
        [cmdk-item] { color: #cbd5e1 !important; cursor: pointer; }
        [cmdk-item][aria-selected="true"] { background: rgba(251,191,36,0.08) !important; color: #fbbf24 !important; }
        [cmdk-item]:hover { background: rgba(255,255,255,0.04) !important; }
        [cmdk-empty] { color: #475569 !important; }

        .temp-btn {
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 0.75rem; padding: 0.75rem 1rem;
          cursor: pointer; transition: all 0.2s;
          font-weight: 600; font-size: 0.875rem;
          background: rgba(255,255,255,0.02); color: #94a3b8;
          flex: 1;
        }
        .temp-btn:hover { border-color: rgba(255,255,255,0.16); color: #cbd5e1; }
        .temp-btn.active-hot  { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.4); color:#f87171; }
        .temp-btn.active-cold { background:rgba(59,130,246,0.12); border-color:rgba(59,130,246,0.4); color:#60a5fa; }

        [role="dialog"] { background: #0f1218 !important; border-color: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* ── New Executive Dialog ── */}
      <Dialog open={execDialogOpen} onOpenChange={setExecDialogOpen}>
        <DialogContent className="bg-[#0f1218] border border-white/[0.08] text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">New Executive</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Add a new executive. It will be immediately available in the search.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <FieldLabel required>Executive Name</FieldLabel>
              <Input
                className="dark-input"
                placeholder="e.g. Rahul Sharma"
                value={newExec.name}
                onChange={(e) => setExec("name", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateExec(); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input
                  className="dark-input"
                  placeholder="e.g. rahul@example.com"
                  type="email"
                  value={newExec.email}
                  onChange={(e) => setExec("email", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  className="dark-input"
                  placeholder="e.g. 9876543210"
                  value={newExec.phone}
                  onChange={(e) => setExec("phone", e.target.value)}
                />
              </div>
            </div>
            {execError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
                {execError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-slate-200"
              onClick={() => { setExecDialogOpen(false); setExecError(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateExec}
              disabled={execSaving}
              className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {execSaving
                ? <><LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : "Create Executive"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Organisation Dialog ── */}
      <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <DialogContent className="bg-[#0f1218] border border-white/[0.08] text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">New Organisation</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Add a new organisation. It will be immediately available in the search.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <FieldLabel required>Organisation Name</FieldLabel>
              <Input
                className="dark-input"
                placeholder="e.g. Horizon Enterprises Pvt Ltd"
                value={newOrg.orgName}
                onChange={(e) => setOrg("orgName", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateOrg(); }}
              />
            </div>
            <div>
              <FieldLabel>Segment</FieldLabel>
              <Select onValueChange={(v) => setOrg("orgSegment", v as OrgSegment)}>
                <SelectTrigger className="dark-input w-full">
                  <SelectValue placeholder="Select segment…" />
                </SelectTrigger>
                <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                  {orgSegmentEnum.enumValues.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Area / Locality</FieldLabel>
                <Input
                  className="dark-input"
                  placeholder="e.g. Civil Lines"
                  value={newOrg.orgArea}
                  onChange={(e) => setOrg("orgArea", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Pincode</FieldLabel>
                <Input
                  className="dark-input"
                  placeholder="e.g. 242001"
                  maxLength={10}
                  value={newOrg.orgPincode}
                  onChange={(e) => setOrg("orgPincode", e.target.value)}
                />
              </div>
            </div>
            {orgError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
                {orgError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-slate-200"
              onClick={() => { setOrgDialogOpen(false); setOrgError(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={orgSaving}
              className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {orgSaving
                ? <><LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : "Create Organisation"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Page ── */}
      <div className="font-body min-h-screen bg-[#0a0c10] pb-28">

        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/[0.03] blur-[100px]" />
        </div>

        <div className="relative w-full px-3 sm:px-6 lg:px-10 xl:px-16 pt-10">

          {/* ── Header ── */}
          <div className="mb-8 animate-section" style={{ animationDelay: "0ms" }}>
            <div className="mb-2 flex items-center gap-2">
              <span className="pulse-dot h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">Field Visit Log</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-white">New Lead Entry</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Fields marked <span className="text-amber-400">*</span> are required.
            </p>
          </div>

          <div className="space-y-4">

            {/* ── 1. Executive ── */}
            <Section icon={BriefcaseIcon} title="Executive" subtitle="Section 01" index={1}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex-1">
                    <FieldLabel required>Search Executive</FieldLabel>
                    <Popover open={execComboOpen} onOpenChange={setExecComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={execComboOpen}
                          className={cn(
                            "dark-input w-full justify-between font-normal",
                            !selectedExec && "text-slate-500"
                          )}
                        >
                          <span className="truncate">
                            {selectedExec ? selectedExec.name : "Search & select executive…"}
                          </span>
                          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 text-slate-500" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="p-0 w-[var(--radix-popover-trigger-width)] bg-[#0f1420] border border-white/[0.08]"
                        align="start"
                      >
                        <Command className="bg-transparent">
                          <CommandInput
                            placeholder="Type to search…"
                            className="h-10 text-sm border-b border-white/[0.06]"
                          />
                          <CommandList className="max-h-56">
                            {execsLoading ? (
                              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                                <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Loading…
                              </div>
                            ) : (
                              <>
                                <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                                  No executive found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {executives.map((exec) => (
                                    <CommandItem
                                      key={exec.id}
                                      value={exec.name}
                                      onSelect={() => {
                                        set("executiveId", exec.id === form.executiveId ? "" : exec.id);
                                        setExecComboOpen(false);
                                      }}
                                      className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer"
                                    >
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate">{exec.name}</span>
                                        {(exec.email || exec.phone) && (
                                          <span className="text-[11px] text-slate-500 truncate">
                                            {[exec.email, exec.phone].filter(Boolean).join(" · ")}
                                          </span>
                                        )}
                                      </div>
                                      <CheckIcon
                                        className={cn(
                                          "h-4 w-4 shrink-0 text-amber-400 transition-opacity",
                                          form.executiveId === exec.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>

                          <div className="border-t border-white/[0.06] p-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="flex-1 gap-1.5 text-xs text-slate-400 hover:text-amber-400"
                              onClick={() => { fetchExecs(); }}
                            >
                              <RefreshCwIcon className="h-3 w-3" /> Refresh
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 gap-1.5 text-xs bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 hover:bg-amber-500/20"
                              onClick={() => { setExecComboOpen(false); setExecError(null); setExecDialogOpen(true); }}
                            >
                              <PlusCircleIcon className="h-3 w-3" /> New Executive
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── 2. Organisation ── */}
            <Section icon={BuildingIcon} title="Organisation" subtitle="Section 02" index={2}>
              <div className="space-y-4">

                {/* Combobox trigger row */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex-1">
                    <FieldLabel required>Search Organisation</FieldLabel>
                    <Popover open={orgComboOpen} onOpenChange={setOrgComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={orgComboOpen}
                          className={cn(
                            "dark-input w-full justify-between font-normal",
                            !selectedOrg && "text-slate-500"
                          )}
                        >
                          <span className="truncate">
                            {selectedOrg ? selectedOrg.orgName : "Search & select organisation…"}
                          </span>
                          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 text-slate-500" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="p-0 w-[var(--radix-popover-trigger-width)] bg-[#0f1420] border border-white/[0.08]"
                        align="start"
                      >
                        <Command className="bg-transparent">
                          <CommandInput
                            placeholder="Type to search…"
                            className="h-10 text-sm border-b border-white/[0.06]"
                          />
                          <CommandList className="max-h-56">
                            {orgsLoading ? (
                              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                                <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Loading…
                              </div>
                            ) : (
                              <>
                                <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                                  No organisation found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {orgs.map((org) => (
                                    <CommandItem
                                      key={org.id}
                                      value={org.orgName}
                                      onSelect={() => {
                                        set("organisationId", org.id === form.organisationId ? "" : org.id);
                                        setOrgComboOpen(false);
                                      }}
                                      className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer"
                                    >
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate">{org.orgName}</span>
                                        {(org.orgArea || org.orgSegment) && (
                                          <span className="text-[11px] text-slate-500 truncate">
                                            {[org.orgSegment, org.orgArea].filter(Boolean).join(" · ")}
                                          </span>
                                        )}
                                      </div>
                                      <CheckIcon
                                        className={cn(
                                          "h-4 w-4 shrink-0 text-amber-400 transition-opacity",
                                          form.organisationId === org.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>

                          {/* Bottom action row inside command palette */}
                          <div className="border-t border-white/[0.06] p-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="flex-1 gap-1.5 text-xs text-slate-400 hover:text-amber-400"
                              onClick={() => { fetchOrgs(); }}
                            >
                              <RefreshCwIcon className="h-3 w-3" /> Refresh
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 gap-1.5 text-xs bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 hover:bg-amber-500/20"
                              onClick={() => { setOrgComboOpen(false); setOrgError(null); setOrgDialogOpen(true); }}
                            >
                              <PlusCircleIcon className="h-3 w-3" /> New Organisation
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Org detail fields — shown & filled only when an org is selected */}
                <div
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all duration-500 overflow-hidden",
                    selectedOrg ? "opacity-100 max-h-40 animate-slide-down" : "opacity-0 max-h-0 pointer-events-none"
                  )}
                >
                  <OrgDetailField
                    label="Segment"
                    value={selectedOrg?.orgSegment}
                    icon={BuildingIcon}
                  />
                  <OrgDetailField
                    label="Area / Locality"
                    value={selectedOrg?.orgArea}
                    icon={MapPinIcon}
                  />
                  <OrgDetailField
                    label="Pincode"
                    value={selectedOrg?.orgPincode}
                  />
                </div>

              </div>
            </Section>

            {/* ── 3. Visit Details ── */}
            <Section icon={PhoneCallIcon} title="Visit Details" subtitle="Section 03" index={3}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Visit Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("dark-input w-full justify-start text-left font-normal", !form.visitDate && "text-slate-500")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                        {form.visitDate ? format(form.visitDate, "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto bg-[#131720] border-white/[0.08] p-0">
                      <Calendar mode="single" selected={form.visitDate} onSelect={(d) => set("visitDate", d)} className="text-slate-200" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <FieldLabel required>Type of Call</FieldLabel>
                  <Select value={form.callType} onValueChange={(v) => set("callType", v as CallType)}>
                    <SelectTrigger className="dark-input w-full">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                      {callTypeEnum.enumValues.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            {/* ── 4. Location ── */}
            <Section icon={MapPinIcon} title="Location" subtitle="Section 04" index={4}>
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={captureLocation}
                  disabled={locating}
                  className="w-full gap-2 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  {locating
                    ? <><LoaderCircleIcon className="h-4 w-4 animate-spin" />Acquiring GPS…</>
                    : <><LocateFixedIcon className="h-4 w-4" />Capture Current Location</>
                  }
                </Button>

                {locError && <p className="text-xs text-red-400">{locError}</p>}

                {form.locationLat && form.locationLng && (
                  <div className="space-y-2 animate-slide-down">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel>Latitude</FieldLabel>
                        <Input className="dark-input font-mono text-xs" value={form.locationLat.toFixed(6)} readOnly />
                      </div>
                      <div>
                        <FieldLabel>Longitude</FieldLabel>
                        <Input className="dark-input font-mono text-xs" value={form.locationLng.toFixed(6)} readOnly />
                      </div>
                    </div>
                    {mapSrc && (
                      <div className="overflow-hidden rounded-xl ring-1 ring-white/[0.07]">
                        <iframe
                          src={mapSrc}
                          width="100%"
                          height="200"
                          className="block"
                          title="Location Map"
                          style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg) saturate(0.6)" }}
                        />
                      </div>
                    )}
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                      <CheckCircle2Icon className="mr-1 h-3 w-3" /> Location captured
                    </Badge>
                  </div>
                )}
              </div>
            </Section>

            {/* ── 5. Contacts & Discussions ── */}
            <Section icon={UsersIcon} title="Contacts & Discussions" subtitle="Section 05" index={5}>
              <div className="space-y-6">
                {form.contacts.map((contact, index) => (
                  <div key={index} className="relative rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
                    {form.contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newContacts = [...form.contacts];
                          newContacts.splice(index, 1);
                          set("contacts", newContacts);
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required>Name</FieldLabel>
                        <Input
                          className="dark-input"
                          placeholder="e.g. Ramesh Gupta"
                          value={contact.contactPersonName}
                          onChange={(e) => {
                            const newContacts = [...form.contacts];
                            newContacts[index].contactPersonName = e.target.value;
                            set("contacts", newContacts);
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Discussion For</FieldLabel>
                        <Select
                          value={contact.discussionFor}
                          onValueChange={(v) => {
                            const newContacts = [...form.contacts];
                            newContacts[index].discussionFor = v as DiscussionFor;
                            set("contacts", newContacts);
                          }}
                        >
                          <SelectTrigger className="dark-input w-full">
                            <SelectValue placeholder="Which service?" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                            {discussionForEnum.enumValues.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Designation / Dept.</FieldLabel>
                        <Input
                          className="dark-input"
                          placeholder="e.g. IT Manager"
                          value={contact.contactPersonDesignationDept}
                          onChange={(e) => {
                            const newContacts = [...form.contacts];
                            newContacts[index].contactPersonDesignationDept = e.target.value;
                            set("contacts", newContacts);
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Phone Number</FieldLabel>
                        <Input
                          className="dark-input"
                          placeholder="e.g. 9876543210"
                          value={contact.contactPersonPhone}
                          onChange={(e) => {
                            const newContacts = [...form.contacts];
                            newContacts[index].contactPersonPhone = e.target.value;
                            set("contacts", newContacts);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-white/[0.1] bg-transparent text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-400"
                  onClick={() => set("contacts", [...form.contacts, { contactPersonName: "", contactPersonDesignationDept: "", contactPersonPhone: "", discussionFor: "" }])}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Another Contact
                </Button>
              </div>
            </Section>

            {/* ── 6. Commercial Details ── */}
            <Section icon={WifiIcon} title="Commercial Details" subtitle="Section 06" index={6}>
              <div className="space-y-6">
                {form.commercialDetails.map((detail, index) => (
                  <div key={index} className="relative rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
                    {form.commercialDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newDetails = [...form.commercialDetails];
                          newDetails.splice(index, 1);
                          set("commercialDetails", newDetails);
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <FieldLabel required>Service Type</FieldLabel>
                        <Select
                          value={detail.serviceType}
                          onValueChange={(v) => {
                            const newDetails = [...form.commercialDetails];
                            newDetails[index].serviceType = v as DiscussionFor;
                            set("commercialDetails", newDetails);
                          }}
                        >
                          <SelectTrigger className="dark-input w-full">
                            <SelectValue placeholder="Which service?" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                            {discussionForEnum.enumValues.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FieldLabel>Current Provider</FieldLabel>
                        <Select
                          value={detail.currentProvider}
                          onValueChange={(v) => {
                            const newDetails = [...form.commercialDetails];
                            newDetails[index].currentProvider = v as ServiceProvider;
                            set("commercialDetails", newDetails);
                          }}
                        >
                          <SelectTrigger className="dark-input w-full">
                            <SelectValue placeholder="Select provider…" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                            {serviceProviderEnum.enumValues.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <FieldLabel>No. of Connections</FieldLabel>
                        <Input
                          className="dark-input"
                          type="number"
                          min="1"
                          placeholder="e.g. 4"
                          value={detail.noOfConnections}
                          onChange={(e) => {
                            const newDetails = [...form.commercialDetails];
                            newDetails[index].noOfConnections = e.target.value;
                            set("commercialDetails", newDetails);
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Current Plan</FieldLabel>
                        <Input
                          className="dark-input"
                          placeholder="e.g. Gold HD"
                          value={detail.currentRentalPlan}
                          onChange={(e) => {
                            const newDetails = [...form.commercialDetails];
                            newDetails[index].currentRentalPlan = e.target.value;
                            set("commercialDetails", newDetails);
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Monthly Spend (₹)</FieldLabel>
                        <Input
                          className="dark-input"
                          type="number"
                          placeholder="e.g. 2500"
                          value={detail.totalMonthlyExpenses}
                          onChange={(e) => {
                            const newDetails = [...form.commercialDetails];
                            newDetails[index].totalMonthlyExpenses = e.target.value;
                            set("commercialDetails", newDetails);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-white/[0.1] bg-transparent text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-400"
                  onClick={() => set("commercialDetails", [...form.commercialDetails, { serviceType: "", currentProvider: "", noOfConnections: "", currentRentalPlan: "", totalMonthlyExpenses: "" }])}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Another Service
                </Button>
              </div>
            </Section>

            {/* ── 7. Outcome ── */}
            <Section icon={ThermometerIcon} title="Call Outcome" subtitle="Section 07" index={7}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Call Temperature</FieldLabel>
                <div className="mt-1 flex flex-col sm:flex-row gap-3">
                  {callTemperatureEnum.enumValues.map((temp) => {
                    const isHot = temp.includes("Hot");
                    const isWarm = temp.includes("Warm");
                    const isCold = temp.includes("Cold");

                    return (
                      <button
                        key={temp}
                        type="button"
                        onClick={() => set("callTemperature", temp as CallTemperature)}
                        className={cn(
                          "temp-btn",
                          form.callTemperature === temp && isHot && "active-hot",
                          form.callTemperature === temp && isWarm && "active-warm",
                          form.callTemperature === temp && isCold && "active-cold"
                        )}
                      >
                        {isHot ? "🔥 " : isWarm ? "☀️ " : "🧊 "}{temp}
                      </button>
                    );
                  })}
                </div>
                </div>

                <div>
                  <FieldLabel>Next Follow-Up Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("dark-input w-full justify-start text-left font-normal", !form.nextFollowUpDate && "text-slate-500")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                        {form.nextFollowUpDate ? format(form.nextFollowUpDate, "dd MMM yyyy") : "Schedule next follow-up…"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto bg-[#131720] border-white/[0.08] p-0">
                      <Calendar
                        mode="single"
                        selected={form.nextFollowUpDate}
                        onSelect={(d) => set("nextFollowUpDate", d)}
                        disabled={(d) => d < new Date()}
                        className="text-slate-200"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </Section>

            {/* ── 8. Remarks ── */}
            <Section icon={StickyNoteIcon} title="Final Remarks" subtitle="Section 08" index={8}>
              <div>
                <FieldLabel>Notes & Observations</FieldLabel>
                <Textarea
                  className="dark-input min-h-[120px] resize-none"
                  placeholder="Summarise the conversation, key pain points, next steps…"
                  value={form.finalRemarks}
                  onChange={(e) => set("finalRemarks", e.target.value)}
                />
                <p className="mt-1.5 text-right text-[11px] text-slate-600">{form.finalRemarks.length} chars</p>
              </div>
            </Section>

          </div>

          {/* ── Submit ── */}
          <div className="mt-6 animate-section" style={{ animationDelay: "800ms" }}>
            {submitError && (
              <div className="mb-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
                {submitError}
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-amber-500 py-6 text-base font-semibold text-black hover:bg-amber-400 disabled:opacity-70"
            >
              {submitting
                ? <><LoaderCircleIcon className="mr-2 h-5 w-5 animate-spin" />Submitting…</>
                : <><ChevronRightIcon className="mr-2 h-5 w-5" />Submit Lead</>
              }
            </Button>
            <p className="mt-3 text-center text-[11px] text-slate-600">
              Data is saved securely and linked to your executive profile.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}