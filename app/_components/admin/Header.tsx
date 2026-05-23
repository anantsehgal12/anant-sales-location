"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();

  // Mapping of page paths to titles - edit this object to change titles
  const pageTitles: Record<string, string> = {
    "/admin/leads": "Leads",
    "/admin/org": "Organisations",
    "/admin/executives": "Executives",
    // Add more paths and titles as needed
  };

  let title = pageTitles[pathname];
  if (!title && pathname.startsWith("/admin/leads/")) {
    title = "Lead Details";
  }
  title = title || "Page Title";

  return (
    <main>
      <div className="w-full h-10 border-b-2 flex justify-between items-center p-10">
        <SidebarTrigger />
        <section className="inline-flex gap-8">
        <h1 className="text-2xl font-bold font-display">{title}</h1>
        </section>
      </div>
    </main>
  );
}
