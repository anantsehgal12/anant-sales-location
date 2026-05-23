import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import Side from "../_components/admin/sidebar";
import Header from "../_components/admin/Header";

export const metadata: Metadata = {
  title: "Lead Management - Anant Sales"
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Side />
      <SidebarInset>
        <Header/>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
