"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { isAdmin } from "@/lib/isAdmis";
import Link from "next/link";
import {
  LoaderCircleIcon,
  UsersIcon,
  BuildingIcon,
  TargetIcon,
  FlameIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type LeadRecord = {
  lead: {
    id: string;
    callTemperature: string;
    callType: string;
    visitDate: string;
    createdAt: string;
    discussionFor?: string;
  };
  executive: { name: string };
  organisation: { orgName: string };
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [execsCount, setExecsCount] = useState(0);
  const [orgsCount, setOrgsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, execsRes, orgsRes] = await Promise.all([
          fetch("/api/leads").then((r) => r.json()),
          fetch("/api/executives").then((r) => r.json()),
          fetch("/api/organisations").then((r) => r.json()),
        ]);

        if (leadsRes.success) setLeads(leadsRes.data);
        if (execsRes.success) setExecsCount(execsRes.data.length);
        if (orgsRes.success) setOrgsCount(orgsRes.data.length);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && isAdmin(user)) {
      fetchData();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <LoaderCircleIcon className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAdmin(user)) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
      </div>
    );
  }

  // Analytics Calculations
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) =>
    l.lead.callTemperature?.includes("Hot")
  ).length;

  const tempCounts = leads.reduce((acc, curr) => {
    const temp = curr.lead.callTemperature || "Unspecified";
    acc[temp] = (acc[temp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = leads.reduce((acc, curr) => {
    const type = curr.lead.callType || "Unspecified";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.lead.createdAt || b.lead.visitDate).getTime() -
        new Date(a.lead.createdAt || a.lead.visitDate).getTime()
    )
    .slice(0, 5);

  // Sort temp and type arrays by count descending
  const sortedTempCounts = Object.entries(tempCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const sortedTypeCounts = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="font-body min-h-screen bg-[#0a0c10] text-slate-200 p-6 sm:p-10">
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
        .animate-section { animation: section-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-amber-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-section" style={{ animationDelay: "0ms" }}>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Graphical insights into your teams, leads, and organisations.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-section" style={{ animationDelay: "100ms" }}>
          <StatCard
            icon={<TargetIcon className="h-6 w-6 text-amber-400" />}
            label="Total Leads"
            value={totalLeads}
            bgGlow="bg-amber-500/10 ring-amber-500/20"
          />
          <StatCard
            icon={<FlameIcon className="h-6 w-6 text-red-400" />}
            label="Hot Leads"
            value={hotLeads}
            bgGlow="bg-red-500/10 ring-red-500/20"
          />
          <StatCard
            icon={<UsersIcon className="h-6 w-6 text-blue-400" />}
            label="Total Executives"
            value={execsCount}
            bgGlow="bg-blue-500/10 ring-blue-500/20"
          />
          <StatCard
            icon={<BuildingIcon className="h-6 w-6 text-emerald-400" />}
            label="Organisations"
            value={orgsCount}
            bgGlow="bg-emerald-500/10 ring-emerald-500/20"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Leads by Temperature" delay="200ms">
            {sortedTempCounts.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-4">No data available</div>
            ) : (
              <div className="space-y-4 mt-2">
                {sortedTempCounts.map(([temp, count], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5 text-slate-300">
                      <span>{temp}</span>
                      <span className="font-semibold">{count} ({Math.round((count / totalLeads) * 100)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          temp.includes("Hot") ? "bg-red-500" : temp.includes("Warm") ? "bg-orange-400" : temp.includes("Cold") ? "bg-blue-400" : "bg-slate-500"
                        }`}
                        style={{ width: `${(count / totalLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Leads by Call Type" delay="300ms">
            {sortedTypeCounts.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-4">No data available</div>
            ) : (
              <div className="space-y-4 mt-2">
                {sortedTypeCounts.map(([type, count], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5 text-slate-300">
                      <span>{type}</span>
                      <span className="font-semibold">{count} ({Math.round((count / totalLeads) * 100)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-1000"
                        style={{ width: `${(count / totalLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden p-4 sm:p-6 animate-section" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-white">Recent Field Visits</h3>
            <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-amber-300" asChild>
              <Link href="/admin/leads">View All <ArrowRightIcon className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {recentLeads.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-6">No recent visits recorded.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentLeads.map((row) => (
                <div key={row.lead.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-200">{row.organisation?.orgName || "Unknown Org"}</p>
                      {row.lead.callTemperature && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] bg-white/[0.05] text-slate-400">
                          {row.lead.callTemperature}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Logged by <span className="text-amber-400">{row.executive?.name || "Unknown"}</span> • {row.lead.callType}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                    <CalendarIcon className="h-3 w-3" />
                    {row.lead.visitDate ? format(new Date(row.lead.visitDate), "dd MMM yyyy") : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgGlow }: { icon: React.ReactNode; label: string; value: number | string; bgGlow: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm flex items-center gap-4 transition-colors hover:bg-white/[0.03]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${bgGlow}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <h3 className="text-2xl font-display font-bold text-white mt-0.5">{value}</h3>
      </div>
    </div>
  );
}

function ChartCard({ title, delay, children }: { title: string; delay: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 animate-section" style={{ animationDelay: delay }}>
      <h3 className="font-display text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}