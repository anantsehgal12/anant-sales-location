"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LoaderCircleIcon,
  PlusCircleIcon,
  Trash2Icon,
  TargetIcon,
  CalendarIcon,
  EyeIcon,
  DownloadIcon,
  FilterIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { isAdmin } from "@/lib/isAdmis";
import Link from "next/link";
import { getLeadsForExport } from "./actions";

type LeadRecord = {
  lead: {
    id: string;
    visitDate: string;
    callType: string;
    callTemperature: string;
    finalRemarks: string;
    discussionFor?: string;
    nextFollowUpDate?: string | null;
    locationLat?: number | null;
    locationLng?: number | null;
    createdAt?: string | null;
    photoUrls?: string[] | null | unknown;
  };
  executive: { name: string };
  organisation: { orgName: string };
};

export default function AdminLeads() {
  const [data, setData] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTemp, setFilterTemp] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { user } = useUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await getLeadsForExport();

      const maxContacts = Math.max(...data.map((d) => d.contacts.length), 0);
      const maxCommercials = Math.max(...data.map((d) => d.commercials.length), 0);
      const maxPhotos = Math.max(...data.map((d) => Array.isArray(d.lead.photoUrls) ? d.lead.photoUrls.length : 0), 0);

      const headers = [
        "Lead ID",
        "Organization",
        "Executive",
        "Visit Date",
        "Call Type",
        "Call Temperature",
        "Next Follow-up Date",
        "Location Lat",
        "Location Long",
        "Location Link",
        "Created At",
      ];

      for (let i = 1; i <= maxContacts; i++) {
        headers.push(
          `Contact ${i} Name`,
          `Contact ${i} Designation/Dept`,
          `Contact ${i} Phone`,
          `Contact ${i} Discussion For`
        );
      }

      for (let i = 1; i <= maxCommercials; i++) {
        headers.push(
          `Commercial ${i} Service Type`,
          `Commercial ${i} Provider`,
          `Commercial ${i} Connections`,
          `Commercial ${i} Plan`,
          `Commercial ${i} Spend (₹)`
        );
      }

      headers.push("Final Remarks");
      for (let i = 1; i <= maxPhotos; i++) {
        headers.push(`Photo ${i}`);
      }

      const rows = data.map((row) => {
        const { lead, organisation, executive, contacts, commercials } = row;

        const baseRow = [
          lead.id,
          organisation?.orgName || "Unknown",
          executive?.name || "Unknown",
          lead.visitDate ? format(new Date(lead.visitDate), "yyyy-MM-dd") : "N/A",
          lead.callType || "N/A",
          lead.callTemperature || "N/A",
          lead.nextFollowUpDate ? format(new Date(lead.nextFollowUpDate), "yyyy-MM-dd") : "N/A",
          lead.locationLat || "N/A",
          lead.locationLng || "N/A",
          (lead.locationLat && lead.locationLng) ? `https://www.google.com/maps/search/?api=1&query=${lead.locationLat},${lead.locationLng}` : "N/A",
          lead.createdAt ? format(new Date(lead.createdAt), "yyyy-MM-dd HH:mm:ss") : "N/A",
        ];

        const contactsData = [];
        for (let i = 0; i < maxContacts; i++) {
          const c = contacts[i];
          if (c) {
            contactsData.push(
              c.contactPersonName || "N/A",
              c.contactPersonDesignationDept || "N/A",
              c.contactPersonPhone || "N/A",
              c.discussionFor || "N/A"
            );
          } else {
            contactsData.push("N/A", "N/A", "N/A", "N/A");
          }
        }

        const commercialsData = [];
        for (let i = 0; i < maxCommercials; i++) {
          const c = commercials[i];
          if (c) {
            commercialsData.push(
              c.serviceType || "N/A",
              c.currentProvider || "N/A",
              c.noOfConnections || "N/A",
              c.currentRentalPlan || "N/A",
              c.totalMonthlyExpenses || "0"
            );
          } else {
            commercialsData.push("N/A", "N/A", "N/A", "N/A", "N/A");
          }
        }

        const remarksAndPhotos = [
          lead.finalRemarks || "N/A"
        ];
        const photos = Array.isArray(lead.photoUrls) ? lead.photoUrls : [];
        for (let i = 0; i < maxPhotos; i++) {
          remarksAndPhotos.push(photos[i] || "N/A");
        }

        return [...baseRow, ...contactsData, ...commercialsData, ...remarksAndPhotos]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Leads_Export_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const filteredData = data.filter((row) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const orgMatch = row.organisation?.orgName?.toLowerCase().includes(q);
      const execMatch = row.executive?.name?.toLowerCase().includes(q);
      const remarksMatch = row.lead.finalRemarks?.toLowerCase().includes(q);
      if (!orgMatch && !execMatch && !remarksMatch) return false;
    }
    if (filterTemp !== "All") {
      if (!row.lead.callTemperature?.includes(filterTemp)) return false;
    }
    if (filterType !== "All") {
      if (row.lead.callType !== filterType) return false;
    }
    if (startDate) {
      if (!row.lead.visitDate) return false;
      const rowDate = new Date(row.lead.visitDate);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (rowDate < start) return false;
    }
    if (endDate) {
      if (!row.lead.visitDate) return false;
      const rowDate = new Date(row.lead.visitDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (rowDate > end) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "dateDesc") {
      return new Date(b.lead.visitDate || 0).getTime() - new Date(a.lead.visitDate || 0).getTime();
    }
    if (sortBy === "dateAsc") {
      return new Date(a.lead.visitDate || 0).getTime() - new Date(b.lead.visitDate || 0).getTime();
    }
    if (sortBy === "orgAsc") {
      return (a.organisation?.orgName || "").localeCompare(b.organisation?.orgName || "");
    }
    if (sortBy === "execAsc") {
      return (a.executive?.name || "").localeCompare(b.executive?.name || "");
    }
    return 0;
  });

  if (isAdmin(user)) {
    return (
      <div className="font-body min-h-screen bg-[#0a0c10] text-slate-200 p-6 sm:p-10">
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        * { box-sizing: border-box; }
        body { background: #0a0c10; }
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .dark-input {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #e2e8f0 !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dark-input:focus { border-color: rgba(251,191,36,0.5) !important; box-shadow: 0 0 0 3px rgba(251,191,36,0.08) !important; outline: none !important; }
        .dark-input::placeholder { color: #475569 !important; }
      `}</style>

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        </div>

        <div className="relative mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-extrabold text-white">
                Leads Log
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Review captured field visits and outcomes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="dark-input w-full sm:w-auto gap-2">
                    <FilterIcon className="h-4 w-4" /> Filter & Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-[#0f1218] border border-white/[0.08] text-slate-200 p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold text-white">Filter & Sort</h4>
                    
                    <div>
                      <Label className="text-xs text-slate-400">Search</Label>
                      <Input 
                        placeholder="Org, Executive, Remarks..." 
                        className="dark-input mt-1.5 h-8 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">From Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "dark-input mt-1.5 h-8 w-full justify-start text-left font-normal text-sm",
                                !startDate && "text-slate-500"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                              {startDate ? format(startDate, "dd MMM yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto bg-[#131720] border-white/[0.08] p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              className="text-slate-200"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">To Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "dark-input mt-1.5 h-8 w-full justify-start text-left font-normal text-sm",
                                !endDate && "text-slate-500"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                              {endDate ? format(endDate, "dd MMM yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto bg-[#131720] border-white/[0.08] p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              className="text-slate-200"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">Temperature</Label>
                        <Select value={filterTemp} onValueChange={setFilterTemp}>
                          <SelectTrigger className="dark-input mt-1.5 h-8 text-sm text-left">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Hot">Hot</SelectItem>
                            <SelectItem value="Warm">Warm</SelectItem>
                            <SelectItem value="Cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="dark-input mt-1.5 h-8 text-sm text-left">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#131720] border-white/[0.08] text-slate-200">
                            <SelectItem value="dateDesc">Newest First</SelectItem>
                            <SelectItem value="dateAsc">Oldest First</SelectItem>
                            <SelectItem value="orgAsc">Org Name (A-Z)</SelectItem>
                            <SelectItem value="execAsc">Executive (A-Z)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full h-8 text-xs text-slate-400 hover:text-white mt-2"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterTemp("All");
                        setFilterType("All");
                        setSortBy("dateDesc");
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exporting}
                className="dark-input w-full sm:w-auto gap-2"
              >
                {exporting ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
                {exporting ? "Exporting..." : "Export to Excel"}
              </Button>
              <Button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="bg-amber-500 text-black w-full sm:w-auto hover:bg-amber-400 gap-2 font-semibold"
              >
                <PlusCircleIcon className="h-4 w-4" /> Open Capture Form
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center text-amber-500">
                <LoaderCircleIcon className="animate-spin h-8 w-8" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No leads found.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filteredData.map((row) => (
                  <div
                    key={row.lead.id}
                    className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex mt-1 h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        <TargetIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-lg">
                            {row.organisation?.orgName || "Unknown Org"}
                          </p>
                          {row.lead.callTemperature && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] bg-white/[0.05] text-slate-300">
                              {row.lead.callTemperature === "Hot"
                                ? "🔥 Hot"
                                : "🧊 Cold"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-amber-400 mt-0.5">
                          {row.lead.discussionFor} • {row.lead.callType}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3" />{" "}
                            {format(
                              new Date(row.lead.visitDate),
                              "dd MMM yyyy",
                            )}
                          </span>
                          <span>By: {row.executive?.name || "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 justify-end shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 justify-start"
                        asChild
                      >
                        <Link href={`/admin/leads/${row.lead.id}`}>
                          <EyeIcon className="h-3 w-3 text-blue-400 hover:text-blue-300" />{" "}
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 justify-start"
                        onClick={() => handleDelete(row.lead.id)}
                      >
                        <Trash2Icon className="h-3 w-3 text-red-400 hover:text-red-300" />{" "}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return <h1 className="text-2xl font-bold text-white">Access Denied</h1>;
  }
}
