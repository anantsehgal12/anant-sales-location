"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LoaderCircleIcon,
  PlusCircleIcon,
  Edit2Icon,
  Trash2Icon,
  TargetIcon,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { isAdmin } from "@/lib/isAdmis";

type LeadRecord = {
  lead: {
    id: string;
    visitDate: string;
    callType: string;
    callTemperature: string;
    finalRemarks: string;
    discussionFor: string;
  };
  executive: { name: string };
  organisation: { orgName: string };
};

const EMPTY_LEAD = { callTemperature: "", finalRemarks: "" };

export default function AdminLeads() {
  const [data, setData] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_LEAD);

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

  const handleSave = async () => {
    if (!editingId) return;
    await fetch(`/api/leads/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callTemperature: form.callTemperature || undefined,
        finalRemarks: form.finalRemarks,
      }),
    });
    setIsOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (record: LeadRecord) => {
    setForm({
      callTemperature: record.lead.callTemperature || "",
      finalRemarks: record.lead.finalRemarks || "",
    });
    setEditingId(record.lead.id);
    setIsOpen(true);
  };

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-extrabold text-white">
                Leads Log
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Review captured field visits and outcomes.
              </p>
            </div>
            <Button
              onClick={() => {
                window.location.href = "/";
              }}
              className="bg-amber-500 text-black hover:bg-amber-400 gap-2 font-semibold"
            >
              <PlusCircleIcon className="h-4 w-4" /> Open Capture Form
            </Button>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center text-amber-500">
                <LoaderCircleIcon className="animate-spin h-8 w-8" />
              </div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No leads found.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {data.map((row) => (
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
                        onClick={() => openEdit(row)}
                      >
                        <Edit2Icon className="h-3 w-3 text-slate-400 hover:text-amber-400" />{" "}
                        Edit
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

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-[#0f1218] border border-white/[0.08] text-slate-200">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-white">
                Edit Lead Notes
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs text-slate-400">
                  Temperature (Hot / Cold)
                </Label>
                <Input
                  className="dark-input mt-1.5"
                  value={form.callTemperature}
                  onChange={(e) =>
                    setForm({ ...form, callTemperature: e.target.value })
                  }
                  placeholder="e.g. Hot"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Final Remarks</Label>
                <Textarea
                  className="dark-input mt-1.5 min-h-[100px]"
                  value={form.finalRemarks}
                  onChange={(e) =>
                    setForm({ ...form, finalRemarks: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-slate-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  } else {
    return <h1 className="text-2xl font-bold text-white">Access Denied</h1>;
  }
}
