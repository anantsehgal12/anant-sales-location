"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LoaderCircleIcon,
  PlusCircleIcon,
  Edit2Icon,
  Trash2Icon,
  BuildingIcon,
} from "lucide-react";
import { isAdmin } from "@/lib/isAdmis";
import { useUser } from "@clerk/nextjs";
import { orgSegmentEnum } from "@/src/db/schema";

type Org = {
  id: string;
  orgName: string;
  orgSegment: string;
  orgArea: string;
  orgPincode: string;
};
const EMPTY_ORG = { orgName: "", orgSegment: "", orgArea: "", orgPincode: "" };

export default function AdminOrganisations() {
  const [data, setData] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ORG);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organisations");
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const method = editingId ? "PATCH" : "POST";
    const url = editingId
      ? `/api/organisations/${editingId}`
      : "/api/organisations";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    await fetch(`/api/organisations/${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (org: Org) => {
    setForm({
      orgName: org.orgName,
      orgSegment: org.orgSegment || "",
      orgArea: org.orgArea || "",
      orgPincode: org.orgPincode || "",
    });
    setEditingId(org.id);
    setIsOpen(true);
  };
  const { user } = useUser();

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
          <div className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-[120px]" />
        </div>

        <div className="relative mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-extrabold text-white">
                Companies
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage the organisations in your directory.
              </p>
            </div>
            <Button
              onClick={() => {
                setForm(EMPTY_ORG);
                setEditingId(null);
                setIsOpen(true);
              }}
              className="bg-amber-500 w-full sm:w-auto text-black hover:bg-amber-400 gap-2 font-semibold"
            >
              <PlusCircleIcon className="h-4 w-4" /> Add Company
            </Button>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center text-amber-500">
                <LoaderCircleIcon className="animate-spin h-8 w-8" />
              </div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No companies found.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {data.map((org) => (
                  <div
                    key={org.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                        <BuildingIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {org.orgName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {[org.orgSegment, org.orgArea, org.orgPincode]
                            .filter(Boolean)
                            .join(" • ") || "No details"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(org)}
                      >
                        <Edit2Icon className="h-4 w-4 text-slate-400 hover:text-amber-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(org.id)}
                      >
                        <Trash2Icon className="h-4 w-4 text-red-400 hover:text-red-300" />
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
                {editingId ? "Edit Company" : "New Company"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs text-slate-400">Company Name</Label>
                <Input
                  className="dark-input mt-1.5"
                  value={form.orgName}
                  onChange={(e) =>
                    setForm({ ...form, orgName: e.target.value })
                  }
                />
              </div>
              <div>
            <Label className="text-xs text-slate-400">Segment</Label>
            <Select
              value={form.orgSegment || undefined}
              onValueChange={(val) =>
                setForm({ ...form, orgSegment: val })
              }
            >
              <SelectTrigger className="dark-input mt-1.5 text-left w-full">
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1218] border-white/[0.08] text-slate-200">
                {orgSegmentEnum.enumValues.map((seg, idx) => (
                  <SelectItem key={idx} value={seg} className="focus:bg-white/[0.06] focus:text-white cursor-pointer">
                    {seg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Area</Label>
                  <Input
                    className="dark-input mt-1.5"
                    value={form.orgArea}
                    onChange={(e) =>
                      setForm({ ...form, orgArea: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Pincode</Label>
                  <Input
                    className="dark-input mt-1.5"
                    value={form.orgPincode}
                    onChange={(e) =>
                      setForm({ ...form, orgPincode: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                {editingId ? "Save Changes" : "Add Company"}
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
